import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Auth from './components/Auth';
import Catalog from './components/Catalog';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';

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
          <Route path="/reset" element={<ResetPasswordRoute />} />
          <Route
            path="/login"
            element={!token ? <Auth onLogin={login} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/"
            element={token ? <Catalog user={user} onLogout={logout} token={token} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/profile"
            element={token ? <Profile user={user} token={token} /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
