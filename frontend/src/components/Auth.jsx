import React, { useState } from 'react';
import ForgotPassword from './ForgotPassword';

const API_URL = import.meta.env.DEV ? 'http://localhost:3000/api' : '/api';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          password: formData.senha
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha na autenticação');
      }

      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="brand-block">
          <span className="brand-kicker">Cinema de fantasia</span>
          <h1>Cine Mágico</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="nome">Nome</label>
              <input
                id="nome"
                name="nome"
                type="text"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Seu nome"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              value={formData.senha}
              onChange={handleChange}
              placeholder="Sua senha"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        {isLogin && (
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            style={{
              marginTop: '10px',
              background: 'transparent',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            Esqueci minha senha
          </button>
        )}

        <div className="auth-toggle" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Ainda não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
        </div>
      </div>
    </div>
  );
}

export default Auth;
