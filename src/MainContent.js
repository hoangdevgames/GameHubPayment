import React from 'react';
import { useAuth } from './contexts/AuthContext';
import './MainContent.css';

const MainContent = ({ activeTab }) => {
  const { user } = useAuth();

  const renderHomeContent = () => (
    <div className="home-content">
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome to GameHub Payment</h1>
        <p className="welcome-subtitle">
          Secure payment processing for FSL Game Hub
        </p>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3 className="feature-title">Fast Processing</h3>
          <p className="feature-description">
            Lightning-fast payment processing with blockchain technology
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3 className="feature-title">Secure</h3>
          <p className="feature-description">
            Bank-level security with encrypted transactions
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">💎</div>
          <h3 className="feature-title">Multiple Methods</h3>
          <p className="feature-description">
            Support for Solana-GMT and traditional payment methods
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎮</div>
          <h3 className="feature-title">Gaming Focused</h3>
          <p className="feature-description">
            Designed specifically for gaming transactions
          </p>
        </div>
      </div>

      {user && (
        <div className="user-info-section">
          <h2 className="section-title">Your Account</h2>
          <div className="user-card">
            <div className="user-avatar">
              <div className="avatar-placeholder">👤</div>
            </div>
            <div className="user-details">
              <div className="user-name">
                {user.name || user.telegramUsername || 'User'}
              </div>
              <div className="user-platform">
                {user.platform === 'telegram' ? '📱 Telegram' : '📱 LINE'}
              </div>
              {user.fslId && (
                <div className="user-fslid">FSL ID: {user.fslId}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPaymentContent = () => (
    <div className="payment-content">
      <div className="payment-info">
        <h2 className="section-title">Payment Information</h2>
        <p className="payment-description">
          To make a payment, please use the "PAY WITH SOLANA-GMT" button from the main GameHub application.
        </p>
        
        <div className="payment-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Go to GameHub</h3>
              <p>Navigate to the main GameHub application</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Select Package</h3>
              <p>Choose your Starlet package</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Click Pay</h3>
              <p>Click "PAY WITH SOLANA-GMT" button</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Complete Payment</h3>
              <p>You'll be redirected here to complete payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="main-content">
      {activeTab === 'home' && renderHomeContent()}
      {activeTab === 'payment' && renderPaymentContent()}
    </main>
  );
};

export default MainContent; 