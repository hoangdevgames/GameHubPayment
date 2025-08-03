import React from 'react';
import './BottomNavigation.css';

const BottomNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bottom-navigation">
      <button 
        className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => setActiveTab('home')}
      >
        <div className="nav-icon">🏠</div>
        <span className="nav-label">Home</span>
      </button>
      
      <button 
        className={`nav-item ${activeTab === 'payment' ? 'active' : ''}`}
        onClick={() => setActiveTab('payment')}
      >
        <div className="nav-icon">💳</div>
        <span className="nav-label">Payment</span>
      </button>
      
      <button 
        className={`nav-item ${activeTab === 'starlet-store' ? 'active' : ''}`}
        onClick={() => setActiveTab('starlet-store')}
      >
        <div className="nav-icon">🌟</div>
        <span className="nav-label">Starlet Store</span>
      </button>
    </nav>
  );
};

export default BottomNavigation; 