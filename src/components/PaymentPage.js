import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './PaymentPage.css';

const PaymentPage = () => {
  const navigate = useNavigate();
  const { user, purchaseData } = useAuth();
  const [formData, setFormData] = useState({
    amount: '',
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('gmt');

  // Pre-fill form with purchase data if available
  useEffect(() => {
    if (purchaseData) {
      setFormData(prev => ({
        ...prev,
        amount: purchaseData.amount.toString(),
        email: user?.userProfile?.email || ''
      }));
    }
  }, [purchaseData, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (paymentMethod === 'gmt') {
        // Handle Solana-GMT payment
        await handleSolanaGMTPayment();
      } else {
        // Handle traditional card payment
        await handleCardPayment();
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setLoading(false);
      navigate('/failed');
    }
  };

  const handleSolanaGMTPayment = async () => {
    // Simulate Solana-GMT payment processing
    console.log('Processing Solana-GMT payment for:', purchaseData);
    
    // In real implementation, you would:
    // 1. Connect to Solana wallet
    // 2. Check GMT balance
    // 3. Execute transaction
    // 4. Verify transaction
    
    setTimeout(() => {
      setLoading(false);
      navigate('/success');
    }, 3000);
  };

  const handleCardPayment = async () => {
    // Simulate card payment processing
    setTimeout(() => {
      setLoading(false);
      navigate('/success');
    }, 2000);
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

  return (
    <div className="payment-page">
      <div className="App-header">
        <h1 className="App-title">GameHub Payment</h1>
        <p className="App-subtitle">Secure Payment Gateway</p>
      </div>
      
      <div className="container">
        {/* Purchase Summary */}
        {purchaseData && (
          <div className="purchase-summary">
            <h2>Purchase Summary</h2>
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label">Product:</span>
                <span className="summary-value">{purchaseData.productName || 'Starlets Package'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Quantity:</span>
                <span className="summary-value">{purchaseData.quantity || 1}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Amount:</span>
                <span className="summary-value amount">
                  {formatAmount(purchaseData.amount, purchaseData.currency || 'USD')}
                </span>
              </div>
              {purchaseData.description && (
                <div className="summary-item">
                  <span className="summary-label">Description:</span>
                  <span className="summary-value">{purchaseData.description}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Information */}
        {user && (
          <div className="user-info">
            <h3>Account Information</h3>
            <div className="user-card">
              <div className="user-avatar">
                <img src="/images/avatar.png" alt="Avatar" onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }} />
                <div className="avatar-fallback">👤</div>
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
          </div>
        )}

        <h2>Complete Your Payment</h2>
        <p className="payment-description">
          Choose your preferred payment method to complete the transaction
        </p>
        
        <form onSubmit={handleSubmit} className="payment-form">
          {purchaseData && (
            <div className="form-group">
              <label>Payment Method</label>
              <div className="payment-method-selector">
                <label className="payment-method-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="gmt"
                    checked={paymentMethod === 'gmt'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="payment-method-label">
                    <span style={{ color: '#00d4ff', fontWeight: '600' }}>Solana-GMT</span>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Pay with GMT tokens</span>
                  </span>
                </label>
                <label className="payment-method-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="payment-method-label">
                    <span style={{ fontWeight: '600' }}>Credit Card</span>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Traditional payment</span>
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="amount">
              {paymentMethod === 'gmt' ? 'Amount (GMT)' : 'Amount (USD)'}
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder={paymentMethod === 'gmt' ? '0 GMT' : '0.00'}
              min="0.01"
              step="0.01"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              required
            />
          </div>
          
          {paymentMethod === 'card' && (
            <>
              <div className="form-group">
                <label htmlFor="cardNumber">Card Number</label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expiryDate">Expiry Date</label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="cvv">CVV</label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="cardholderName">Cardholder Name</label>
                <input
                  type="text"
                  id="cardholderName"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>
            </>
          )}
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <span>
                <span className="loading-spinner"></span>
                Processing...
              </span>
            ) : (
              `Pay ${formatAmount(formData.amount, paymentMethod === 'gmt' ? 'GMT' : 'USD')}`
            )}
          </button>
        </form>
        
        <div className="security-info">
          <p>🔒 Your payment information is encrypted and secure</p>
          <p>💳 We accept Visa, Mastercard, and American Express</p>
          {paymentMethod === 'gmt' && (
            <p>⚡ Solana-GMT payments are processed on-chain for maximum security</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 