import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { purchaseData } = useAuth();

  useEffect(() => {
    // Auto-redirect back to GamingHub after 5 seconds
    const timer = setTimeout(() => {
      if (purchaseData?.returnUrl) {
        window.location.href = purchaseData.returnUrl;
      } else {
        navigate('/');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [purchaseData, navigate]);

  const handleBackToGamingHub = () => {
    if (purchaseData?.returnUrl) {
      window.location.href = purchaseData.returnUrl;
    } else {
      navigate('/');
    }
  };

  return (
    <div className="payment-success-container">
      {/* Background */}
      <div className="success-background">
        <div className="background-gradient"></div>
      </div>

      {/* Success Content */}
      <div className="success-content">
        <div className="success-icon">
          <div className="checkmark-circle">
            <div className="checkmark">✓</div>
          </div>
        </div>

        <h1 className="success-title">PAYMENT SUCCESSFUL!</h1>
        <div className="success-subtitle">Your purchase has been completed</div>

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
            {purchaseData.quantity > 1 && (
              <div className="summary-item">
                <span className="summary-label">Quantity:</span>
                <span className="summary-value">{purchaseData.quantity} packages</span>
              </div>
            )}
          </div>
        )}

        <div className="success-message">
          <p>Your Starlets have been added to your account.</p>
          <p>You can now use them in FSL Game Hub!</p>
        </div>

        <div className="success-actions">
          <button className="back-button" onClick={handleBackToGamingHub}>
            Return to GamingHub
          </button>
        </div>

        <div className="auto-redirect">
          <p>Redirecting automatically in 5 seconds...</p>
        </div>
      </div>

      {/* Confetti Animation */}
      <div className="confetti-container">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default PaymentSuccess; 