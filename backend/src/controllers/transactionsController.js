const db = require('../config/database');
const storageService = require('../services/storageService');
const logServiceClient = require('../services/logServiceClient');

// Função auxiliar para verificar permissão do usuário na conta da transação
async function checkUserAccountAccess(userId, userRole, contaId) {
  if (userRole === 'admin') return { allowed: true, papel: 'admin' };

  const members = await db.query(
    'SELECT papel FROM membros_conta WHERE conta_id = ? AND usuario_id = ?',
    [contaId, userId]
  );

  if (!members || members.length === 0) return { allowed: false, papel: null };
  return { allowed: true, papel: members[0].papel };
}

module.exports = {
  // Listar transações com filtros e garantia de isolamento
  async listTransactions(req, res) {
    try {
      const usuario_id = req.user.id;
      const { conta_id, tipo, categoria_id, mes, ano } = req.query;

      // Se conta_id não for informada, buscar a primeira conta do usuário
      let targetContaId = conta_id;
      if (!targetContaId) {
        const userAccounts = await db.query(
          'SELECT conta_id FROM membros_conta WHERE usuario_id = ? ORDER BY criado_em ASC LIMIT 1',
          [usuario_id]
        );
        if (!userAccounts || userAccounts.length === 0) {
          return res.json([]);
        }
        targetContaId = userAccounts[0].conta_id;
      }

      // Validar isolamento: o usuário tem acesso a essa conta?
      const access = await checkUserAccountAccess(usuario_id, req.user.role, targetContaId);
      if (!access.allowed) {
        logServiceClient.sendLog(usuario_id, 'tentativa_acesso_transacoes_alheias', {
          conta_id: targetContaId
        });
        return res.status(403).json({ error: 'Acesso negado às transações desta conta' });
      }

      let sql = `
        SELECT t.id, t.conta_id, t.usuario_id, t.categoria_id, t.tipo, t.titulo, 
               t.valor, t.data_transacao, t.descricao, t.comprovante_url, t.comprovante_nome,
               t.status, t.criado_em,
               u.nome as autor_nome, u.email as autor_email,
               c.nome as categoria_nome, c.icone as categoria_icone, c.cor as categoria_cor
        FROM transacoes t
        JOIN usuarios u ON t.usuario_id = u.id
        LEFT JOIN categorias c ON t.categoria_id = c.id
        WHERE t.conta_id = ?
      `;
      const params = [targetContaId];

      if (tipo && (tipo === 'despesa' || tipo === 'receita')) {
        sql += ' AND t.tipo = ?';
        params.push(tipo);
      }

      if (categoria_id) {
        sql += ' AND t.categoria_id = ?';
        params.push(categoria_id);
      }

      if (mes && ano) {
        sql += ' AND MONTH(t.data_transacao) = ? AND YEAR(t.data_transacao) = ?';
        params.push(mes, ano);
      }

      sql += ' ORDER BY t.data_transacao DESC, t.id DESC';

      const transactions = await db.query(sql, params);
      const txList = Array.isArray(transactions) ? transactions : [];

      // Gerar URLs seguras para os comprovantes
      for (const t of txList) {
        if (t.comprovante_url) {
          t.comprovante_download_url = await storageService.getFileUrl(t.comprovante_url);
        }
      }

      res.json(txList);
    } catch (error) {
      console.error('Erro ao listar transações:', error);
      res.status(500).json({ error: 'Erro ao listar transações' });
    }
  },

  // Obter detalhes de uma transação específica (com teste de isolamento multi-tenancy)
  async getTransaction(req, res) {
    try {
      const usuario_id = req.user.id;
      const { id } = req.params;

      const transactions = await db.query(
        `SELECT t.*, u.nome as autor_nome, u.email as autor_email,
                c.nome as categoria_nome, c.icone as categoria_icone, c.cor as categoria_cor,
                cta.nome as conta_nome
         FROM transacoes t
         JOIN usuarios u ON t.usuario_id = u.id
         JOIN contas cta ON t.conta_id = cta.id
         LEFT JOIN categorias c ON t.categoria_id = c.id
         WHERE t.id = ?`,
        [id]
      );

      if (!transactions || transactions.length === 0) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }

      const transacao = transactions[0];

      // Verificação de isolamento: usuário precisa pertencer à conta da transação
      const access = await checkUserAccountAccess(usuario_id, req.user.role, transacao.conta_id);
      if (!access.allowed) {
        logServiceClient.sendLog(usuario_id, 'tentativa_acesso_transacao_outro_usuario', {
          transacao_id: id,
          conta_id: transacao.conta_id
        });
        return res.status(403).json({ error: 'Acesso negado: transação pertence a outra conta' });
      }

      if (transacao.comprovante_url) {
        transacao.comprovante_download_url = await storageService.getFileUrl(transacao.comprovante_url);
      }

      transacao.pode_excluir = access.papel === 'titular' || access.papel === 'admin' || transacao.usuario_id === usuario_id;

      res.json(transacao);
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      res.status(500).json({ error: 'Erro ao buscar transação' });
    }
  },

  // Criar nova transação com suporte a upload de comprovante no MinIO
  async createTransaction(req, res) {
    try {
      const usuario_id = req.user.id;
      const { conta_id, categoria_id, tipo, titulo, valor, data_transacao, descricao, status } = req.body;

      if (!conta_id || !tipo || !titulo || !valor || !data_transacao) {
        return res.status(400).json({ error: 'Campos obrigatórios: conta_id, tipo, titulo, valor, data_transacao' });
      }

      if (tipo !== 'despesa' && tipo !== 'receita') {
        return res.status(400).json({ error: 'Tipo deve ser "despesa" ou "receita"' });
      }

      // Validar acesso à conta
      const access = await checkUserAccountAccess(usuario_id, req.user.role, conta_id);
      if (!access.allowed) {
        return res.status(403).json({ error: 'Você não tem permissão para lançar nesta conta' });
      }

      let comprovante_url = null;
      let comprovante_nome = null;

      // Upload para o MinIO se arquivo de comprovante foi enviado
      if (req.file) {
        comprovante_url = await storageService.uploadComprovante(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname,
          usuario_id
        );
        comprovante_nome = req.file.originalname;
      }

      const numValor = parseFloat(valor);
      const catId = categoria_id ? Number(categoria_id) : null;
      const statusTx = status === 'pendente' ? 'pendente' : 'pago';

      const result = await db.query(
        `INSERT INTO transacoes 
         (conta_id, usuario_id, categoria_id, tipo, titulo, valor, data_transacao, descricao, comprovante_url, comprovante_nome, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [conta_id, usuario_id, catId, tipo, titulo.trim(), numValor, data_transacao, descricao || null, comprovante_url, comprovante_nome, statusTx]
      );

      const novaTransacaoId = result.insertId;

      // Registrar evento de negócio no Redis Logs
      logServiceClient.sendLog(usuario_id, 'transacao_criada', {
        transacao_id: novaTransacaoId,
        conta_id,
        titulo: titulo.trim(),
        valor: numValor,
        tipo,
        tem_comprovante: !!comprovante_url
      });

      if (comprovante_url) {
        logServiceClient.sendLog(usuario_id, 'comprovante_anexado', {
          transacao_id: novaTransacaoId,
          comprovante_nome
        });
      }

      res.status(201).json({
        id: novaTransacaoId,
        conta_id,
        usuario_id,
        tipo,
        titulo: titulo.trim(),
        valor: numValor,
        data_transacao,
        comprovante_url,
        comprovante_nome,
        status: statusTx
      });
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      res.status(500).json({ error: 'Erro ao registrar transação' });
    }
  },

  // Editar transação existente
  async updateTransaction(req, res) {
    try {
      const usuario_id = req.user.id;
      const { id } = req.params;
      const { categoria_id, tipo, titulo, valor, data_transacao, descricao, status } = req.body;

      const transactions = await db.query('SELECT * FROM transacoes WHERE id = ?', [id]);
      if (!transactions || transactions.length === 0) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }

      const tx = transactions[0];
      const access = await checkUserAccountAccess(usuario_id, req.user.role, tx.conta_id);
      if (!access.allowed) {
        return res.status(403).json({ error: 'Acesso negado para editar esta transação' });
      }

      let comprovante_url = tx.comprovante_url;
      let comprovante_nome = tx.comprovante_nome;

      if (req.file) {
        comprovante_url = await storageService.uploadComprovante(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname,
          usuario_id
        );
        comprovante_nome = req.file.originalname;
      }

      await db.query(
        `UPDATE transacoes 
         SET categoria_id = ?, tipo = ?, titulo = ?, valor = ?, data_transacao = ?, descricao = ?, comprovante_url = ?, comprovante_nome = ?, status = ?
         WHERE id = ?`,
        [
          categoria_id ? Number(categoria_id) : tx.categoria_id,
          tipo || tx.tipo,
          titulo ? titulo.trim() : tx.titulo,
          valor ? parseFloat(valor) : tx.valor,
          data_transacao || tx.data_transacao,
          descricao !== undefined ? descricao : tx.descricao,
          comprovante_url,
          comprovante_nome,
          status || tx.status,
          id
        ]
      );

      logServiceClient.sendLog(usuario_id, 'transacao_editada', {
        transacao_id: id,
        titulo: titulo || tx.titulo,
        valor: valor || tx.valor
      });

      res.json({ message: 'Transação atualizada com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      res.status(500).json({ error: 'Erro ao atualizar transação' });
    }
  },

  // Excluir transação com controle de RBAC e autoria
  async deleteTransaction(req, res) {
    try {
      const usuario_id = req.user.id;
      const { id } = req.params;

      const transactions = await db.query('SELECT * FROM transacoes WHERE id = ?', [id]);
      if (!transactions || transactions.length === 0) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }

      const tx = transactions[0];
      const access = await checkUserAccountAccess(usuario_id, req.user.role, tx.conta_id);

      if (!access.allowed) {
        return res.status(403).json({ error: 'Acesso negado a esta conta' });
      }

      // Regra de Negócio RBAC:
      // Titular e Admin podem excluir qualquer transação.
      // Membro convidado só pode excluir as transações que ELE MESMO lançou!
      if (access.papel === 'membro' && tx.usuario_id !== usuario_id && req.user.role !== 'admin') {
        logServiceClient.sendLog(usuario_id, 'tentativa_exclusao_transacao_sem_permissao', {
          transacao_id: id,
          autor_id: tx.usuario_id,
          papel: 'membro'
        });
        return res.status(403).json({ 
          error: 'Permissão insuficiente: membros convidados só podem excluir as próprias transações lançadas.' 
        });
      }

      await db.query('DELETE FROM transacoes WHERE id = ?', [id]);

      logServiceClient.sendLog(usuario_id, 'transacao_removida', {
        transacao_id: id,
        titulo: tx.titulo,
        valor: tx.valor,
        conta_id: tx.conta_id
      });

      res.json({ message: 'Transação excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      res.status(500).json({ error: 'Erro ao excluir transação' });
    }
  }
};
