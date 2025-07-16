import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import './PaymentSuccess.css';

const PaymentSuccess = ({ onReturn, transactionData }) => {
  const { purchaseData } = useAuth();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Auto-redirect back to GamingHub after 5 seconds
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (purchaseData?.returnUrl) {
            window.location.href = purchaseData.returnUrl;
          } else {
            onReturn && onReturn();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [purchaseData, onReturn]);

  const handleReturn = () => {
    if (purchaseData?.returnUrl) {
      window.location.href = purchaseData.returnUrl;
    } else {
      onReturn && onReturn();
    }
  };

  return (
    <div className="payment-success-container">
      {/* Background */}
      <div className="success-background">
        <div className="success-gradient"></div>
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
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="success-content">
        <div className="success-icon">
          <div className="checkmark-circle">
            <div className="checkmark">✓</div>
          </div>
        </div>

        <h1 className="success-title">PAYMENT SUCCESSFUL!</h1>
        
        <div className="success-message">
          Your payment has been processed successfully. Your Starlets will be added to your account shortly.
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

        {/* Transaction Details */}
        {transactionData && (
          <div className="transaction-details">
            <div className="transaction-title">Transaction Details</div>
            <div className="transaction-item">
              <span className="transaction-label">Transaction ID:</span>
              <span className="transaction-value">{transactionData.transactionHash || transactionData.transactionId}</span>
            </div>
            <div className="transaction-item">
              <span className="transaction-label">Amount Paid:</span>
              <span className="transaction-value">
                {transactionData.amount} {transactionData.currency}
              </span>
            </div>
            <div className="transaction-item">
              <span className="transaction-label">Payment Method:</span>
              <span className="transaction-value">
                {transactionData.currency === 'GMT' ? 'Solana-GMT' : 'Credit Card'}
              </span>
            </div>
            <div className="transaction-item">
              <span className="transaction-label">Status:</span>
              <span className="transaction-value success">Completed</span>
            </div>
          </div>
        )}

        <button className="return-button" onClick={handleReturn}>
          RETURN TO GAME HUB
        </button>

        <div className="auto-redirect">
          Auto-redirecting in {countdown} seconds...
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 