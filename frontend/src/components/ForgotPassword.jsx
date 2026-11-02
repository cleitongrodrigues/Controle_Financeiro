import React, { useState } from 'react';

function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao solicitar reset de senha');
        return;
      }

      setMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setTimeout(() => {
        onBackToLogin();
      }, 3000);
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Recuperar Senha</h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Digite seu email para receber um link de recuperação de senha
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </button>
        </form>

        <button
          type="button"
          onClick={onBackToLogin}
          style={{
            marginTop: '10px',
            background: 'transparent',
            border: 'none',
            color: '#667eea',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '14px',
          }}
        >
          Voltar ao Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;
