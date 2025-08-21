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
          Your payment has been processed successfully. 
          {transactionData?.confirmData?.success ? 
            'Your Starlets and Tickets have been added to your account!' : 
            'Your Starlets will be added to your account shortly.'
          }
        </div>

        {/* Show confirmed purchase data if available, otherwise show original purchase data */}
        {transactionData?.confirmData?.success ? (
          <div className="purchase-summary">
            <div className="summary-item">
              <span className="summary-label">Starlets Received:</span>
              <span className="summary-value">{transactionData.confirmData.starlets} STARLETS</span>
            </div>
            {transactionData.confirmData.ticket > 0 && (
              <div className="summary-item">
                <span className="summary-label">Tickets Received:</span>
                <span className="summary-value">{transactionData.confirmData.ticket} TICKETS</span>
              </div>
            )}
          </div>
        ) : purchaseData && (
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
            
            {/* Show confirmed transaction data from backend if available */}
            {transactionData.confirmData?.success ? (
              <>
                <div className="transaction-item">
                  <span className="transaction-label">Order ID:</span>
                  <span className="transaction-value">{transactionData.confirmData.orderId}</span>
                </div>
                <div className="transaction-item">
                  <span className="transaction-label">Starlets Received:</span>
                  <span className="transaction-value">{transactionData.confirmData.starlets} STARLETS</span>
                </div>
                <div className="transaction-item">
                  <span className="transaction-label">Tickets Received:</span>
                  <span className="transaction-value">{transactionData.confirmData.ticket} TICKETS</span>
                </div>
                <div className="transaction-item">
                  <span className="transaction-label">Amount Paid:</span>
                  <span className="transaction-value">{transactionData.confirmData.price} {transactionData.currency}</span>
                </div>
                <div className="transaction-item">
                  <span className="transaction-label">Product ID:</span>
                  <span className="transaction-value">{transactionData.confirmData.productId}</span>
                </div>
                <div className="transaction-item">
                  <span className="transaction-label">Transaction Time:</span>
                  <span className="transaction-value">{new Date(transactionData.confirmData.time).toLocaleString()}</span>
                </div>
                <div className="transaction-item">
                  <span className="transaction-label">Status:</span>
                  <span className="transaction-value success">
                    {transactionData.confirmData.state === 100 ? 'Completed' : `State: ${transactionData.confirmData.state}`}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="transaction-item">
                  <span className="transaction-label">Amount Paid:</span>
                  <span className="transaction-value">
                    {transactionData.amount} {transactionData.currency}
                  </span>
                </div>
                <div className="transaction-item">
                  <span className="transaction-label">Payment Method:</span>
                  <span className="transaction-value">
                    {transactionData.currency === 'GMT' ? 'Solana-GMT' : 
                     transactionData.currency === 'GGUSD' ? 'GGUSD-Amoy' : 'Credit Card'}
                  </span>
                </div>
                <div className="transaction-item">
                  <span className="transaction-label">Status:</span>
                  <span className="transaction-value success">
                    {transactionData.confirmData?.success === false ? 'Pending Confirmation' : 'Completed'}
                  </span>
                </div>
              </>
            )}
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