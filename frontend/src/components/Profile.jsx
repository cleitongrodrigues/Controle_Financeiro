import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = ({ user, token }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bioInput, setBioInput] = useState('');
  const [fileInput, setFileInput] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setBioInput(data.bio || '');
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
    formData.append('bio', bioInput);
    if (fileInput) {
      formData.append('foto', fileInput);
    }

    try {
      const res = await fetch('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        alert('Perfil atualizado com sucesso!');
        fetchProfile(); // Recarrega os dados para mostrar a nova foto
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
        <button className="back-button" onClick={() => navigate('/')}>← Voltar pro Catálogo</button>
        <h2>Meu Perfil</h2>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="avatar-section">
            <div className="avatar-preview">
              {profileData.foto_url ? (
                <img src={profileData.foto_url} alt="Foto de perfil" />
              ) : (
                <div className="avatar-placeholder">{profileData.nome.charAt(0).toUpperCase()}</div>
              )}
            </div>
          </div>
          
          <form onSubmit={handleUpdate} className="profile-form">
            <div className="form-group">
              <label>Nome:</label>
              <input type="text" value={profileData.nome} disabled />
            </div>

            <div className="form-group">
              <label>Email:</label>
              <input type="text" value={profileData.email} disabled />
            </div>

            <div className="form-group">
              <label>Biografia:</label>
              <textarea 
                value={bioInput} 
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Conte um pouco sobre os filmes que você gosta..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Nova foto de perfil:</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setFileInput(e.target.files[0])}
              />
            </div>

            <button type="submit" className="save-button" disabled={uploading}>
              {uploading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        <div className="favorites-list">
          <h3>Meus Filmes Favoritos ({profileData.favoritos?.length || 0})</h3>
          {profileData.favoritos && profileData.favoritos.length > 0 ? (
            <div className="movies-grid">
              {profileData.favoritos.map(fav => (
                <div key={fav.id} className="fav-card">
                  🍿 Filme ID: {fav.movie_id} adicionado em {new Date(fav.criado_em).toLocaleDateString()}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-favorites">Você ainda não curtiu nenhum filme.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
