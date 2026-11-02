const db = require('../config/database');

exports.addComment = async (req, res) => {
  const { tmdb_movie_id, texto } = req.body;
  const usuario_id = req.user.id;

  if (!tmdb_movie_id || !texto || !texto.trim()) {
    return res.status(400).json({ error: 'Comentário inválido' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO comentarios (usuario_id, tmdb_movie_id, texto) VALUES (?, ?, ?)',
      [usuario_id, Number(tmdb_movie_id), texto.trim()]
    );

    require('../services/logServiceClient').sendLog(usuario_id, 'comentar', { tmdb_movie_id: Number(tmdb_movie_id), comment_id: result.insertId });

    return res.status(201).json({
      id: result.insertId,
      usuario_id,
      tmdb_movie_id: Number(tmdb_movie_id),
      texto: texto.trim()
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao adicionar comentário' });
  }
};

exports.listComments = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const [rows] = isAdmin
      ? await db.query(
          `SELECT comentarios.*, usuarios.email AS autor_email
           FROM comentarios
           INNER JOIN usuarios ON usuarios.id = comentarios.usuario_id
           ORDER BY comentarios.criado_em DESC`
        )
      : await db.query(
          `SELECT comentarios.*, usuarios.email AS autor_email
           FROM comentarios
           INNER JOIN usuarios ON usuarios.id = comentarios.usuario_id
           WHERE comentarios.usuario_id = ?
           ORDER BY comentarios.criado_em DESC`,
          [req.user.id]
        );

    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao listar comentários' });
  }
};

exports.removeComment = async (req, res) => {
  const { id } = req.params;

  try {
    const commentId = Number(id);

    if (!Number.isInteger(commentId) || commentId <= 0) {
      return res.status(400).json({ error: 'Comentário inválido' });
    }

    const [rows] = await db.query(
      'SELECT id, usuario_id FROM comentarios WHERE id = ?',
      [commentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    const comment = rows[0];
    const isOwner = comment.usuario_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      require('../services/logServiceClient').sendLog(req.user.id, 'tentativa_moderacao_negada', { comment_id: commentId });
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }

    const [result] = await db.query('DELETE FROM comentarios WHERE id = ?', [commentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    require('../services/logServiceClient').sendLog(req.user.id, 'apagar_comentario', { comment_id: commentId, type: isAdmin && !isOwner ? 'moderacao' : 'proprio' });

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao remover comentário' });
  }
};
