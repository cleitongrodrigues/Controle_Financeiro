const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

module.exports = {
  async register(req, res) {
    try {
      const { nome, email, password } = req.body;

      if (!nome || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      // Verificar se usuário já existe
      const usuarios = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (usuarios.length > 0) {
        return res.status(409).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(password, 10);

      // Inserir usuário
      await db.query(
        'INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)',
        [nome.trim(), email, senhaHash, 'usuario']
      );

      res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      // Buscar usuário
      const usuarios = await db.query('SELECT id, email, senha_hash, role FROM usuarios WHERE email = ?', [email]);
      if (usuarios.length === 0) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      const usuario = usuarios[0];

      // Verificar senha
      const senhaValida = await bcrypt.compare(password, usuario.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      // Gerar JWT
      const token = jwt.sign(
        { id: usuario.id, email: usuario.email, role: usuario.role },
        process.env.JWT_SECRET || 'seu-secret-key',
        { expiresIn: '24h' }
      );

      require('../services/logServiceClient').sendLog(usuario.id, 'login', { email: usuario.email });

      res.json({ token, user: { id: usuario.id, email: usuario.email, role: usuario.role } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  },

  async verifyToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu-secret-key');

      // Buscar dados atuais do usuário (role pode ter mudado)
      const usuarios = await db.query('SELECT id, email, role FROM usuarios WHERE id = ?', [decoded.id]);
      if (usuarios.length === 0) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      const usuario = usuarios[0];
      res.json({ valid: true, user: usuario });
    } catch (error) {
      res.status(401).json({ valid: false, error: 'Token inválido ou expirado' });
    }
  },

  async getUser(req, res) {
    try {
      const { id } = req.params;
      const usuarios = await db.query('SELECT id, email, role FROM usuarios WHERE id = ?', [id]);

      if (usuarios.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json(usuarios[0]);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  },
};
