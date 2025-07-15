import React from 'react';
import avatar from '../images/avatar.png';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">STEPN</div>
        <div className="header-actions">
          <img src={avatar} alt="User Avatar" className="avatar" />
        </div>
      </div>
    </header>
  );
};

export default Header; 