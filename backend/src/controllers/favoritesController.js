const db = require('../config/database');

exports.addFavorite = async (req, res) => {
  const { tmdb_movie_id, titulo, poster_path } = req.body;
  const usuario_id = req.user.id;

  if (!tmdb_movie_id || !titulo) {
    return res.status(400).json({ error: 'Dados do filme inválidos' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id FROM favoritos WHERE usuario_id = ? AND tmdb_movie_id = ?',
      [usuario_id, Number(tmdb_movie_id)]
    );

    if (rows && rows.length > 0) {
      return res.status(400).json({ error: 'Filme já favoritado' });
    }

    const [result] = await db.query(
      'INSERT INTO favoritos (usuario_id, tmdb_movie_id, titulo, poster_path) VALUES (?, ?, ?, ?)',
      [usuario_id, Number(tmdb_movie_id), titulo, poster_path || '']
    );

    require('../services/logServiceClient').sendLog(usuario_id, 'favoritar', { tmdb_movie_id: Number(tmdb_movie_id), titulo });

    return res.status(201).json({
      id: result.insertId,
      usuario_id,
      tmdb_movie_id: Number(tmdb_movie_id),
      titulo,
      poster_path: poster_path || ''
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao adicionar favorito' });
  }
};

exports.listFavorites = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM favoritos WHERE usuario_id = ? ORDER BY criado_em DESC',
      [req.user.id]
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao listar favoritos' });
  }
};

exports.removeFavorite = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM favoritos WHERE id = ? AND usuario_id = ?',
      [Number(id), req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Favorito não encontrado' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao remover favorito' });
  }
};
