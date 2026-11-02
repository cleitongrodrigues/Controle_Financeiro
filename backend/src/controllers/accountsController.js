const crypto = require('crypto');
const db = require('../config/database');
const logServiceClient = require('../services/logServiceClient');

function generateInviteCode(accountName) {
  const prefix = accountName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'FIN';
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${randomStr}`;
}

module.exports = {
  // Listar todas as contas das quais o usuário participa
  async listAccounts(req, res) {
    try {
      const usuario_id = req.user.id;

      let accounts = await db.query(
        `SELECT c.id, c.nome, c.tipo, c.saldo, c.codigo_convite, c.criado_em, mc.papel,
                (SELECT COUNT(*) FROM membros_conta WHERE conta_id = c.id) as total_membros
         FROM contas c
         JOIN membros_conta mc ON c.id = mc.conta_id
         WHERE mc.usuario_id = ?
         ORDER BY c.criado_em ASC`,
        [usuario_id]
      );

      // Se o usuário ainda não tiver nenhuma conta, cria uma conta pessoal padrão automaticamente
      if (!accounts || accounts.length === 0) {
        const inviteCode = generateInviteCode('Pessoal');
        const result = await db.query(
          'INSERT INTO contas (nome, tipo, saldo, criador_id, codigo_convite) VALUES (?, ?, ?, ?, ?)',
          ['Minhas Finanças (Pessoal)', 'pessoal', 0.00, usuario_id, inviteCode]
        );
        const novaContaId = result.insertId;

        await db.query(
          'INSERT INTO membros_conta (conta_id, usuario_id, papel) VALUES (?, ?, ?)',
          [novaContaId, usuario_id, 'titular']
        );

        logServiceClient.sendLog(usuario_id, 'conta_criada', {
          conta_id: novaContaId,
          nome: 'Minhas Finanças (Pessoal)',
          tipo: 'pessoal'
        });

        accounts = [{
          id: novaContaId,
          nome: 'Minhas Finanças (Pessoal)',
          tipo: 'pessoal',
          saldo: 0.00,
          codigo_convite: inviteCode,
          papel: 'titular',
          total_membros: 1
        }];
      }

      res.json(Array.isArray(accounts) ? accounts : []);
    } catch (error) {
      console.error('Erro ao listar contas:', error);
      res.status(500).json({ error: 'Erro ao listar contas financeiras' });
    }
  },

  // Criar uma nova conta (Pessoal ou Conjunta)
  async createAccount(req, res) {
    try {
      const usuario_id = req.user.id;
      const { nome, tipo } = req.body;

      if (!nome || !nome.trim()) {
        return res.status(400).json({ error: 'Nome da conta é obrigatório' });
      }

      const tipoConta = tipo === 'conjunta' ? 'conjunta' : 'pessoal';
      const inviteCode = generateInviteCode(nome);

      const result = await db.query(
        'INSERT INTO contas (nome, tipo, saldo, criador_id, codigo_convite) VALUES (?, ?, ?, ?, ?)',
        [nome.trim(), tipoConta, 0.00, usuario_id, inviteCode]
      );
      const contaId = result.insertId;

      await db.query(
        'INSERT INTO membros_conta (conta_id, usuario_id, papel) VALUES (?, ?, ?)',
        [contaId, usuario_id, 'titular']
      );

      logServiceClient.sendLog(usuario_id, 'conta_criada', {
        conta_id: contaId,
        nome: nome.trim(),
        tipo: tipoConta
      });

      res.status(201).json({
        id: contaId,
        nome: nome.trim(),
        tipo: tipoConta,
        saldo: 0.00,
        codigo_convite: inviteCode,
        papel: 'titular'
      });
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      res.status(500).json({ error: 'Erro ao criar conta financeira' });
    }
  },

  // Detalhes da conta (com isolamento multi-tenancy rigoroso)
  async getAccountDetails(req, res) {
    try {
      const usuario_id = req.user.id;
      const { id } = req.params;

      // Isolamento: verificar se o usuário é membro da conta solicitada ou admin
      const memberships = await db.query(
        'SELECT papel FROM membros_conta WHERE conta_id = ? AND usuario_id = ?',
        [id, usuario_id]
      );

      if ((!memberships || memberships.length === 0) && req.user.role !== 'admin') {
        logServiceClient.sendLog(usuario_id, 'acesso_negado_conta', {
          conta_solicitada_id: id,
          motivo: 'Usuário não pertence a esta conta'
        });
        return res.status(403).json({ error: 'Acesso negado: você não tem permissão para acessar esta conta' });
      }

      const accounts = await db.query(
        'SELECT id, nome, tipo, saldo, codigo_convite, criador_id, criado_em FROM contas WHERE id = ?',
        [id]
      );

      if (!accounts || accounts.length === 0) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      const conta = accounts[0];

      // Buscar membros da conta
      const membros = await db.query(
        `SELECT u.id, u.nome, u.email, u.foto_perfil, mc.papel, mc.criado_em as membro_desde
         FROM membros_conta mc
         JOIN usuarios u ON mc.usuario_id = u.id
         WHERE mc.conta_id = ?`,
        [id]
      );

      // Calcular receitas e despesas totais da conta
      const stats = await db.query(
        `SELECT 
           COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as total_receitas,
           COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as total_despesas
         FROM transacoes WHERE conta_id = ?`,
        [id]
      );

      conta.membros = Array.isArray(membros) ? membros : [];
      conta.total_receitas = stats && stats.length > 0 ? Number(stats[0].total_receitas) : 0;
      conta.total_despesas = stats && stats.length > 0 ? Number(stats[0].total_despesas) : 0;
      conta.saldo_calculado = conta.total_receitas - conta.total_despesas;
      conta.meu_papel = memberships && memberships.length > 0 ? memberships[0].papel : 'admin';

      res.json(conta);
    } catch (error) {
      console.error('Erro ao buscar detalhes da conta:', error);
      res.status(500).json({ error: 'Erro ao buscar detalhes da conta' });
    }
  },

  // Entrar numa conta conjunta usando código de convite
  async joinAccount(req, res) {
    try {
      const usuario_id = req.user.id;
      const { codigo_convite } = req.body;

      if (!codigo_convite || !codigo_convite.trim()) {
        return res.status(400).json({ error: 'Código de convite é obrigatório' });
      }

      const accounts = await db.query(
        'SELECT id, nome, tipo FROM contas WHERE codigo_convite = ?',
        [codigo_convite.trim().toUpperCase()]
      );

      if (!accounts || accounts.length === 0) {
        return res.status(404).json({ error: 'Código de convite inválido ou expirado' });
      }

      const conta = accounts[0];

      // Verificar se já é membro
      const exists = await db.query(
        'SELECT id FROM membros_conta WHERE conta_id = ? AND usuario_id = ?',
        [conta.id, usuario_id]
      );

      if (exists && exists.length > 0) {
        return res.status(400).json({ error: 'Você já faz parte desta conta' });
      }

      // Adicionar como membro
      await db.query(
        'INSERT INTO membros_conta (conta_id, usuario_id, papel) VALUES (?, ?, ?)',
        [conta.id, usuario_id, 'membro']
      );

      logServiceClient.sendLog(usuario_id, 'entrou_na_conta', {
        conta_id: conta.id,
        conta_nome: conta.nome,
        papel: 'membro'
      });

      res.json({ message: `Você entrou na conta ${conta.nome} com sucesso!`, conta });
    } catch (error) {
      console.error('Erro ao entrar na conta via convite:', error);
      res.status(500).json({ error: 'Erro ao processar convite' });
    }
  },

  // Excluir conta (apenas Titular ou Admin)
  async deleteAccount(req, res) {
    try {
      const usuario_id = req.user.id;
      const { id } = req.params;

      const memberships = await db.query(
        'SELECT papel FROM membros_conta WHERE conta_id = ? AND usuario_id = ?',
        [id, usuario_id]
      );

      if ((!memberships || memberships.length === 0) && req.user.role !== 'admin') {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      const papel = memberships && memberships.length > 0 ? memberships[0].papel : req.user.role;

      // Verificação RBAC: membros não podem excluir conta
      if (papel !== 'titular' && req.user.role !== 'admin') {
        logServiceClient.sendLog(usuario_id, 'tentativa_excluir_conta_sem_permissao', {
          conta_id: id,
          papel
        });
        return res.status(403).json({ error: 'Apenas o titular da conta ou administrador pode excluí-la' });
      }

      await db.query('DELETE FROM contas WHERE id = ?', [id]);

      logServiceClient.sendLog(usuario_id, 'conta_excluida', { conta_id: id });

      res.json({ message: 'Conta excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      res.status(500).json({ error: 'Erro ao excluir conta' });
    }
  }
};
