require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');

const db = require('./src/config/database');
const authController = require('./src/controllers/authController');
const passwordResetController = require('./src/controllers/passwordResetController');
const authMiddleware = require('./src/middlewares/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Auth routes (públicas - podem ser chamadas por frontend ou backend)
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/user/:id', authMiddleware, authController.getUser);

// Internal verification route (chamada apenas pelo backend internamente)
app.post('/api/auth/verify-token', authController.verifyToken);

// Password reset routes
app.post('/api/auth/forgot-password', passwordResetController.forgotPassword);
app.get('/api/auth/reset/:token', passwordResetController.checkToken);
app.post('/api/auth/reset-password', passwordResetController.resetPassword);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

const PORT = process.env.AUTH_SERVICE_PORT || 3001;

async function startServer() {
  try {
    await db.initDatabase();
    console.log('✓ Database initialized');

    app.listen(PORT, () => {
      console.log(`✓ Auth Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
