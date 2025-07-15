import React from 'react';
import { Link } from 'react-router-dom';
import './PaymentFailed.css';

const PaymentFailed = () => {
  return (
    <div className="failed-page">
      <div className="App-header">
        <h1 className="App-title">GameHub Payment</h1>
        <p className="App-subtitle">Payment Failed</p>
      </div>
      
      <div className="container">
        <div className="failed-icon">
          <div className="crossmark">✕</div>
        </div>
        
        <h2>Payment Failed</h2>
        <p className="failed-message">
          Unfortunately, your payment could not be processed. Please check your payment details and try again.
        </p>
        
        <div className="error-details">
          <h3>Possible Reasons</h3>
          <ul>
            <li>Insufficient funds in your account</li>
            <li>Invalid card information</li>
            <li>Card has expired</li>
            <li>Transaction declined by your bank</li>
            <li>Network connectivity issues</li>
          </ul>
        </div>
        
        <div className="action-buttons">
          <Link to="/" className="btn btn-primary">
            Try Again
          </Link>
          <button className="btn btn-secondary" onClick={() => window.history.back()}>
            Go Back
          </button>
        </div>
        
        <div className="support-info">
          <p>Still having issues? Contact our support team at support@gamehub.com</p>
          <p>Or call us at +1 (555) 123-4567</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed; 