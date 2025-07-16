import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import telegramPaymentService from '../services/telegramPayment';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const { user, purchaseData } = useAuth();
  const [syncStatus, setSyncStatus] = useState('pending');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (purchaseData && user) {
      syncPurchaseToGamingHub();
    }
  }, [purchaseData, user]);

  const syncPurchaseToGamingHub = async () => {
    try {
      setSyncStatus('syncing');
      
      const userData = {
        fslId: user.id,
        telegramUID: user.telegramUID,
        platform: user.platform
      };
      
      const result = await telegramPaymentService.syncPurchaseToGamingHub(purchaseData, userData);
      
      if (result.success) {
        setSyncStatus('completed');
        setTransactionId(telegramPaymentService.generateTransactionId());
      } else {
        setSyncStatus('failed');
      }
    } catch (error) {
      console.error('Failed to sync purchase:', error);
      setSyncStatus('failed');
    }
  };
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
            <span>{transactionId || Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
          </div>
          <div className="detail-row">
            <span>Payment Status:</span>
            <span className="status-success">Completed</span>
          </div>
          {purchaseData && (
            <div className="detail-row">
              <span>Product:</span>
              <span>{purchaseData.amount} Starlets</span>
            </div>
          )}
          <div className="detail-row">
            <span>Date:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          {purchaseData && (
            <div className="detail-row">
              <span>GamingHub Sync:</span>
              <span className={`status-${syncStatus}`}>
                {syncStatus === 'pending' && '⏳ Pending'}
                {syncStatus === 'syncing' && '🔄 Syncing...'}
                {syncStatus === 'completed' && '✅ Completed'}
                {syncStatus === 'failed' && '❌ Failed'}
              </span>
            </div>
          )}
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