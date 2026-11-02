import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';

const API_URL = '/api';

function Auth({ onLogin }) {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'titular'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setIsLogin(false);
    }
  }, [searchParams]);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleFillDemoUser = (email, role) => {
    setFormData({
      nome: role === 'admin' ? 'Administrador' : role === 'titular' ? 'Mariana Lopes' : 'Lucas Lopes',
      email,
      senha: '123456',
      role
    });
    setIsLogin(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const bodyPayload = isLogin
        ? { email: formData.email, password: formData.senha }
        : {
            nome: formData.nome,
            email: formData.email,
            password: formData.senha,
            role: formData.role
          };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha na autenticação');
      }

      if (!isLogin) {
        // Se cadastrou com sucesso, faz o login automático
        const loginRes = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.senha })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          onLogin(loginData.token, loginData.user);
          return;
        }
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
          <Link to="/" className="back-to-home">← Página Inicial</Link>
          <div className="brand-logo-icon">💳</div>
          <h1>Conta <strong>Comigo</strong></h1>
          <span className="brand-kicker">
            {isLogin ? 'Acesse seu painel financeiro' : 'Crie sua conta pessoal ou familiar'}
          </span>
        </div>

        {/* Demonstração Rápida de Usuários para o Professor */}
        <div className="demo-users-box">
          <span className="demo-title">⚡ Acesso Rápido de Teste (Senha: 123456):</span>
          <div className="demo-buttons">
            <button
              type="button"
              onClick={() => handleFillDemoUser('admin@contacomigo.com', 'admin')}
              className="demo-btn admin"
            >
              🛡️ Admin (Auditoria)
            </button>
            <button
              type="button"
              onClick={() => handleFillDemoUser('titular@contacomigo.com', 'titular')}
              className="demo-btn titular"
            >
              👑 Titular (Mariana)
            </button>
            <button
              type="button"
              onClick={() => handleFillDemoUser('membro@contacomigo.com', 'membro')}
              className="demo-btn membro"
            >
              👤 Membro (Lucas)
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="nome">Nome Completo *</label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Ex: Mariana Lopes"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Seu Papel Inicial no Sistema *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="role-select"
                >
                  <option value="titular">👑 Titular (Criar e gerenciar orçamento da casa)</option>
                  <option value="membro">👤 Membro Convidado (Lançar despesas como afiliado)</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail *</label>
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
            <label htmlFor="senha">Senha *</label>
            <input
              id="senha"
              name="senha"
              type="password"
              value={formData.senha}
              onChange={handleChange}
              placeholder="Sua senha secreta"
              required
            />
          </div>

          {isLogin && (
            <div className="forgot-password-link-container">
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => setShowForgotPassword(true)}
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <button type="submit" className="btn-primary btn-submit" disabled={loading}>
            {loading ? 'Aguarde...' : isLogin ? 'Entrar no Sistema' : 'Finalizar Cadastro Grátis'}
          </button>
        </form>

        <div className="auth-footer-toggle">
          {isLogin ? (
            <p>
              Ainda não tem conta?{' '}
              <button type="button" onClick={() => setIsLogin(false)} className="btn-text">
                Cadastre-se gratuitamente
              </button>
            </p>
          ) : (
            <p>
              Já possui uma conta?{' '}
              <button type="button" onClick={() => setIsLogin(true)} className="btn-text">
                Faça login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
