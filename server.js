const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do Express
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (HTML, CSS, JS) do diretório atual
app.use(express.static(path.join(__dirname)));

// Rota principal (Fallback explícito para o frontend)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Caminho do arquivo de banco de dados
const DB_FILE = path.join(__dirname, 'db.json');

// --- Rotas de Admin (Substituindo o antigo PHP) ---

// 1. Carregar Configurações (antigo load-config.php)
app.get('/api/load-config', (req, res) => {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.json({});
        }
    } catch (err) {
        console.error('Erro ao ler DB:', err);
        res.status(500).json({ error: 'Erro ao carregar configurações' });
    }
});

// 2. Salvar Configurações (antigo save-config.php)
app.post('/api/save-config', (req, res) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(req.body, null, 2), 'utf8');
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao salvar DB:', err);
        res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
});

// Configuração do Multer para Upload de Imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'file-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 3. Upload de Arquivos (antigo upload.php)
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }
    // Retorna a URL relativa do arquivo para o Admin.js usar
    const fileUrl = '/uploads/' + req.file.filename;
    res.json({ url: fileUrl });
});

// --- Fim das Rotas de Admin ---

// Rota de pagamento (Unificada para SuitPay e SyncPay)
app.post('/pagamento', async (req, res) => {
    try {
        const { amount, value, client, customerDetails } = req.body;
        const finalAmount = amount || value;
        const finalClient = client || customerDetails;

        if (!finalAmount || !finalClient) {
            return res.status(400).json({ error: 'Dados de pagamento incompletos (valor ou cliente ausentes).' });
        }

        // Tenta pegar configurações do db.json para SyncPay primeiro (se configurado no admin)
        let dbConfig = {};
        if (fs.existsSync(DB_FILE)) {
            dbConfig = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }

        // --- Detecção de Gateway e Credenciais ---
        
        // 1. Prioridade para SyncPay (se houver credenciais específicas)
        const syncId = process.env.SYNCPAY_CLIENT_ID || dbConfig.syncpay_id;
        const syncSecret = process.env.SYNCPAY_CLIENT_SECRET || dbConfig.syncpay_secret;
        const syncUrl = process.env.SYNCPAY_BASE_URL || dbConfig.syncpay_url || 'https://api.syncpayments.com.br';

        if (syncId && syncSecret) {
            console.log('Utilizando Gateway: SyncPay');
            // Correção conforme documentação real da SyncPay
            const payloadSync = {
                amount: parseFloat(finalAmount),
                customer: {
                    name: finalClient.name,
                    email: finalClient.email,
                    cpf: finalClient.document // Documentação usa .cpf em vez de .document
                }
            };
            
            // Tenta múltiplos endpoints comuns para SyncPay (v2, v1, etc)
            const endpoints = ['/api/v2/pix', '/api/v1/pix', '/v1/pix'];
            let lastError;

            for (const endpoint of endpoints) {
                try {
                    const fullUrl = syncUrl.endsWith('/') ? syncUrl.slice(0, -1) + endpoint : syncUrl + endpoint;
                    console.log(`Tentando endpoint SyncPay: ${fullUrl}`);
                    
                    const response = await axios.post(fullUrl, payloadSync, {
                        headers: {
                            'x-api-key': syncSecret,
                            'x-client-id': syncId,
                            'Content-Type': 'application/json'
                        },
                        timeout: 5000 
                    });

                    // Correção na captura da resposta da SyncPay
                    if (response.data?.paymentCodeBase64) {
                        return res.json({
                            qr_code: response.data.paymentCodeBase64 || '',
                            pay_in_code: response.data.paymentCode || response.data.pix_copy_paste || ''
                        });
                    }
                    // Fallback para o formato antigo se necessário
                    if (response.data?.qr_code || response.data?.data?.qr_code) {
                        return res.json({
                            qr_code: response.data?.qr_code || response.data?.data?.qr_code || '',
                            pay_in_code: response.data?.pay_in_code || response.data?.data?.pay_in_code || ''
                        });
                    }
                } catch (err) {
                    console.warn(`Falha no endpoint ${endpoint}: ${err.message}`);
                    lastError = err;
                    if (err.response?.status !== 404) break; 
                }
            }
            
            console.warn('SyncPay falhou completamente. Tentando SuitPay como fallback...');
        }

        // 2. Fallback para SuitPay
        const suitId = process.env.SUIT_CI || process.env.API_KEY;
        const suitSecret = process.env.SUIT_CS || process.env.API_KEY;

        if (suitId && suitSecret) {
            console.log('Utilizando Gateway: SuitPay');
            const payloadSuit = {
                requestNumber: 'PRV_' + Date.now(),
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                amount: parseFloat(finalAmount),
                client: {
                    name: finalClient.name,
                    document: finalClient.document,
                    email: finalClient.email
                }
            };

            const response = await axios.post('https://ws.suitpay.app/api/v1/gateway/request-qrcode', payloadSuit, {
                headers: {
                    'ci': suitId,
                    'cs': suitSecret,
                    'Authorization': `Bearer ${suitSecret}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.json({
                qr_code: response.data?.qr_code || response.data?.data?.qr_code || '',
                pay_in_code: response.data?.pay_in_code || response.data?.data?.pay_in_code || response.data?.pix_copy_paste || ''
            });
        }

        // Caso nenhum gateway esteja configurado
        console.error('Nenhuma credencial de API encontrada (SyncPay ou SuitPay).');
        return res.status(500).json({ 
            error: 'Erro de configuração: Credenciais de API não encontradas no Railway ou no Painel Admin.' 
        });

    } catch (error) {
        console.error('Erro no processamento do pagamento:', error.message);
        res.status(500).json({ 
            error: 'Falha ao processar o pagamento na API externa.',
            details: error.response?.data || error.message
        });
    }
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso! Acesse: http://localhost:${PORT}`);
});
