import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './PaymentFailed.css';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const { purchaseData } = useAuth();

  const handleRetry = () => {
    navigate('/payment');
  };

  const handleBackToGamingHub = () => {
    if (purchaseData?.returnUrl) {
      window.location.href = purchaseData.returnUrl;
    } else {
      navigate('/');
    }
  };

  return (
    <div className="payment-failed-container">
      {/* Background */}
      <div className="failed-background">
        <div className="background-gradient"></div>
      </div>

      {/* Failed Content */}
      <div className="failed-content">
        <div className="failed-icon">
          <div className="error-circle">
            <div className="error-mark">✕</div>
          </div>
        </div>

        <h1 className="failed-title">PAYMENT FAILED</h1>
        <div className="failed-subtitle">Your payment could not be processed</div>

        {purchaseData && (
          <div className="purchase-summary">
            <div className="summary-item">
              <span className="summary-label">Product:</span>
              <span className="summary-value">{purchaseData.amount} Starlets</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Amount:</span>
              <span className="summary-value amount">
                {purchaseData.currency === 'GMT' ? `${purchaseData.amount} GMT` : `$${purchaseData.amount}`}
              </span>
            </div>
          </div>
        )}

        <div className="failed-message">
          <p>We encountered an issue processing your payment.</p>
          <p>Please check your payment method and try again.</p>
        </div>

        <div className="error-details">
          <h3>Possible reasons:</h3>
          <ul>
            <li>Insufficient funds in your account</li>
            <li>Network connectivity issues</li>
            <li>Payment method restrictions</li>
            <li>Transaction timeout</li>
          </ul>
        </div>

        <div className="failed-actions">
          <button className="retry-button" onClick={handleRetry}>
            Try Again
          </button>
          <button className="back-button" onClick={handleBackToGamingHub}>
            Return to GamingHub
          </button>
        </div>

        <div className="support-info">
          <p>Need help? Contact support at support@gamehub.com</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed; 