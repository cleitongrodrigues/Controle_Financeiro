const db = require('../config/database');

module.exports = {
  async listCategories(req, res) {
    try {
      const [categories] = await db.query(
        'SELECT id, nome, tipo, icone, cor FROM categorias ORDER BY tipo DESC, nome ASC'
      );
      res.json(categories);
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      res.status(500).json({ error: 'Erro ao listar categorias' });
    }
  }
};
