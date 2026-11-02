const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const emailService = require('../services/emailService');

module.exports = {
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      // Verificar se usuário existe
      const usuarios = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (usuarios.length === 0) {
        // Não informar que o email não existe (segurança)
        return res.json({ message: 'Se o email existe em nosso sistema, um link foi enviado' });
      }

      const usuario = usuarios[0];

      // Gerar token
      const token = uuidv4();
      const agora = new Date();
      const expira = new Date(agora.getTime() + 30 * 60000); // 30 minutos

      // Salvar token no banco
      await db.query(
        'INSERT INTO reset_tokens (token, usuario_id, expira_em) VALUES (?, ?, ?)',
        [token, usuario.id, expira]
      );

      // Enviar email
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8201'}/reset?token=${token}`;
      await emailService.sendPasswordReset(email, resetLink);

      res.json({ message: 'Link de redefinição enviado para o email' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
  },

  async checkToken(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      // Buscar token
      const tokens = await db.query(
        'SELECT id, usuario_id, expira_em, usado FROM reset_tokens WHERE token = ?',
        [token]
      );

      if (tokens.length === 0) {
        return res.status(404).json({ error: 'Token não encontrado' });
      }

      const resetToken = tokens[0];

      // Verificar expiração
      if (new Date() > new Date(resetToken.expira_em)) {
        return res.status(401).json({ error: 'Token expirado' });
      }

      // Verificar se já foi usado
      if (resetToken.usado) {
        return res.status(401).json({ error: 'Token já foi utilizado' });
      }

      res.json({ valid: true, usuario_id: resetToken.usuario_id });
    } catch (error) {
      console.error('Check token error:', error);
      res.status(500).json({ error: 'Erro ao validar token' });
    }
  },

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token e senha são obrigatórios' });
      }

      // Buscar token
      const tokens = await db.query(
        'SELECT id, usuario_id, expira_em, usado FROM reset_tokens WHERE token = ?',
        [token]
      );

      if (tokens.length === 0) {
        return res.status(404).json({ error: 'Token não encontrado' });
      }

      const resetToken = tokens[0];

      // Verificar expiração
      if (new Date() > new Date(resetToken.expira_em)) {
        return res.status(401).json({ error: 'Token expirado' });
      }

      // Verificar se já foi usado
      if (resetToken.usado) {
        return res.status(401).json({ error: 'Token já foi utilizado' });
      }

      // Hash da nova senha
      const senhaHash = await bcrypt.hash(password, 10);

      // Atualizar senha do usuário
      await db.query('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [senhaHash, resetToken.usuario_id]);

      // Marcar token como usado
      await db.query('UPDATE reset_tokens SET usado = TRUE WHERE id = ?', [resetToken.id]);

      res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
  },
};
