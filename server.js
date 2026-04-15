const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const FormData = require('form-data');
const app = express();
const PORT = process.env.PORT || 3030;

// Configurações do Express
app.use(cors());
app.use(express.json());

// ─── Sessão de Admin (senha verificada no servidor) ───────────────
// A senha NUNCA vai para o frontend — fica apenas aqui no servidor
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@Privacy2026';
const activeSessions = new Map(); // token -> expiry timestamp

function generateToken() {
    const arr = new Uint8Array(32);
    for (let i = 0; i < 32; i++) arr[i] = Math.floor(Math.random() * 256);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

app.post('/api/admin-login', (req, res) => {
    const { password } = req.body;
    if (!password || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Senha incorreta.' });
    }
    const token = generateToken();
    const expiry = Date.now() + 8 * 60 * 60 * 1000; // 8 horas
    activeSessions.set(token, expiry);
    res.json({ token });
});

app.get('/api/admin-check', (req, res) => {
    const token = req.headers['x-admin-token'] || '';
    const expiry = activeSessions.get(token);
    if (!expiry || Date.now() > expiry) {
        activeSessions.delete(token);
        return res.status(401).json({ valid: false });
    }
    res.json({ valid: true });
});

// Caminho do arquivo de banco de dados
const isVercel = process.env.VERCEL || process.env.AWS_REGION;
const DB_FILE = isVercel ? '/tmp/db.json' : path.join(__dirname, 'db.json');

// --- Supabase Config (Persistência Real no Vercel) ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function getDB() {
    // Se tiver Supabase configurado, usa ele (recomendado para Vercel)
    if (SUPABASE_URL && SUPABASE_KEY) {
        try {
            const url = `${SUPABASE_URL}/rest/v1/configs?id=eq.main&select=data`;
            const res = await axios.get(url, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            if (res.data && res.data[0]) return res.data[0].data;
        } catch (e) { console.error('Supabase Load Error:', e.message); }
    }

    // Fallback: Arquivo local
    try {
        let fileToRead = DB_FILE;
        if (isVercel && !fs.existsSync(DB_FILE) && fs.existsSync(path.join(__dirname, 'db.json'))) {
            fileToRead = path.join(__dirname, 'db.json');
        }
        if (fs.existsSync(fileToRead)) {
            return JSON.parse(fs.readFileSync(fileToRead, 'utf8'));
        }
    } catch (err) { console.error('Local Load Error:', err); }
    return {};
}

async function saveDB(data) {
    if (SUPABASE_URL && SUPABASE_KEY) {
        try {
            const url = `${SUPABASE_URL}/rest/v1/configs`;
            await axios.post(url, { id: 'main', data: data }, {
                headers: { 
                    'apikey': SUPABASE_KEY, 
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates' // Faz o UPSERT (Cria ou Atualiza)
                }
            });
            console.log('✅ Salvo no Supabase (Upsert)');
        } catch (e) {
            console.error('Supabase Save Error:', e.response?.data || e.message);
            // Se estiver no Vercel e o Supabase falhar, precisamos avisar o erro
            if (isVercel) throw new Error('Erro ao salvar no Supabase: ' + (e.response?.data?.message || e.message));
        }
    }

    // Sempre salva localmente também (ou no /tmp do Vercel)
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log('✅ Salvo no arquivo local');
    } catch (err) { console.error('Local Save Error:', err); }
}

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));
if (isVercel) {
    app.use('/uploads', express.static('/tmp/uploads'));
}

// Rota principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// --- Rotas de Admin ---

app.get('/api/load-config', async (req, res) => {
    try {
        const data = await getDB();
        // SEGURANÇA: nunca enviar o token para o frontend
        delete data.syncpay_secret;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar configurações' });
    }
});

app.post('/api/save-config', async (req, res) => {
    try {
        const newData = req.body;
        const existingData = await getDB();
        
        // SEGURANÇA: preservar o token salvo anteriormente
        let existingToken = process.env.PUSHINPAY_TOKEN || existingData.syncpay_secret || '';
        
        newData.syncpay_secret = (newData.syncpay_secret && newData.syncpay_secret.trim())
            ? newData.syncpay_secret.trim()
            : existingToken;

        await saveDB(newData);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'file-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream(req.file.path), {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 60000 // Aumentado para 60s
        });

        const url = response.data;
        
        if (url && typeof url === 'string' && url.startsWith('http')) {
            console.log('Upload concluído no catbox:', url);
            // Remove arquivo temporário
            try { fs.unlinkSync(req.file.path); } catch(e) {}
            res.json({ url: url });
        } else {
            console.error('Resposta inválida do catbox:', url);
            // Mantém o arquivo local como fallback
            res.json({ url: '/uploads/' + req.file.filename });
        }
    } catch (err) {
        console.error('Erro no upload para o catbox:', err.message);
        // Mantém o arquivo local como fallback no Vercel (/tmp/uploads)
        res.json({ url: '/uploads/' + req.file.filename });
    }
});


// --- Rota de Pagamento (PUSHINPAY) ---

app.post('/pagamento', async (req, res) => {
    try {
        const { amount } = req.body;
        
        // Busca as configurações (do Supabase ou do db.json local)
        const dbConfig = await getDB();

        const TOKEN = process.env.PUSHINPAY_TOKEN || dbConfig.syncpay_secret || '';

        if (!amount) return res.status(400).json({ error: 'Valor não informado.' });

        console.log('--- Requisitando PIX a PushinPay ---');
        console.log('Valor:', amount);

        // PushinPay exige o valor em centavos (integer)
        const valueCents = Math.round(parseFloat(amount) * 100);

        const payload = {
            value: valueCents,
            webhook_url: '' 
        };

        const response = await axios.post('https://api.pushinpay.com.br/api/pix/cashIn', payload, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 20000
        });

        const data = response.data;
        console.log('✅ Sucesso da PushinPay!');

        return res.json({
            qr_code: data.qr_code_base64 || data.qrCodeBase64 || '',
            pay_in_code: data.copy_and_paste || data.qr_code || ''
        });

    } catch (error) {
        console.error('❌ Erro na PushinPay API!');
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
        const fullDetails = error.response?.data || {};
        
        console.error('Mensagem:', errorMsg);
        console.error('Detalhes Completos:', JSON.stringify(fullDetails));

        res.status(500).json({ 
            error: 'Falha na PushinPay: ' + errorMsg,
            details: fullDetails 
        });
    }
});

app.get('/status', (req, res) => res.json({ status: 'Online', gateway: 'PushinPay' }));

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Exporta o app para Vercel via Serverless Functions
module.exports = app;
