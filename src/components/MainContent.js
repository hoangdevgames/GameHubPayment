import React from 'react';
import Backpack from '../images/Backpack.png';
import calendar from '../images/calendar.png';
import eggs_event from '../images/eggs_event-points-icon.png';
import fsl_point from '../images/fsl_point.png';
import bank_step_coin from '../images/bank_step_coin.png';
import starlet from '../images/starlet.png';
import avatar from '../images/avatar.png';

const MainContent = ({ activeTab }) => {
  const stats = [
    { label: 'Energy', value: '85/100', icon: '⚡' },
    { label: 'Steps', value: '12,450', icon: '👟' },
    { label: 'GST', value: '2,340', icon: '💰' },
    { label: 'Level', value: '15', icon: '⭐' }
  ];

  const items = [
    { name: 'Backpack', image: Backpack, value: 'Rare', rarity: 'rare' },
    { name: 'Calendar', image: calendar, value: 'Common', rarity: 'common' },
    { name: 'Egg Event', image: eggs_event, value: 'Epic', rarity: 'epic' },
    { name: 'FSL Points', image: fsl_point, value: '1,250', rarity: 'common' },
    { name: 'Step Coin', image: bank_step_coin, value: '500', rarity: 'rare' },
    { name: 'Starlet', image: starlet, value: 'Legendary', rarity: 'legendary' }
  ];

  const renderHomeContent = () => (
    <div className="fade-in">
      <div className="card">
        <h2 style={{ marginBottom: '1rem', color: '#00d4ff' }}>Today's Progress</h2>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-value">{stat.icon} {stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', color: '#00d4ff' }}>Your Items</h2>
        <div className="items-grid">
          {items.map((item, index) => (
            <div key={index} className="item-card">
              <img src={item.image} alt={item.name} className="item-image" />
              <div className="item-name">{item.name}</div>
              <div className="item-value">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', color: '#00d4ff' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn">Start Walking</button>
          <button className="btn btn-secondary">Open Backpack</button>
          <button className="btn btn-secondary">View Stats</button>
        </div>
      </div>
    </div>
  );

  const renderWalkContent = () => (
    <div className="fade-in">
      <div className="card">
        <h2 style={{ marginBottom: '1rem', color: '#00d4ff' }}>Walking Session</h2>
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚶‍♂️</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>0:00:00</div>
          <div style={{ color: 'rgba(255,255,255,0.7)' }}>Session Time</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn glow">Start</button>
          <button className="btn btn-secondary">Pause</button>
        </div>
      </div>
    </div>
  );

  const renderMarketContent = () => (
    <div className="fade-in">
      <div className="card">
        <h2 style={{ marginBottom: '1rem', color: '#00d4ff' }}>Marketplace</h2>
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
          <div style={{ color: 'rgba(255,255,255,0.7)' }}>Coming Soon</div>
        </div>
      </div>
    </div>
  );

  const renderProfileContent = () => (
    <div className="fade-in">
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={avatar} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #00d4ff' }} />
          <h2 style={{ marginTop: '1rem', color: '#00d4ff' }}>Player Profile</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span>Username</span>
            <span style={{ color: '#00d4ff' }}>STEPN_Player</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span>Total Steps</span>
            <span style={{ color: '#00d4ff' }}>1,234,567</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span>Total GST Earned</span>
            <span style={{ color: '#00d4ff' }}>45,678</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'walk':
        return renderWalkContent();
      case 'market':
        return renderMarketContent();
      case 'profile':
        return renderProfileContent();
      default:
        return renderHomeContent();
    }
  };

  return (
    <main className="main-content">
      {renderContent()}
    </main>
  );
};

export default MainContent; 