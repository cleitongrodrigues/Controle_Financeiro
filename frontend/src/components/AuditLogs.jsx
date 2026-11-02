import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function AuditLogs({ user, token }) {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Buscar métricas administrativas de SaaS e MRR
      try {
        const metricsRes = await fetch('/api/admin/metrics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }
      } catch (mErr) {
        console.warn('Aviso ao buscar métricas:', mErr.message);
      }

      // 2. Buscar logs de auditoria do Redis Streams
      const res = await fetch('/api/logs?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Acesso negado: apenas administradores podem visualizar o painel admin e logs.');
        }
        throw new Error('Erro ao carregar dados do painel admin');
      }

      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (acao) => {
    if (acao.includes('assinatura_pro') || acao.includes('criada')) return 'badge-green';
    if (acao.includes('cancelada') || acao.includes('removida') || acao.includes('exclui')) return 'badge-red';
    if (acao.includes('limite') || acao.includes('falhou') || acao.includes('negado') || acao.includes('sem_permissao')) return 'badge-warning';
    if (acao.includes('atualizada') || acao.includes('portal') || acao.includes('checkout')) return 'badge-purple';
    return 'badge-blue';
  };

  return (
    <div className="audit-logs-page">
      <header className="app-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span className="brand-icon">🛡️</span>
            <span className="brand-title">Painel Admin & <strong>Métricas do SaaS</strong></span>
            <span className="role-badge admin">Stripe & Redis</span>
          </div>
          <div className="navbar-controls">
            <Link to="/" className="btn-sm btn-outline">
              ⬅️ Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        {error && (
          <div className="alert alert-error">
            <h3>⚠️ Bloqueio RBAC (403 Forbidden)</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Requisito 6 da Atividade 11: Painel Admin com Usuários por Plano, Assinaturas Ativas e MRR */}
        <section className="metrics-banner" style={{ marginBottom: '24px' }}>
          <div className="metric-card">
            <div className="metric-header">
              <span>USUÁRIOS CADASTRADOS</span>
              <span className="icon">👥</span>
            </div>
            <div className="metric-amount">
              {metrics ? metrics.total_usuarios : 0}
            </div>
            <div className="metric-footer" style={{ color: '#94A3B8' }}>
              Free: <strong>{metrics?.usuarios_por_plano?.free || 0}</strong> | Pro: <strong>{metrics?.usuarios_por_plano?.pro || 0}</strong>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span>ASSINATURAS ATIVAS</span>
              <span className="icon">⭐</span>
            </div>
            <div className="metric-amount text-green">
              {metrics ? metrics.assinaturas_ativas : 0}
            </div>
            <div className="metric-footer" style={{ color: '#94A3B8' }}>
              Plano Pro em modo de teste Stripe
            </div>
          </div>

          <div className="metric-card metric-balance">
            <div className="metric-header">
              <span>MRR DE TESTE (MENSAL)</span>
              <span className="icon">💰</span>
            </div>
            <div className="metric-amount text-green">
              R$ {metrics ? metrics.mrr_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>
            <div className="metric-footer" style={{ color: '#94A3B8' }}>
              R$ 19,90 × {metrics?.assinaturas_ativas || 0} assinantes ativos
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span>TICKET MÉDIO DO SAAS</span>
              <span className="icon">🏷️</span>
            </div>
            <div className="metric-amount" style={{ color: '#6366F1' }}>
              R$ 19,90
            </div>
            <div className="metric-footer" style={{ color: '#94A3B8' }}>
              Plano Conta Comigo Pro
            </div>
          </div>
        </section>

        {/* Trilha de Auditoria Redis Streams */}
        <div className="logs-header-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Trilha de Auditoria em Tempo Real</h2>
            <p style={{ margin: 0 }}>
              Eventos de negócio capturados via <code>log-service</code> e persistidos em <strong>Redis Streams</strong>. Registra eventos de autenticação, transações e ciclo de vida do Stripe (assinatura criada, atualizada, cancelada ou limite atingido).
            </p>
          </div>
          <button onClick={fetchData} className="btn-sm btn-primary" style={{ whiteSpace: 'nowrap', marginLeft: '16px' }}>
            🔄 Atualizar Painel
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">Carregando métricas e eventos do Redis Streams...</div>
        ) : (
          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Stream ID</th>
                  <th>Data / Hora</th>
                  <th>Usuário ID</th>
                  <th>Ação de Negócio</th>
                  <th>Detalhes do Evento</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">Nenhum evento registrado ainda.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="log-id">{log.id}</td>
                      <td className="log-time">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="log-user">
                        <span className="badge-user">#{log.userId || 'Sistema'}</span>
                      </td>
                      <td>
                        <span className={`log-badge ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="log-details">
                        {log.details ? (
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="log-ip">{log.ip || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
