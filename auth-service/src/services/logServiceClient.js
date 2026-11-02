const axios = require('axios');

const LOG_SERVICE_URL = process.env.LOG_SERVICE_URL || 'http://log-service:3002';

class LogServiceClient {
  async sendLog(usuario_id, acao, detalhes = {}) {
    try {
      await axios.post(`${LOG_SERVICE_URL}/api/logs`, {
        usuario_id,
        acao,
        detalhes
      });
    } catch (error) {
      console.error(`Falha ao enviar log de auditoria (${acao}):`, error.message);
    }
  }
}

module.exports = new LogServiceClient();
