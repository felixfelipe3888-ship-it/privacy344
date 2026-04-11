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

// Caminho do arquivo de banco de dados
const isVercel = process.env.VERCEL || process.env.AWS_REGION;
const DB_FILE = isVercel ? '/tmp/db.json' : path.join(__dirname, 'db.json');

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));
if (isVercel) {
    // No Vercel, os uploads temporários ficam em /tmp/uploads
    // Mapeamos a rota /uploads para esse diretório
    app.use('/uploads', express.static('/tmp/uploads'));
}

// Rota principal (Unificada)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// --- Rotas de Admin ---

app.get('/api/load-config', (req, res) => {
    try {
        let fileToRead = DB_FILE;
        if (isVercel && !fs.existsSync(DB_FILE) && fs.existsSync(path.join(__dirname, 'db.json'))) {
            fileToRead = path.join(__dirname, 'db.json');
        }
        if (fs.existsSync(fileToRead)) {
            const data = JSON.parse(fs.readFileSync(fileToRead, 'utf8'));
            // SEGURANÇA: nunca enviar o token para o frontend
            delete data.syncpay_secret;
            res.json(data);
        } else {
            res.json({});
        }
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar configurações' });
    }
});

app.post('/api/save-config', (req, res) => {
    try {
        const newData = req.body;
        // SEGURANÇA: preservar o token salvo anteriormente - jamais sobrescrever com vazio
        // O token só pode ser atualizado se vier explicitamente no body E não for vazio
        let existingToken = process.env.PUSHINPAY_TOKEN || '';
        if (fs.existsSync(DB_FILE)) {
            try {
                const existing = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
                existingToken = existing.syncpay_secret || existingToken;
            } catch(e) {}
        }
        // Só atualiza o token se o frontend enviou um novo valor não-vazio
        newData.syncpay_secret = (newData.syncpay_secret && newData.syncpay_secret.trim())
            ? newData.syncpay_secret.trim()
            : existingToken;
        fs.writeFileSync(DB_FILE, JSON.stringify(newData, null, 2), 'utf8');
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
        
        let dbConfig = {};
        if (fs.existsSync(DB_FILE)) {
            try { dbConfig = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) {}
        }

        const FALLBACK_TOKEN = '64434|qlpNhgXR6IKWr5KKLcxGr5KyeyiQaEOn1SyzduKVdda6701c';
        const TOKEN = process.env.PUSHINPAY_TOKEN || dbConfig.syncpay_secret || FALLBACK_TOKEN;

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
