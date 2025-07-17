import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import fslAuthService from './services/fslAuth';
import './PaymentPage.css';

const PaymentPage = ({ onSuccess, onFailed }) => {
  const { user, purchaseData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('gmt');
  const [error, setError] = useState(null);

  // Redirect back to GamingHub if no purchase data
  useEffect(() => {
    if (!purchaseData) {
      // Nếu không có purchase data, quay về home
      onFailed && onFailed();
    }
  }, [purchaseData, onFailed]);

  const handlePaymentMethod = async (method) => {
    setPaymentMethod(method);
    setError(null);
    
    if (method === 'gmt') {
      await handleSolanaGMTPayment();
    } else if (method === 'card') {
      await handleCardPayment();
    }
  };

  const handleSolanaGMTPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Processing Solana-GMT payment for:', purchaseData);
      
      // Sử dụng FSL SDK để xử lý payment
      const result = await fslAuthService.processGMTPayment(purchaseData);
      
      if (result.success) {
        console.log('GMT payment successful:', result);
        setLoading(false);
        onSuccess && onSuccess(result);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Solana-GMT payment error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Processing card payment for:', purchaseData);
      
      // Sử dụng FSL SDK để xử lý card payment
      const result = await fslAuthService.processCardPayment(purchaseData);
      
      if (result.success) {
        console.log('Card payment successful:', result);
        setLoading(false);
        onSuccess && onSuccess(result);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Card payment error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Redirect back to GamingHub
    if (purchaseData?.returnUrl) {
      window.location.href = purchaseData.returnUrl;
    } else {
      onFailed && onFailed();
    }
  };

  // Format amount for display
  const formatAmount = (amount, currency = 'USD') => {
    if (currency === 'GMT') {
      return `${amount} GMT`;
    }
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.telegramUsername) return `@${user.telegramUsername}`;
    if (user?.userProfile?.firstName) return user.userProfile.firstName;
    return 'User';
  };

  if (!purchaseData) {
    return (
      <div className="payment-loading">
        <div className="loading-spinner"></div>
        <p>Loading payment information....</p>
      </div>
    );
  }

  return (
    <div className="payment-page-container">
      {/* Background */}
      <div className="payment-background">
        <div className="background-gradient"></div>
      </div>

      {/* Header */}
      <header className="payment-header">
        <button className="back-button" onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="header-title">PAYMENT</div>
        <div className="header-spacer"></div>
      </header>

      {/* Main Content */}
      <div className="payment-main-content">
        {/* Product Display */}
        <div className="product-display-container">
          <div className="product-display">
            <div className="product-background">
              <div className="product-bg-gradient"></div>
            </div>
            <div className="product-icon">
              <div className="starlet-icon">⭐</div>
            </div>
            <div className="floating-elements">
              <div className="floating-star s1">⭐</div>
              <div className="floating-star s2">⭐</div>
              <div className="floating-star s3">⭐</div>
              <div className="floating-star s4">⭐</div>
              <div className="floating-star s5">⭐</div>
            </div>
            <div className="product-details">
              <div className="product-amount">
                <span className="x-mark">×</span>
                {purchaseData.amount} STARLETS
              </div>
              {purchaseData.quantity > 1 && (
                <div className="product-quantity">
                  <span className="x-mark">×</span>
                  {purchaseData.quantity} PACKAGES
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="product-description">
          USE STARLETS TO LEVEL UP YOUR ACCOUNT AND UNLOCK SPECIAL FEATURES WITHIN FSL GAME HUB
        </div>

        {/* User Info */}
        {user && (
          <div className="user-info-card">
            <div className="user-avatar">
              <div className="avatar-placeholder">👤</div>
            </div>
            <div className="user-details">
              <div className="user-name">{getUserDisplayName()}</div>
              <div className="user-platform">
                {user.platform === 'telegram' ? '📱 Telegram' : '📱 LINE'}
              </div>
              {user.fslId && (
                <div className="user-fslid">FSL ID: {user.fslId}</div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <div className="error-text">{error}</div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="payment-methods">
          <div className="payment-method-title">SELECT PAYMENT METHOD</div>
          
          <button 
            className={`payment-method-button gmt-button ${paymentMethod === 'gmt' ? 'selected' : ''}`}
            onClick={() => handlePaymentMethod('gmt')}
            disabled={loading}
          >
            <div className="method-icon">⚡</div>
            <div className="method-content">
              <div className="method-name">PAY WITH SOLANA-GMT</div>
              <div className="method-amount">{formatAmount(purchaseData.amount * 0.1, 'GMT')}</div>
              <div className="method-description">Pay with GMT tokens on Solana blockchain</div>
            </div>
            <div className="method-check">
              {paymentMethod === 'gmt' && <div className="checkmark">✓</div>}
            </div>
          </button>

          <button 
            className={`payment-method-button card-button ${paymentMethod === 'card' ? 'selected' : ''}`}
            onClick={() => handlePaymentMethod('card')}
            disabled={loading}
          >
            <div className="method-icon">💳</div>
            <div className="method-content">
              <div className="method-name">PAY WITH CREDIT CARD</div>
              <div className="method-amount">{formatAmount(purchaseData.amount, 'USD')}</div>
              <div className="method-description">Visa, Mastercard, American Express</div>
            </div>
            <div className="method-check">
              {paymentMethod === 'card' && <div className="checkmark">✓</div>}
            </div>
          </button>
        </div>

        {/* Security Info */}
        <div className="security-info">
          <div className="security-item">
            <span className="security-icon">🔒</span>
            <span>Your payment information is encrypted and secure</span>
          </div>
          <div className="security-item">
            <span className="security-icon">⚡</span>
            <span>Solana-GMT payments are processed on-chain</span>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              {paymentMethod === 'gmt' ? 'Processing Solana-GMT Payment...' : 'Processing Card Payment...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage; 