import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import './PaymentFailed.css';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const { purchaseData } = useAuth();

  useEffect(() => {
    // Auto-redirect back to GamingHub after 8 seconds
    const timer = setTimeout(() => {
      if (purchaseData?.returnUrl) {
        window.location.href = purchaseData.returnUrl;
      } else {
        navigate('/');
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [purchaseData, navigate]);

  const handleRetry = () => {
    navigate('/payment');
  };

  const handleReturn = () => {
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
        <div className="failed-gradient"></div>
      </div>

      {/* Error Animation */}
      <div className="error-animation">
        <div className="error-circle">
          <div className="error-x">✕</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="failed-content">
        <h1 className="failed-title">PAYMENT FAILED</h1>
        
        <div className="failed-message">
          We're sorry, but your payment could not be processed. This could be due to insufficient funds, network issues, or other technical problems.
        </div>

        {purchaseData && (
          <div className="purchase-summary">
            <div className="summary-item">
              <span className="summary-label">Amount:</span>
              <span className="summary-value">{purchaseData.amount} STARLETS</span>
            </div>
            {purchaseData.quantity > 1 && (
              <div className="summary-item">
                <span className="summary-label">Quantity:</span>
                <span className="summary-value">{purchaseData.quantity} PACKAGES</span>
              </div>
            )}
          </div>
        )}

        <div className="action-buttons">
          <button className="retry-button" onClick={handleRetry}>
            TRY AGAIN
          </button>
          <button className="return-button" onClick={handleReturn}>
            RETURN TO GAME HUB
          </button>
        </div>

        <div className="auto-redirect">
          Auto-redirecting in 8 seconds...
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed; 