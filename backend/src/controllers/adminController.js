const db = require('../config/database');
const axios = require('axios');

const LOG_SERVICE_URL = process.env.LOG_SERVICE_URL || 'http://log-service:3002';

const adminController = {
  // Retorna métricas de negócio e faturamento para o painel de administração
  async getMetrics(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado: apenas administradores podem visualizar métricas de negócio.' });
      }

      // 1. Contagem de usuários por plano (Free e Pro)
      const planosResult = await db.query(
        'SELECT COALESCE(plano, "free") as plano, COUNT(*) as total FROM usuarios GROUP BY plano'
      );

      const usuariosPorPlano = { free: 0, pro: 0 };
      let totalUsuarios = 0;

      planosResult.forEach(row => {
        const p = row.plano || 'free';
        usuariosPorPlano[p] = Number(row.total);
        totalUsuarios += Number(row.total);
      });

      // 2. Assinaturas ativas no Stripe
      const assinaturasResult = await db.query(
        'SELECT COUNT(*) as total FROM usuarios WHERE subscription_status = "active"'
      );
      const assinaturasAtivas = Number(assinaturasResult[0]?.total || 0);

      // 3. Cálculo do MRR de Teste (Monthly Recurring Revenue)
      // Plano Pro custa R$ 19,90 por mês
      const valorMensalPro = 19.90;
      const mrr = Number((assinaturasAtivas * valorMensalPro).toFixed(2));

      // 4. Últimos eventos de auditoria do Redis Streams (via Log Service)
      let ultimosLogs = [];
      try {
        const logResponse = await axios.get(`${LOG_SERVICE_URL}/logs?limit=15`, { timeout: 3000 });
        ultimosLogs = logResponse.data?.logs || [];
      } catch (logErr) {
        console.warn('Aviso ao consultar logs no Log Service:', logErr.message);
      }

      // 5. Lista detalhada de assinantes recentes
      const assinantes = await db.query(
        `SELECT id, nome, email, plano, subscription_status, stripe_customer_id, subscription_current_period_end 
         FROM usuarios 
         ORDER BY id DESC 
         LIMIT 20`
      );

      res.json({
        total_usuarios: totalUsuarios,
        usuarios_por_plano: usuariosPorPlano,
        assinaturas_ativas: assinaturasAtivas,
        mrr_mensal: mrr,
        preco_pro: valorMensalPro,
        ultimos_logs: ultimosLogs,
        assinantes
      });
    } catch (error) {
      console.error('Erro ao gerar métricas do painel admin:', error);
      res.status(500).json({ error: 'Erro ao gerar métricas do painel admin' });
    }
  }
};

module.exports = adminController;
