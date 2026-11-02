import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function AuditLogs({ user, token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/logs?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Acesso negado: apenas administradores podem visualizar os logs de auditoria.');
        }
        throw new Error('Erro ao carregar logs de auditoria');
      }

      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (acao) => {
    if (acao.includes('criada') || acao.includes('cadastrado')) return 'badge-green';
    if (acao.includes('removida') || acao.includes('exclui')) return 'badge-red';
    if (acao.includes('anexado')) return 'badge-purple';
    if (acao.includes('negado') || acao.includes('sem_permissao')) return 'badge-warning';
    return 'badge-blue';
  };

  return (
    <div className="audit-logs-page">
      <header className="app-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span className="brand-icon">🛡️</span>
            <span className="brand-title">Auditoria e <strong>Logs de Negócio</strong></span>
            <span className="role-badge admin">Redis Streams</span>
          </div>
          <div className="navbar-controls">
            <Link to="/" className="btn-sm btn-outline">
              ⬅️ Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="logs-header-card">
          <h2>Trilha de Auditoria em Tempo Real</h2>
          <p>
            Eventos de negócio capturados via <code>log-service</code> e persistidos em <strong>Redis Streams</strong>. Registra quem, quando e qual ação foi realizada no sistema financeiro.
          </p>
          <button onClick={fetchLogs} className="btn-sm btn-primary">
            🔄 Atualizar Logs
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <h3>⚠️ Bloqueio RBAC (403 Forbidden)</h3>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="loading-spinner">Carregando eventos do Redis Streams...</div>
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
                  logs.map((log) => {
                    let parsedDetails = log.detalhes;
                    try {
                      if (typeof log.detalhes === 'string') {
                        parsedDetails = JSON.parse(log.detalhes);
                      }
                    } catch (e) {}

                    return (
                      <tr key={log.id}>
                        <td className="font-mono text-muted">{log.id}</td>
                        <td className="whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : '-'}
                        </td>
                        <td>
                          <span className="user-id-badge">ID: {log.usuario_id}</span>
                        </td>
                        <td>
                          <span className={`action-badge ${getActionBadgeColor(log.acao)}`}>
                            {log.acao}
                          </span>
                        </td>
                        <td className="details-col">
                          <pre className="json-snippet">
                            {JSON.stringify(parsedDetails, null, 2)}
                          </pre>
                        </td>
                        <td className="text-muted text-sm">{log.ip}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
