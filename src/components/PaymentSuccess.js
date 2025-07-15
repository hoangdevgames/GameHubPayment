import React from 'react';
import { Link } from 'react-router-dom';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  return (
    <div className="success-page">
      <div className="App-header">
        <h1 className="App-title">GameHub Payment</h1>
        <p className="App-subtitle">Payment Successful</p>
      </div>
      
      <div className="container">
        <div className="success-icon">
          <div className="checkmark">✓</div>
        </div>
        
        <h2>Payment Successful!</h2>
        <p className="success-message">
          Your payment has been processed successfully. You will receive a confirmation email shortly.
        </p>
        
        <div className="transaction-details">
          <h3>Transaction Details</h3>
          <div className="detail-row">
            <span>Transaction ID:</span>
            <span>{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
          </div>
          <div className="detail-row">
            <span>Status:</span>
            <span className="status-success">Completed</span>
          </div>
          <div className="detail-row">
            <span>Date:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="action-buttons">
          <Link to="/" className="btn btn-primary">
            Make Another Payment
          </Link>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            Print Receipt
          </button>
        </div>
        
        <div className="support-info">
          <p>Need help? Contact our support team at support@gamehub.com</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 