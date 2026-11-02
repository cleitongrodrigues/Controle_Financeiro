const authServiceClient = require('../services/authServiceClient');

module.exports = {
  async register(req, res) {
    try {
      const { nome, email, password } = req.body;

      if (!nome || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      const result = await authServiceClient.register(nome, email, password);
      return res.status(201).json(result);
    } catch (error) {
      console.error('Register error:', error);
      return res.status(error.status || 500).json(error);
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const result = await authServiceClient.login(email, password);
      return res.json(result);
    } catch (error) {
      console.error('Login error:', error);
      return res.status(error.status || 500).json(error);
    }
  },

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      const result = await authServiceClient.forgotPassword(email);
      return res.json(result);
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(error.status || 500).json(error);
    }
  },

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token e senha são obrigatórios' });
      }

      const result = await authServiceClient.resetPassword(token, password);
      return res.json(result);
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(error.status || 500).json(error);
    }
  },

  async checkResetToken(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      const result = await authServiceClient.checkResetToken(token);
      return res.json(result);
    } catch (error) {
      console.error('Check reset token error:', error);
      return res.status(error.status || 500).json(error);
    }
  },
};
