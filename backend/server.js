require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const db = require('./src/config/database');
const authController = require('./src/controllers/authController');
const moviesController = require('./src/controllers/moviesController');
const favoritesController = require('./src/controllers/favoritesController');
const commentsController = require('./src/controllers/commentsController');
const logController = require('./src/controllers/logController');
const profileController = require('./src/controllers/profileController');
const authMiddleware = require('./src/middlewares/auth');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do Multer (mantém arquivo em memória para jogar pro S3)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limite
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password', authController.resetPassword);
app.get('/api/auth/reset/:token', authController.checkResetToken);

app.use('/api/*', authMiddleware);

app.get('/api/profile', profileController.getProfile);
app.put('/api/profile', upload.single('foto'), profileController.updateProfile);

app.get('/api/movies', moviesController.searchMovies);
app.get('/api/movies/:id/details', moviesController.getMovieDetails);

app.post('/api/favorites', favoritesController.addFavorite);
app.get('/api/favorites', favoritesController.listFavorites);
app.delete('/api/favorites/:id', favoritesController.removeFavorite);

app.post('/api/comments', commentsController.addComment);
app.get('/api/comments', commentsController.listComments);
app.delete('/api/comments/:id', commentsController.removeComment);

app.get('/api/logs', logController.getLogs);

const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.json({ message: 'API Cine Mágico funcionando. O frontend está em outro container.' });
  });
}

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await db.initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor Cine Mágico rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error.message);
    process.exit(1);
  }
}

startServer();
