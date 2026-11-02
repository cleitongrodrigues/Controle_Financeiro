const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

module.exports = {
  async register(req, res) {
    try {
      const { nome, email, password, role } = req.body;

      if (!nome || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      // Validar papéis do negócio (titular, membro, admin)
      const validRoles = ['admin', 'titular', 'membro'];
      const userRole = validRoles.includes(role) ? role : 'titular';

      // Verificar se usuário já existe
      const usuarios = await db.query('SELECT id FROM usuarios WHERE email = ?', [email.toLowerCase().trim()]);
      if (usuarios.length > 0) {
        return res.status(409).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(password, 10);

      // Inserir usuário
      const result = await db.query(
        'INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)',
        [nome.trim(), email.toLowerCase().trim(), senhaHash, userRole]
      );

      const novoUsuarioId = result.insertId;

      try {
        require('../services/logServiceClient').sendLog(novoUsuarioId, 'usuario_cadastrado', {
          email: email.toLowerCase().trim(),
          role: userRole
        });
      } catch (e) {}

      res.status(201).json({ 
        message: 'Usuário cadastrado com sucesso', 
        user: { id: novoUsuarioId, nome: nome.trim(), email: email.toLowerCase().trim(), role: userRole } 
      });
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
      const usuarios = await db.query(
        'SELECT id, nome, email, senha_hash, role, foto_perfil FROM usuarios WHERE email = ?', 
        [email.toLowerCase().trim()]
      );
      if (usuarios.length === 0) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      const usuario = usuarios[0];

      // Verificar senha
      const senhaValida = await bcrypt.compare(password, usuario.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      // Gerar JWT com papéis do negócio
      const token = jwt.sign(
        { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
        process.env.JWT_SECRET || 'seu-secret-key-muito-seguro-aqui-2024',
        { expiresIn: '24h' }
      );

      try {
        require('../services/logServiceClient').sendLog(usuario.id, 'login', { 
          email: usuario.email, 
          role: usuario.role 
        });
      } catch (e) {}

      res.json({ 
        token, 
        user: { 
          id: usuario.id, 
          nome: usuario.nome, 
          email: usuario.email, 
          role: usuario.role,
          foto_perfil: usuario.foto_perfil
        } 
      });
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

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu-secret-key-muito-seguro-aqui-2024');

      // Buscar dados atuais do usuário (role pode ter mudado)
      const usuarios = await db.query(
        'SELECT id, nome, email, role, foto_perfil FROM usuarios WHERE id = ?', 
        [decoded.id]
      );
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
      const usuarios = await db.query(
        'SELECT id, nome, email, role, bio, foto_perfil, criado_em FROM usuarios WHERE id = ?', 
        [id]
      );

      if (usuarios.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json(usuarios[0]);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  }
};
