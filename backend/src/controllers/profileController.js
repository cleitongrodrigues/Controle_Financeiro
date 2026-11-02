const db = require('../config/database');
const storageService = require('../services/storageService');
const logServiceClient = require('../services/logServiceClient');

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.user;

    const [usuarios] = await db.query('SELECT id, nome, email, bio, foto_perfil, criado_em FROM usuarios WHERE id = ?', [id]);
    
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const usuario = usuarios[0];

    // Gerar URL pré-assinada se existir foto
    if (usuario.foto_perfil) {
      usuario.foto_url = await storageService.getFileUrl(usuario.foto_perfil);
    }

    // Buscar favoritos do usuário
    const [favoritos] = await db.query('SELECT * FROM favoritos WHERE usuario_id = ? ORDER BY criado_em DESC', [id]);
    usuario.favoritos = favoritos;

    return res.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.user; // Pega ID apenas do token (evita que um usuário edite outro)
    const { bio } = req.body;
    
    let fotoPath = null;
    if (req.file) {
      fotoPath = await storageService.uploadFile(req.file.buffer, req.file.mimetype, req.file.originalname, id);
    }

    let query = 'UPDATE usuarios SET ';
    const queryParams = [];

    if (bio !== undefined) {
      query += 'bio = ?, ';
      queryParams.push(bio);
    }

    if (fotoPath) {
      query += 'foto_perfil = ?, ';
      queryParams.push(fotoPath);
    }

    // Remove last comma and space
    query = query.slice(0, -2);
    query += ' WHERE id = ?';
    queryParams.push(id);

    if (queryParams.length > 1) { // Só executa se tiver algo pra atualizar
      await db.query(query, queryParams);
      logServiceClient.sendLog(id, 'editar_perfil', { alterou_foto: !!fotoPath, alterou_bio: bio !== undefined });
    }

    return res.json({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};
