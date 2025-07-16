import React from 'react';
import { useLocation } from 'react-router-dom';

const BottomNavigation = ({ activeTab, setActiveTab }) => {
  const location = useLocation();
  
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'walk', label: 'Walk', icon: '🚶‍♂️' },
    { id: 'market', label: 'Market', icon: '🛒' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  // Hide bottom navigation on payment pages
  if (location.pathname === '/payment' || location.pathname === '/success' || location.pathname === '/failed') {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <div className="nav-items">
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <div className="nav-icon">{item.icon}</div>
            <div className="nav-label">{item.label}</div>
          </div>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation; 