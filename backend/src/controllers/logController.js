const axios = require('axios');
const LOG_SERVICE_URL = process.env.LOG_SERVICE_URL || 'http://log-service:3002';

exports.getLogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      // Registrar também a tentativa de ver logs sem ser admin
      try {
        await axios.post(`${LOG_SERVICE_URL}/api/logs`, {
          usuario_id: req.user.id,
          acao: 'tentativa_acesso_logs',
          detalhes: { error: '403 Forbidden' }
        });
      } catch (e) {}

      return res.status(403).json({ error: 'Permissão insuficiente' });
    }
    
    const limit = req.query.limit || 50;
    const response = await axios.get(`${LOG_SERVICE_URL}/api/logs?limit=${limit}`);
    return res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar logs:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar logs de auditoria' });
  }
};
