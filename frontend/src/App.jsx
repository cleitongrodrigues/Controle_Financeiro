import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AuditLogs from './components/AuditLogs';
import Profile from './components/Profile';
import ResetPassword from './components/ResetPassword';

function ResetPasswordRoute() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleResetComplete = () => {
    window.location.href = '/login';
  };

  return <ResetPassword token={token} onResetComplete={handleResetComplete} />;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Rota de redefinição de senha */}
          <Route path="/reset" element={<ResetPasswordRoute />} />

          {/* Rota pública de login */}
          <Route
            path="/login"
            element={!token ? <Auth onLogin={login} /> : <Navigate to="/" replace />}
          />

          {/* Rota raiz: se logado, mostra Dashboard; se deslogado, mostra a Landing Page pública */}
          <Route
            path="/"
            element={
              token ? (
                <Dashboard user={user} token={token} onLogout={logout} />
              ) : (
                <LandingPage />
              )
            }
          />

          {/* Perfil do usuário */}
          <Route
            path="/profile"
            element={token ? <Profile user={user} token={token} /> : <Navigate to="/login" replace />}
          />

          {/* Logs de auditoria (Redis Streams) */}
          <Route
            path="/logs"
            element={token ? <AuditLogs user={user} token={token} /> : <Navigate to="/login" replace />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
