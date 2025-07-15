import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import avatar from '../images/avatar.png';

const Header = () => {
  const { user, signIn, signOut, loading } = useAuth();

  const handleAuthClick = async () => {
    if (user) {
      signOut();
    } else {
      try {
        await signIn();
      } catch (error) {
        console.error('Login failed:', error);
      }
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">STEPN</div>
        <div className="header-actions">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                  {user.address.slice(0, 6)}...{user.address.slice(-4)}
                </div>
              </div>
              <img src={avatar} alt="User Avatar" className="avatar" onClick={handleAuthClick} />
            </div>
          ) : (
            <button 
              className="btn" 
              onClick={handleAuthClick}
              disabled={loading}
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 