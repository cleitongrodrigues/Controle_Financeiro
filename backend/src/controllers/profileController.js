const db = require('../config/database');
const storageService = require('../services/storageService');
const logServiceClient = require('../services/logServiceClient');

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.user;

    const usuarios = await db.query(
      'SELECT id, nome, email, role, bio, foto_perfil, criado_em FROM usuarios WHERE id = ?', 
      [id]
    );
    
    if (!usuarios || usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const usuario = usuarios[0];

    // Gerar URL pré-assinada se existir foto de perfil no MinIO
    if (usuario.foto_perfil) {
      usuario.foto_url = await storageService.getFileUrl(usuario.foto_perfil);
    }

    // Buscar contas das quais o usuário participa
    const contas = await db.query(
      `SELECT c.id, c.nome, c.tipo, c.saldo, mc.papel, mc.criado_em as membro_desde
       FROM contas c
       JOIN membros_conta mc ON c.id = mc.conta_id
       WHERE mc.usuario_id = ?
       ORDER BY c.criado_em ASC`,
      [id]
    );
    usuario.contas = Array.isArray(contas) ? contas : [];

    return res.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { bio, nome } = req.body;
    
    let fotoPath = null;
    if (req.file) {
      fotoPath = await storageService.uploadFotoPerfil(req.file.buffer, req.file.mimetype, req.file.originalname, id);
    }

    let query = 'UPDATE usuarios SET ';
    const queryParams = [];

    if (nome && nome.trim()) {
      query += 'nome = ?, ';
      queryParams.push(nome.trim());
    }

    if (bio !== undefined) {
      query += 'bio = ?, ';
      queryParams.push(bio);
    }

    if (fotoPath) {
      query += 'foto_perfil = ?, ';
      queryParams.push(fotoPath);
    }

    if (queryParams.length > 0) {
      query = query.slice(0, -2);
      query += ' WHERE id = ?';
      queryParams.push(id);

      await db.query(query, queryParams);
      logServiceClient.sendLog(id, 'editar_perfil', { alterou_foto: !!fotoPath, alterou_bio: bio !== undefined });
    }

    return res.json({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};
