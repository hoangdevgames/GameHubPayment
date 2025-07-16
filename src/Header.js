import React from 'react';
import './Header.css';

const Header = ({ activeTab, setActiveTab }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img src="/logo192.png" alt="GameHub Payment" className="logo-image" />
          <span className="logo-text">GAME HUB PAYMENT</span>
        </div>
        
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            HOME
          </button>
          <button 
            className={`nav-tab ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            PAYMENT
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header; 