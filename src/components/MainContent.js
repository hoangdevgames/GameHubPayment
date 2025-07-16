import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Backpack from '../images/Backpack.png';
import calendar from '../images/calendar.png';
import eggs_event from '../images/eggs_event-points-icon.png';
import fsl_point from '../images/fsl_point.png';
import bank_step_coin from '../images/bank_step_coin.png';
import starlet from '../images/starlet.png';
import avatar from '../images/avatar.png';

const MainContent = ({ activeTab }) => {
  const { user, balance, transactions, signMessage, callContract, purchaseData, loading } = useAuth();
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
      {user ? (
        <>
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <img src={avatar} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #00d4ff' }} />
              <h2 style={{ marginTop: '1rem', color: '#00d4ff' }}>{user.name}</h2>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                {user.address}
              </div>
            </div>
          </div>

          {balance && (
            <div className="card">
              <h2 style={{ marginBottom: '1rem', color: '#00d4ff' }}>Wallet Balance</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">💰 {balance.gst}</div>
                  <div className="stat-label">GST</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">⭐ {balance.gmt}</div>
                  <div className="stat-label">GMT</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">💵 {balance.usdc}</div>
                  <div className="stat-label">USDC</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">🔗 {balance.matic}</div>
                  <div className="stat-label">MATIC</div>
                </div>
              </div>
            </div>
          )}

          {purchaseData && (
            <div className="card" style={{ border: '2px solid #00d4ff', background: 'rgba(0, 212, 255, 0.1)' }}>
              <h2 style={{ marginBottom: '1rem', color: '#00d4ff' }}>🎮 Purchase from GamingHub</h2>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Product:</span>
                  <span style={{ fontWeight: '600' }}>{purchaseData.amount} Starlets</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Payment Method:</span>
                  <span style={{ fontWeight: '600', color: '#00d4ff' }}>Solana-GMT</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Platform:</span>
                  <span style={{ fontWeight: '600' }}>{user?.platform === 'tg' ? 'Telegram' : 'LINE'}</span>
                </div>
              </div>
              <button 
                className="btn"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => {
                  // Navigate to payment page
                  window.location.href = '/payment';
                }}
              >
                Complete Payment
              </button>
            </div>
          )}

          <div className="card">
            <h2 style={{ marginBottom: '1rem', color: '#00d4ff' }}>Quick Actions</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary"
                onClick={async () => {
                  try {
                    await signMessage('Hello STEPN!');
                    alert('Message signed successfully!');
                  } catch (error) {
                    alert('Failed to sign message');
                  }
                }}
              >
                Sign Message
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  // Mock contract call
                  alert('Contract call feature coming soon!');
                }}
              >
                Transfer GST
              </button>
            </div>
          </div>

          {transactions.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: '1rem', color: '#00d4ff' }}>Recent Transactions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {transactions.map((tx) => (
                  <div key={tx.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{tx.type}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ 
                      color: tx.amount.startsWith('+') ? '#00ff88' : '#ff6b6b',
                      fontWeight: '600'
                    }}>
                      {tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
            <h2 style={{ marginBottom: '1rem', color: '#00d4ff' }}>Connect Your Wallet</h2>
            <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>
              Connect your FSL wallet to view your profile and manage your assets
            </div>
            <button className="btn">Connect Wallet</button>
          </div>
        </div>
      )}
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
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: 'white'
        }}>
          <div className="loading-spinner" style={{ marginBottom: '1rem' }}></div>
          <p>Loading purchase data...</p>
        </div>
      )}
      {renderContent()}
    </main>
  );
};

export default MainContent; 