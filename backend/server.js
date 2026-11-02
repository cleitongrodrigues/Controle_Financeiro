require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const db = require('./src/config/database');
const authController = require('./src/controllers/authController');
const accountsController = require('./src/controllers/accountsController');
const transactionsController = require('./src/controllers/transactionsController');
const categoriesController = require('./src/controllers/categoriesController');
const logController = require('./src/controllers/logController');
const profileController = require('./src/controllers/profileController');
const stripeController = require('./src/controllers/stripeController');
const adminController = require('./src/controllers/adminController');
const authMiddleware = require('./src/middlewares/auth');
const storageService = require('./src/services/storageService');
const multer = require('multer');

const app = express();
app.use(cors());

// Captura rawBody para validação da assinatura criptográfica dos Webhooks do Stripe
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Configuração do Multer (mantém arquivo em memória para upload no MinIO)
// Permite imagens (PNG, JPG, WEBP) e documentos (PDF)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limite para notas fiscais/comprovantes
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Formato inválido. Apenas imagens e PDFs são permitidos.'));
    }
  }
});

// Rotas públicas de Autenticação (proxy para o auth-service)
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password', authController.resetPassword);
app.get('/api/auth/reset/:token', authController.checkResetToken);

// Visualização direta de comprovantes arquivados no MinIO
app.get('/api/comprovantes/download', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).send('Chave de comprovante não informada');
    
    const stream = await storageService.getFileStream(key);
    res.setHeader('Content-Type', stream.ContentType || 'application/octet-stream');
    stream.Body.pipe(res);
  } catch (err) {
    console.error('Erro ao baixar comprovante:', err.message);
    res.status(404).send('Comprovante não encontrado');
  }
});

// Webhook do Stripe (Público, recebe notificações automáticas do Stripe)
app.post('/api/stripe/webhook', stripeController.handleWebhook);

// Todas as rotas abaixo exigem autenticação via JWT
app.use('/api/*', authMiddleware);

// Assinaturas e Planos SaaS (Stripe)
app.get('/api/stripe/status', stripeController.getStatus);
app.post('/api/stripe/checkout-session', stripeController.createCheckoutSession);
app.post('/api/stripe/portal-session', stripeController.createPortalSession);

// Painel Administrativo de Métricas e Negócio (Apenas Admin)
app.get('/api/admin/metrics', adminController.getMetrics);

// Perfil do Usuário
app.get('/api/profile', profileController.getProfile);
app.put('/api/profile', upload.single('foto'), profileController.updateProfile);

// Categorias Financeiras
app.get('/api/categorias', categoriesController.listCategories);

// Contas Financeiras (Pessoal e Conjunta)
app.get('/api/contas', accountsController.listAccounts);
app.post('/api/contas', accountsController.createAccount);
app.post('/api/contas/entrar', accountsController.joinAccount);
app.get('/api/contas/:id', accountsController.getAccountDetails);
app.delete('/api/contas/:id', accountsController.deleteAccount);

// Transações Financeiras (CRUD completo com suporte a anexo de comprovante)
app.get('/api/transacoes', transactionsController.listTransactions);
app.post('/api/transacoes', upload.single('comprovante'), transactionsController.createTransaction);
app.get('/api/transacoes/:id', transactionsController.getTransaction);
app.put('/api/transacoes/:id', upload.single('comprovante'), transactionsController.updateTransaction);
app.delete('/api/transacoes/:id', transactionsController.deleteTransaction);

// Auditoria e Logs (Apenas Admin)
app.get('/api/logs', logController.getLogs);

// Servir frontend se compilado
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.json({ message: 'API Conta Comigo funcionando. O frontend está em outro container.' });
  });
}

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await db.initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Servidor Conta Comigo rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error.message);
    process.exit(1);
  }
}

startServer();
