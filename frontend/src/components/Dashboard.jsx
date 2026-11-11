import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard({ user, token, onLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [accountDetails, setAccountDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modais
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  // Atividade 11: Assinatura Recorrente SaaS e Limites do Stripe
  const [subStatus, setSubStatus] = useState(null);
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(null);

  // Formulário de Transação
  const [txForm, setTxForm] = useState({
    titulo: '',
    valor: '',
    tipo: 'despesa',
    categoria_id: '',
    data_transacao: new Date().toISOString().split('T')[0],
    descricao: '',
    status: 'pago'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [submittingTx, setSubmittingTx] = useState(false);

  // Formulário de Nova Conta
  const [newAccountForm, setNewAccountForm] = useState({
    nome: '',
    tipo: 'conjunta'
  });

  // Filtros
  const [filterType, setFilterType] = useState('todos');
  const [filterCategory, setFilterCategory] = useState('');

  // Carregar contas, categorias e status do plano Stripe
  useEffect(() => {
    fetchInitialData();
    fetchSubscriptionStatus();

    // Tratar retorno do Stripe Checkout
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') === 'success') {
      setSuccessMsg('🎉 Assinatura do Plano Pro iniciada com sucesso! O webhook do Stripe ativará seu plano em instantes.');
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchSubscriptionStatus();
    } else if (params.get('upgrade') === 'canceled') {
      setErrorMsg('Checkout cancelado. Você continua aproveitando o Plano Free.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [token]);

  // Carregar transações sempre que a conta selecionada mudar
  useEffect(() => {
    if (selectedAccountId) {
      fetchAccountData(selectedAccountId);
    }
  }, [selectedAccountId, token]);

  const fetchSubscriptionStatus = async () => {
    try {
      const res = await fetch('/api/stripe/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubStatus(data);
      }
    } catch (err) {
      console.warn('Aviso ao carregar status da assinatura Stripe:', err);
    }
  };

  const handleUpgradePro = async () => {
    try {
      setLoadingUpgrade(true);
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao iniciar checkout');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert(`Stripe Checkout: ${err.message}`);
    } finally {
      setLoadingUpgrade(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoadingPortal(true);
      const res = await fetch('/api/stripe/portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao abrir Portal de Assinatura');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert(`Portal do Cliente: ${err.message}`);
    } finally {
      setLoadingPortal(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // 1. Buscar Categorias
      const catRes = await fetch('/api/categorias', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : []);
      }

      // 2. Buscar Contas do Usuário
      const accRes = await fetch('/api/contas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!accRes.ok) throw new Error('Erro ao buscar contas');
      const accData = await accRes.json();
      const validAccounts = Array.isArray(accData) ? accData : [];
      setAccounts(validAccounts);

      if (validAccounts.length > 0) {
        setSelectedAccountId(validAccounts[0].id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao conectar com o servidor da aplicação.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountData = async (accId) => {
    try {
      // 1. Detalhes da conta (incluindo membros e saldo)
      const detailsRes = await fetch(`/api/contas/${accId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (detailsRes.ok) {
        const d = await detailsRes.json();
        if (d && !d.error) {
          setAccountDetails(d);
        }
      }

      // 2. Lista de transações da conta
      const txRes = await fetch(`/api/transacoes?conta_id=${accId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(Array.isArray(txData) ? txData : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenNewTx = () => {
    setEditingTransaction(null);
    setTxForm({
      titulo: '',
      valor: '',
      tipo: 'despesa',
      categoria_id: categories.length > 0 ? categories[0].id : '',
      data_transacao: new Date().toISOString().split('T')[0],
      descricao: '',
      status: 'pago'
    });
    setSelectedFile(null);
    setShowTransactionModal(true);
  };

  const handleOpenEditTx = (tx) => {
    setEditingTransaction(tx);
    setTxForm({
      titulo: tx.titulo,
      valor: tx.valor,
      tipo: tx.tipo,
      categoria_id: tx.categoria_id || '',
      data_transacao: tx.data_transacao ? tx.data_transacao.split('T')[0] : '',
      descricao: tx.descricao || '',
      status: tx.status || 'pago'
    });
    setSelectedFile(null);
    setShowTransactionModal(true);
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!txForm.titulo || !txForm.valor || !txForm.data_transacao) {
      alert('Preencha os campos obrigatórios!');
      return;
    }

    try {
      setSubmittingTx(true);
      const formData = new FormData();
      formData.append('conta_id', selectedAccountId);
      formData.append('titulo', txForm.titulo);
      formData.append('valor', txForm.valor);
      formData.append('tipo', txForm.tipo);
      formData.append('categoria_id', txForm.categoria_id);
      formData.append('data_transacao', txForm.data_transacao);
      formData.append('descricao', txForm.descricao);
      formData.append('status', txForm.status);
      if (selectedFile) {
        formData.append('comprovante', selectedFile);
      }

      const url = editingTransaction
        ? `/api/transacoes/${editingTransaction.id}`
        : '/api/transacoes';
      const method = editingTransaction ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.limite_atingido) {
          setShowLimitModal(data);
          setShowTransactionModal(false);
          return;
        }
        throw new Error(data.error || 'Erro ao salvar transação');
      }

      setSuccessMsg(editingTransaction ? 'Transação atualizada!' : 'Transação registrada com sucesso!');
      setShowTransactionModal(false);
      fetchAccountData(selectedAccountId);
      fetchSubscriptionStatus();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingTx(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const res = await fetch(`/api/transacoes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir transação');
      }
      setSuccessMsg('Transação excluída com sucesso.');
      fetchAccountData(selectedAccountId);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(`Bloqueio de Permissão (403): ${err.message}`);
    }
  };

  const handleViewTransaction = async (txId) => {
    try {
      const res = await fetch(`/api/transacoes/${txId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar detalhes');
      }
      setViewingTransaction(data);
    } catch (err) {
      alert(`Multi-tenancy / Bloqueio: ${err.message}`);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newAccountForm.nome.trim()) return;

    try {
      const res = await fetch('/api/contas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAccountForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');

      setShowNewAccountModal(false);
      setNewAccountForm({ nome: '', tipo: 'conjunta' });
      setSuccessMsg(`Conta "${data.nome}" criada com sucesso!`);
      await fetchInitialData();
      setSelectedAccountId(data.id);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleJoinAccount = async (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    try {
      const res = await fetch('/api/contas/entrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ codigo_convite: inviteCodeInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao entrar na conta');

      setInviteCodeInput('');
      setSuccessMsg(data.message);
      await fetchInitialData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtragem local das transações
  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'todos' && t.tipo !== filterType) return false;
    if (filterCategory && String(t.categoria_id) !== String(filterCategory)) return false;
    return true;
  });

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <header className="app-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span className="brand-icon">💳</span>
            <span className="brand-title">Conta <strong>Comigo</strong></span>
            {accountDetails && (
              <span className={`account-type-badge ${accountDetails.tipo}`}>
                {accountDetails.tipo === 'conjunta' ? '👥 Conta Conjunta' : '👤 Conta Pessoal'}
              </span>
            )}
          </div>

          <div className="navbar-controls">
            {/* Seletor de Conta */}
            <div className="account-selector">
              <label>Conta Ativa:</label>
              <select
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              >
                {Array.isArray(accounts) && accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.nome} ({acc.papel.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowNewAccountModal(true)}
              className="btn-sm btn-outline"
              title="Criar nova conta"
            >
              + Nova Conta
            </button>

            {/* Painel do Usuário */}
            <div className="user-profile-badge">
              <Link to="/profile" className="profile-link">
                {user.foto_perfil ? (
                  <img src={`/api/profile/photo`} alt={user.nome} className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">{user.nome.charAt(0)}</div>
                )}
                <div className="user-info-text">
                  <span className="user-name">{user.nome}</span>
                  <span className="user-role">({user.role})</span>
                </div>
              </Link>
            </div>

            {/* Badge de Plano e Ações do Stripe (Atividade 11) */}
            {subStatus?.is_pro ? (
              <button
                onClick={handleManageSubscription}
                disabled={loadingPortal}
                className="btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                title="Assinatura Pro Ativa - Clique para gerenciar ou cancelar no Stripe"
              >
                ⭐ PRO {loadingPortal ? '(Abrindo...)' : '(Gerenciar)'}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    background: 'rgba(148, 163, 184, 0.15)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    color: '#94A3B8'
                  }}
                  title={`Limite mensal de ${subStatus?.uso_mes?.limite || 3} transações gratuitas`}
                >
                  FREE ({subStatus?.uso_mes?.transacoes || 0}/{subStatus?.uso_mes?.limite || 3} mês)
                </span>
                <button
                  onClick={handleUpgradePro}
                  disabled={loadingUpgrade}
                  className="btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Fazer upgrade para o Plano Pro no Stripe"
                >
                  {loadingUpgrade ? 'Abrindo Stripe...' : '⭐ Assinar Pro (R$ 19,90)'}
                </button>
              </div>
            )}

            {user.role === 'admin' && (
              <Link to="/logs" className="btn-sm btn-admin">
                🛡️ Painel Admin (MRR & Logs)
              </Link>
            )}

            <button onClick={onLogout} className="btn-sm btn-logout">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {/* Alerta de Limite do Plano Free */}
        {subStatus && !subStatus.is_pro && subStatus.uso_mes?.atingiu_limite && (
          <div
            className="alert alert-warning"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px'
            }}
          >
            <div>
              <strong>⚠️ Limite do Plano Free atingido!</strong>
              <span style={{ marginLeft: '6px', color: '#CBD5E1' }}>
                Você já utilizou suas {subStatus?.uso_mes?.limite || 3} transações gratuitas deste mês. Novas transações serão bloqueadas na API.
              </span>
            </div>
            <button
              onClick={handleUpgradePro}
              disabled={loadingUpgrade}
              className="btn-sm btn-primary"
              style={{ whiteSpace: 'nowrap', marginLeft: '12px' }}
            >
              ⭐ Assinar Plano Pro (R$ 19,90/mês)
            </button>
          </div>
        )}

        {/* Resumo Financeiro da Conta */}
        <section className="metrics-banner">
          <div className="metric-card metric-balance">
            <div className="metric-header">
              <span>SALDO EM CAIXA</span>
              <span className="icon">💰</span>
            </div>
            <div className={`metric-amount ${accountDetails?.saldo_calculado >= 0 ? 'text-green' : 'text-red'}`}>
              R$ {accountDetails ? accountDetails.saldo_calculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>
            <div className="metric-footer">Atualizado em tempo real</div>
          </div>

          <div className="metric-card metric-income">
            <div className="metric-header">
              <span>TOTAL DE RECEITAS</span>
              <span className="icon">📈</span>
            </div>
            <div className="metric-amount text-green">
              + R$ {accountDetails ? accountDetails.total_receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>
            <div className="metric-footer">Entradas registradas</div>
          </div>

          <div className="metric-card metric-expense">
            <div className="metric-header">
              <span>TOTAL DE DESPESAS</span>
              <span className="icon">📉</span>
            </div>
            <div className="metric-amount text-red">
              - R$ {accountDetails ? accountDetails.total_despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>
            <div className="metric-footer">Saídas e contas do mês</div>
          </div>

          <div className="metric-card metric-members">
            <div className="metric-header">
              <span>MEMBROS NA CONTA</span>
              <span className="icon">👥</span>
            </div>
            <div className="metric-members-list">
              {Array.isArray(accountDetails?.membros) && accountDetails.membros.map((m) => (
                <span key={m.id} className="member-pill" title={`${m.nome} (${m.papel})`}>
                  {m.nome.split(' ')[0]} ({m.papel})
                </span>
              ))}
            </div>
            {accountDetails?.tipo === 'conjunta' && (
              <button onClick={() => setShowInviteModal(true)} className="btn-link-invite">
                🔗 Convidar Membro
              </button>
            )}
          </div>
        </section>

        {/* Actions Bar & Filters */}
        <section className="actions-bar">
          <div className="filter-group">
            <button
              className={`filter-btn ${filterType === 'todos' ? 'active' : ''}`}
              onClick={() => setFilterType('todos')}
            >
              Todos ({transactions.length})
            </button>
            <button
              className={`filter-btn ${filterType === 'despesa' ? 'active' : ''}`}
              onClick={() => setFilterType('despesa')}
            >
              Despesas 📉
            </button>
            <button
              className={`filter-btn ${filterType === 'receita' ? 'active' : ''}`}
              onClick={() => setFilterType('receita')}
            >
              Receitas 📈
            </button>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="category-filter-select"
            >
              <option value="">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="btn-action-group">
            <button onClick={handleOpenNewTx} className="btn-primary-action">
              + Nova Transação
            </button>
          </div>
        </section>

        {/* Extrato / Tabela de Transações */}
        <section className="transactions-container">
          <div className="table-header-title">
            <h3>Extrato Financeiro — {selectedAccount?.nome}</h3>
            <span className="subtext">
              Exibindo {filteredTransactions.length} lançamentos com isolamento seguro por conta
            </span>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🧾</span>
              <h4>Nenhuma transação encontrada</h4>
              <p>Comece registrando suas receitas ou despesas da casa com comprovantes.</p>
              <button onClick={handleOpenNewTx} className="btn-primary">
                + Adicionar Primeira Transação
              </button>
            </div>
          ) : (
            <div className="transactions-list">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className={`tx-card ${tx.tipo}`}>
                  <div className="tx-left">
                    <div
                      className="tx-category-icon"
                      style={{ backgroundColor: `${tx.categoria_cor || '#6366F1'}20`, color: tx.categoria_cor || '#6366F1' }}
                    >
                      {tx.tipo === 'receita' ? '💰' : '🛒'}
                    </div>
                    <div className="tx-info">
                      <div className="tx-title-row">
                        <strong className="tx-title">{tx.titulo}</strong>
                        {tx.categoria_nome && (
                          <span
                            className="tx-category-badge"
                            style={{ backgroundColor: `${tx.categoria_cor || '#6366F1'}15`, color: tx.categoria_cor || '#6366F1' }}
                          >
                            {tx.categoria_nome}
                          </span>
                        )}
                        <span className={`tx-status ${tx.status}`}>{tx.status}</span>
                      </div>
                      <div className="tx-meta-row">
                        <span>📅 {new Date(tx.data_transacao).toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        <span>👤 Lançado por: <strong>{tx.autor_nome}</strong></span>
                        {tx.descricao && (
                          <>
                            <span>•</span>
                            <span className="tx-desc-snippet">{tx.descricao}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="tx-right">
                    <div className={`tx-amount ${tx.tipo === 'receita' ? 'text-green' : 'text-red'}`}>
                      {tx.tipo === 'receita' ? '+' : '-'} R$ {Number(tx.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>

                    <div className="tx-actions">
                      <button
                        onClick={() => handleViewTransaction(tx.id)}
                        className="btn-view-icon"
                        title="Ver detalhes da transação (GET /api/transacoes/:id)"
                      >
                        👁️
                      </button>
                      {tx.comprovante_url && (
                        <button
                          onClick={() => setShowReceiptModal(tx)}
                          className="btn-receipt"
                          title="Ver comprovante anexado no MinIO"
                        >
                          📎 Comprovante
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditTx(tx)}
                        className="btn-edit-icon"
                        title="Editar transação"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="btn-delete-icon"
                        title="Excluir transação"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Seção para Entrar em Conta via Código de Convite */}
        <section className="join-account-section">
          <h4>Já tem um código de convite da sua família ou parceiro?</h4>
          <form onSubmit={handleJoinAccount} className="join-form">
            <input
              type="text"
              placeholder="Ex: CASA-FAMILIA-2026"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
            />
            <button type="submit" className="btn-secondary">
              Entrar na Conta Conjunta
            </button>
          </form>
        </section>
      </main>

      {/* Modal de Nova/Editar Transação */}
      {showTransactionModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingTransaction ? 'Editar Transação' : 'Nova Transação Financeira'}</h3>
              <button onClick={() => setShowTransactionModal(false)} className="close-btn">
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveTransaction} className="modal-form">
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Tipo de Transação *</label>
                  <div className="radio-group">
                    <label className={`radio-label ${txForm.tipo === 'despesa' ? 'active-red' : ''}`}>
                      <input
                        type="radio"
                        name="tipo"
                        value="despesa"
                        checked={txForm.tipo === 'despesa'}
                        onChange={(e) => setTxForm({ ...txForm, tipo: e.target.value })}
                      />
                      📉 Despesa
                    </label>
                    <label className={`radio-label ${txForm.tipo === 'receita' ? 'active-green' : ''}`}>
                      <input
                        type="radio"
                        name="tipo"
                        value="receita"
                        checked={txForm.tipo === 'receita'}
                        onChange={(e) => setTxForm({ ...txForm, tipo: e.target.value })}
                      />
                      📈 Receita
                    </label>
                  </div>
                </div>

                <div className="form-group flex-1">
                  <label>Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    required
                    value={txForm.valor}
                    onChange={(e) => setTxForm({ ...txForm, valor: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Título / Descrição Curta *</label>
                <input
                  type="text"
                  placeholder="Ex: Supermercado Mensal, Aluguel, Salário..."
                  required
                  value={txForm.titulo}
                  onChange={(e) => setTxForm({ ...txForm, titulo: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Categoria</label>
                  <select
                    value={txForm.categoria_id}
                    onChange={(e) => setTxForm({ ...txForm, categoria_id: e.target.value })}
                  >
                    <option value="">Sem Categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome} ({cat.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>Data *</label>
                  <input
                    type="date"
                    required
                    value={txForm.data_transacao}
                    onChange={(e) => setTxForm({ ...txForm, data_transacao: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Detalhes Adicionais (Opcional)</label>
                <textarea
                  placeholder="Observações sobre este gasto..."
                  rows="2"
                  value={txForm.descricao}
                  onChange={(e) => setTxForm({ ...txForm, descricao: e.target.value })}
                />
              </div>

              {/* Upload de Comprovante no MinIO */}
              <div className="form-group file-upload-group">
                <label>📎 Comprovante / Cupom Fiscal (Salvo no MinIO)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                <span className="file-hint">Aceita fotos de notas, recibos PIX ou PDF (até 10MB)</span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={submittingTx} className="btn-primary">
                  {submittingTx ? 'Salvando...' : 'Salvar Transação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Convidar Membro */}
      {showInviteModal && accountDetails && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Convidar Parceiro / Família</h3>
              <button onClick={() => setShowInviteModal(false)} className="close-btn">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Compartilhe o código de convite abaixo para que outras pessoas entrem na conta <strong>{accountDetails.nome}</strong>:</p>
              
              <div className="invite-code-box">
                <span className="code-text">{accountDetails.codigo_convite}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(accountDetails.codigo_convite);
                    alert('Código copiado para a área de transferência!');
                  }}
                  className="btn-copy"
                >
                  Copiar Código
                </button>
              </div>

              <p className="invite-tip">
                💡 O novo membro só precisa criar uma conta no Conta Comigo e colar este código no campo "Entrar na Conta Conjunta".
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowInviteModal(false)} className="btn-secondary">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Conta */}
      {showNewAccountModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Criar Nova Carteira / Conta</h3>
              <button onClick={() => setShowNewAccountModal(false)} className="close-btn">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAccount} className="modal-form">
              <div className="form-group">
                <label>Nome da Conta *</label>
                <input
                  type="text"
                  placeholder="Ex: Despesas da Praia, Casamento, Família..."
                  required
                  value={newAccountForm.nome}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, nome: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tipo de Conta</label>
                <select
                  value={newAccountForm.tipo}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, tipo: e.target.value })}
                >
                  <option value="conjunta">👥 Conta Conjunta (Permite convidar membros)</option>
                  <option value="pessoal">👤 Conta Pessoal (Apenas para você)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowNewAccountModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Visualizar Comprovante do MinIO */}
      {showReceiptModal && (
        <div className="modal-backdrop">
          <div className="modal-card receipt-modal">
            <div className="modal-header">
              <h3>Comprovante da Transação</h3>
              <button onClick={() => setShowReceiptModal(null)} className="close-btn">
                ✕
              </button>
            </div>
            <div className="modal-body receipt-preview">
              <p><strong>{showReceiptModal.titulo}</strong> — R$ {Number(showReceiptModal.valor).toFixed(2)}</p>
              <div className="receipt-container">
                <img
                  src={showReceiptModal.comprovante_download_url || `/api/comprovantes/download?key=${encodeURIComponent(showReceiptModal.comprovante_url)}`}
                  alt="Comprovante"
                  className="receipt-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML += '<p class="receipt-error">Não foi possível carregar a pré-visualização direta. Utilize o botão abaixo para baixar.</p>';
                  }}
                />
              </div>
              <div className="receipt-meta">
                <span>Arquivo: {showReceiptModal.comprovante_nome || showReceiptModal.comprovante_url}</span>
                <a
                  href={`/api/comprovantes/download?key=${encodeURIComponent(showReceiptModal.comprovante_url)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-download"
                  download
                >
                  ⬇️ Baixar Arquivo Original
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Transação (Requisito 4: Detalhar recurso principal) */}
      {viewingTransaction && (
        <div className="modal-backdrop" onClick={() => setViewingTransaction(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Detalhes da Transação #{viewingTransaction.id}</h3>
              <button onClick={() => setViewingTransaction(null)} className="close-btn">
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ padding: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className={`tx-status ${viewingTransaction.status}`} style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  {viewingTransaction.status}
                </span>
                <span className={`tx-amount ${viewingTransaction.tipo === 'receita' ? 'text-green' : 'text-red'}`} style={{ fontSize: '1.4rem' }}>
                  {viewingTransaction.tipo === 'receita' ? '+' : '-'} R$ {Number(viewingTransaction.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', lineHeight: 1.8 }}>
                <p style={{ margin: '4px 0' }}><strong>Título:</strong> {viewingTransaction.titulo}</p>
                <p style={{ margin: '4px 0' }}><strong>Tipo:</strong> {viewingTransaction.tipo === 'receita' ? '💰 Receita / Entrada' : '🛒 Despesa / Saída'}</p>
                <p style={{ margin: '4px 0' }}><strong>Conta:</strong> {viewingTransaction.conta_nome || 'Conta Atual'}</p>
                <p style={{ margin: '4px 0' }}><strong>Categoria:</strong> {viewingTransaction.categoria_nome || 'Não categorizado'}</p>
                <p style={{ margin: '4px 0' }}><strong>Data da Transação:</strong> {new Date(viewingTransaction.data_transacao).toLocaleDateString('pt-BR')}</p>
                <p style={{ margin: '4px 0' }}><strong>Autor do Lançamento:</strong> {viewingTransaction.autor_nome} ({viewingTransaction.autor_email})</p>
                {viewingTransaction.descricao && (
                  <p style={{ margin: '4px 0' }}><strong>Observações:</strong> {viewingTransaction.descricao}</p>
                )}
                <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#94A3B8' }}><strong>Registrado em:</strong> {new Date(viewingTransaction.criado_em).toLocaleString('pt-BR')}</p>
              </div>

              {viewingTransaction.comprovante_url && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      setShowReceiptModal(viewingTransaction);
                      setViewingTransaction(null);
                    }}
                    className="btn-receipt"
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  >
                    📎 Ver Comprovante no MinIO ({viewingTransaction.comprovante_nome || 'Arquivo'})
                  </button>
                </div>
              )}
            </div>
            <div className="modal-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setViewingTransaction(null)} className="btn-secondary">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Limite do Plano Free Atingido (Atividade 11) */}
      {showLimitModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '480px', textAlign: 'center' }}>
            <div className="modal-header" style={{ justifyContent: 'center' }}>
              <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🚫</span>
              <h3 style={{ margin: 0, color: '#EF4444' }}>Limite do Plano Free Atingido</h3>
            </div>
            <div className="modal-body" style={{ padding: '16px 8px' }}>
              <p style={{ color: '#CBD5E1', fontSize: '0.95rem' }}>
                {showLimitModal.error || 'Você atingiu o limite de transações deste mês no Plano Gratuito.'}
              </p>
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  margin: '16px 0',
                  textAlign: 'left'
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', color: '#A5B4FC' }}>✨ Vantagens do Plano Pro:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#E2E8F0', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  <li>Lançamentos e extrato <strong>100% ilimitados</strong></li>
                  <li>Upload ilimitado de <strong>comprovantes no MinIO</strong></li>
                  <li>Membros e afiliados convidados ilimitados</li>
                  <li>Relatório de acerto de contas automático</li>
                </ul>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowLimitModal(null)}
                  className="btn-secondary"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleUpgradePro}
                  disabled={loadingUpgrade}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {loadingUpgrade ? 'Conectando...' : '⭐ Assinar Pro (R$ 19,90/mês)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
