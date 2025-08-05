import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import fslAuthService from './services/fslAuth';
import './PaymentPage.css';

const PaymentPage = ({ onSuccess, onFailed }) => {
  const { user, purchaseData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('gmt');
  const [error, setError] = useState(null);
  const [userBalance, setUserBalance] = useState(null);

  // Redirect back to GamingHub if no purchase data
  useEffect(() => {
    if (!purchaseData) {
      // Nếu không có purchase data, quay về home
      onFailed && onFailed();
    }
  }, [purchaseData, onFailed]);

  // Load user balance on component mount
  useEffect(() => {
    if (user) {
      loadUserBalance();
    }
  }, [user]);

  const loadUserBalance = async () => {
    try {
      const balance = await fslAuthService.getBalance();
      setUserBalance(balance);
    } catch (error) {
      console.error('Failed to load user balance:', error);
    }
  };

  const handlePaymentMethod = async (method) => {
    setLoading(true);
    setError(null);
    
    try {
      switch (method) {
        case 'gmt':
          await handleGMTPayment();
          break;
        case 'polygon':
          await handlePolygonGGUSDPayment();
          break;
        case 'bsc':
          await handleBSCGGUSDPayment();
          break;

        case 'amoy':
          await handleAmoyGGUSDPayment();
          break;
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (error) {
      console.error('Payment method error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleGMTPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Processing GMT payment for:', purchaseData);
      
      // Sử dụng FSL SDK để xử lý GMT payment trên Solana
      const result = await fslAuthService.processGMTPayment(purchaseData);
      
      if (result.success) {
        console.log('GMT payment successful:', result);
        setLoading(false);
        onSuccess && onSuccess(result);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('GMT payment error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // EVM Chain Payment Handlers - copy từ FSL Integration Guide
  const handlePolygonGGUSDPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Processing Polygon GGUSD payment for:', purchaseData);
      
      const result = await fslAuthService.processGGUSDPayment(purchaseData, 137); // Polygon chainId
      
      if (result.success) {
        console.log('Polygon GGUSD payment successful:', result);
        setLoading(false);
        onSuccess && onSuccess(result);
      } else {
        throw new Error(result.error || 'Polygon payment failed');
      }
    } catch (error) {
      console.error('Polygon GGUSD payment error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleBSCGGUSDPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Processing BSC GGUSD payment for:', purchaseData);
      
      const result = await fslAuthService.processGGUSDPayment(purchaseData, 56); // BSC chainId
      
      if (result.success) {
        console.log('BSC GGUSD payment successful:', result);
        setLoading(false);
        onSuccess && onSuccess(result);
      } else {
        throw new Error(result.error || 'BSC payment failed');
      }
    } catch (error) {
      console.error('BSC GGUSD payment error:', error);
      setError(error.message);
      setLoading(false);
    }
  };



  const handleAmoyGGUSDPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Processing Amoy GGUSD payment for:', purchaseData);
      
      const result = await fslAuthService.processGGUSDPayment(purchaseData, 80002); // Amoy chainId
      
      if (result.success) {
        console.log('Amoy GGUSD payment successful:', result);
        setLoading(false);
        onSuccess && onSuccess(result);
      } else {
        throw new Error(result.error || 'Amoy payment failed');
      }
    } catch (error) {
      console.error('Amoy GGUSD payment error:', error);
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
    if (currency === 'GGUSD') {
      return `${parseFloat(amount).toFixed(2)} GGUSD`;
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

  // Get payment method details
  const getPaymentMethodDetails = (method) => {
    const baseGGUSDAmount = purchaseData.amount || 1; // 1:1 ratio for GGUSD
    
    switch (method) {
      case 'gmt':
        return {
          name: 'PAY WITH SOLANA-GMT',
          amount: formatAmount(purchaseData.amount * 0.1, 'GMT'),
          description: 'Pay with GMT tokens on Solana blockchain',
          icon: '⚡',
          balance: userBalance?.gmt ? `${userBalance.gmt.toFixed(2)} GMT` : null
        };
      case 'polygon':
        return {
          name: 'PAY WITH POLYGON-GGUSD',
          amount: formatAmount(baseGGUSDAmount, 'GGUSD'),
          description: 'Pay with GGUSD tokens on Polygon network',
          icon: '🔷',
          balance: userBalance?.ggusd_polygon ? `${userBalance.ggusd_polygon.toFixed(2)} GGUSD` : null
        };
      case 'bsc':
        return {
          name: 'PAY WITH BSC-GGUSD',
          amount: formatAmount(baseGGUSDAmount, 'GGUSD'),
          description: 'Pay with GGUSD tokens on BSC network',
          icon: '🟡',
          balance: userBalance?.ggusd_bsc ? `${userBalance.ggusd_bsc.toFixed(2)} GGUSD` : null
        };

      case 'amoy':
        return {
          name: 'PAY WITH AMOY-GGUSD',
          amount: formatAmount(baseGGUSDAmount, 'GGUSD'),
          description: 'Pay with GGUSD tokens on Amoy testnet',
          icon: '🟢',
          balance: userBalance?.ggusd_amoy ? `${userBalance.ggusd_amoy.toFixed(2)} GGUSD` : null
        };
      default:
        return {
          name: 'PAYMENT METHOD',
          amount: formatAmount(purchaseData.amount),
          description: 'Select a payment method',
          icon: '💰',
          balance: null
        };
    }
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
    <div className="payment-page">
      {/* Header */}
      <div className="payment-header">
        <button className="back-button" onClick={handleBack}>
          <img src="/images/back.svg" alt="Back" />
        </button>
        <div className="header-content">
          <h1>PAYMENT</h1>
          <p>Complete your purchase</p>
        </div>
      </div>

      {/* Payment Details */}
      <div className="payment-details">
        <div className="user-info">
          <div className="user-avatar">
            <img src="/images/avatar.png" alt="User" />
          </div>
          <div className="user-details">
            <div className="user-name">{getUserDisplayName()}</div>
            <div className="user-id">FSL ID: {user?.id || 'N/A'}</div>
          </div>
        </div>

        <div className="purchase-summary">
          <div className="purchase-item">
            <div className="item-name">{purchaseData.productName || 'Starlets'}</div>
            <div className="item-quantity">x{purchaseData.quantity || 1}</div>
          </div>
          <div className="purchase-total">
            <div className="total-label">TOTAL</div>
            <div className="total-amount">{formatAmount(purchaseData.amount)}</div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="payment-methods">
        <div className="payment-method-title">SELECT PAYMENT METHOD</div>
        
        {/* GMT Payment */}
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
            {userBalance?.gmt && (
              <div className="method-balance">Balance: {userBalance.gmt.toFixed(2)} GMT</div>
            )}
          </div>
          <div className="method-check">
            {paymentMethod === 'gmt' && <div className="checkmark">✓</div>}
          </div>
        </button>

        {/* Polygon GGUSD Payment */}
        <button 
          className={`payment-method-button polygon-button ${paymentMethod === 'polygon' ? 'selected' : ''}`}
          onClick={() => handlePaymentMethod('polygon')}
          disabled={loading}
        >
          <div className="method-icon">🔷</div>
          <div className="method-content">
            <div className="method-name">PAY WITH POLYGON-GGUSD</div>
            <div className="method-amount">{formatAmount(purchaseData.amount, 'GGUSD')}</div>
            <div className="method-description">Pay with GGUSD tokens on Polygon network</div>
            {userBalance?.ggusd_polygon && (
              <div className="method-balance">Balance: {userBalance.ggusd_polygon.toFixed(2)} GGUSD</div>
            )}
          </div>
          <div className="method-check">
            {paymentMethod === 'polygon' && <div className="checkmark">✓</div>}
          </div>
        </button>

        {/* BSC GGUSD Payment */}
        <button 
          className={`payment-method-button bsc-button ${paymentMethod === 'bsc' ? 'selected' : ''}`}
          onClick={() => handlePaymentMethod('bsc')}
          disabled={loading}
        >
          <div className="method-icon">🟡</div>
          <div className="method-content">
            <div className="method-name">PAY WITH BSC-GGUSD</div>
            <div className="method-amount">{formatAmount(purchaseData.amount, 'GGUSD')}</div>
            <div className="method-description">Pay with GGUSD tokens on BSC network</div>
            {userBalance?.ggusd_bsc && (
              <div className="method-balance">Balance: {userBalance.ggusd_bsc.toFixed(2)} GGUSD</div>
            )}
          </div>
          <div className="method-check">
            {paymentMethod === 'bsc' && <div className="checkmark">✓</div>}
          </div>
        </button>



        {/* Amoy GGUSD Payment */}
        <button 
          className={`payment-method-button amoy-button ${paymentMethod === 'amoy' ? 'selected' : ''}`}
          onClick={() => handlePaymentMethod('amoy')}
          disabled={loading}
        >
          <div className="method-icon">🟢</div>
          <div className="method-content">
            <div className="method-name">PAY WITH AMOY-GGUSD</div>
            <div className="method-amount">{formatAmount(purchaseData.amount, 'GGUSD')}</div>
            <div className="method-description">Pay with GGUSD tokens on Amoy testnet</div>
            {userBalance?.ggusd_amoy && (
              <div className="method-balance">Balance: {userBalance.ggusd_amoy.toFixed(2)} GGUSD</div>
            )}
          </div>
          <div className="method-check">
            {paymentMethod === 'amoy' && <div className="checkmark">✓</div>}
          </div>
        </button>
      </div>

      {/* Security Info */}
      <div className="security-info">
        <div className="security-icon">🔒</div>
        <div className="security-text">
          <div className="security-title">SECURE PAYMENT</div>
          <div className="security-description">
            Your payment is secured by FSL Authorization and processed through secure blockchain networks.
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="payment-error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="payment-loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing payment...</p>
        </div>
      )}
    </div>
  );
};

export default PaymentPage; 