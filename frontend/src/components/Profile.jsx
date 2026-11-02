import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = ({ user, token }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bioInput, setBioInput] = useState('');
  const [nomeInput, setNomeInput] = useState('');
  const [fileInput, setFileInput] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setBioInput(data.bio || '');
        setNomeInput(data.nome || '');
      } else {
        console.error('Falha ao buscar perfil');
      }
    } catch (error) {
      console.error('Erro de rede', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData();
    formData.append('nome', nomeInput);
    formData.append('bio', bioInput);
    if (fileInput) {
      formData.append('foto', fileInput);
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        alert('Perfil atualizado com sucesso!');
        fetchProfile();
        setFileInput(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Falha ao atualizar perfil');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar dados');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="loading">Carregando perfil...</div>;
  if (!profileData) return <div className="error">Erro ao carregar o perfil.</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Voltar ao Painel
        </button>
        <h2>Meu Perfil & Finanças</h2>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="avatar-section">
            <div className="avatar-preview">
              {profileData.foto_url ? (
                <img src={profileData.foto_url} alt="Foto de perfil" />
              ) : (
                <div className="avatar-placeholder">
                  {profileData.nome.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="role-tag-container">
              <span className={`role-badge ${profileData.role}`}>
                Papel: {profileData.role?.toUpperCase()}
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="profile-form">
            <div className="form-group">
              <label>Nome Completo:</label>
              <input
                type="text"
                value={nomeInput}
                onChange={(e) => setNomeInput(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>E-mail:</label>
              <input type="email" value={profileData.email} disabled />
            </div>

            <div className="form-group">
              <label>Papel no Sistema (RBAC):</label>
              <input type="text" value={profileData.role} disabled />
              <small className="help-text">
                Definido pela arquitetura de permissões: <code>titular</code>, <code>membro</code> ou <code>admin</code>.
              </small>
            </div>

            <div className="form-group">
              <label>Bio / Apresentação:</label>
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Ex: Gestor financeiro da família, focado em economizar..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Foto de Perfil (Salva no MinIO):</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFileInput(e.target.files[0])}
              />
            </div>

            <button type="submit" disabled={uploading} className="save-button">
              {uploading ? 'Salvando no MinIO...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        <div className="profile-accounts-section">
          <h3>Minhas Contas e Carteiras Vinculadas ({profileData.contas?.length || 0})</h3>
          <div className="accounts-grid">
            {profileData.contas && profileData.contas.length > 0 ? (
              profileData.contas.map((acc) => (
                <div key={acc.id} className="account-card-mini">
                  <div className="acc-mini-header">
                    <strong>{acc.nome}</strong>
                    <span className={`badge-mini ${acc.tipo}`}>{acc.tipo}</span>
                  </div>
                  <div className="acc-mini-role">
                    Seu papel: <strong>{acc.papel}</strong>
                  </div>
                  <div className="acc-mini-date">
                    Membro desde {new Date(acc.membro_desde).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-accounts">Nenhuma conta cadastrada ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
