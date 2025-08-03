import React, { useState, useEffect } from 'react';
import { StarletPurchaseManager } from '../services/StarletPurchaseManager';
import './StarletStore.css';

const StarletStore = () => {
  const [purchaseManager] = useState(() => new StarletPurchaseManager(process.env.REACT_APP_FSL_APP_KEY || 'YOUR_APP_KEY'));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [userWallets, setUserWallets] = useState(null);
  const [starletAmount, setStarletAmount] = useState('');
  const [ggusdAmount, setGgusdAmount] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    setIsLoggedIn(purchaseManager.getLoginStatus());
    setUserInfo(purchaseManager.getUserInfo());
    setUserWallets(purchaseManager.getUserWallets());
  }, [purchaseManager]);

  const updateStatus = (message, type) => {
    setStatus({ message, type });
  };

  const handleLogin = async () => {
    setLoading(true);
    updateStatus('Logging in...', 'loading');
    
    try {
      const success = await purchaseManager.login();
      if (success) {
        setIsLoggedIn(true);
        setUserInfo(purchaseManager.getUserInfo());
        setUserWallets(purchaseManager.getUserWallets());
        
        updateStatus('Login successful! Choose your payment method.', 'success');
      } else {
        updateStatus('Login failed. Please try again.', 'error');
      }
    } catch (error) {
      updateStatus(`Login error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (chain) => {
    const starlets = parseInt(starletAmount);
    const ggusd = parseFloat(ggusdAmount);
    
    // Validation
    if (!starlets || starlets < 1) {
      updateStatus('Please enter a valid starlet amount (minimum 1)', 'error');
      return;
    }
    
    if (!ggusd || ggusd < 0.01) {
      updateStatus('Please enter a valid GGUSD amount (minimum 0.01)', 'error');
      return;
    }

    setLoading(true);
    try {
      updateStatus(`Processing payment on ${chain.toUpperCase()}...`, 'loading');
      
      const txHash = await purchaseManager.purchaseStarlets(chain, starlets, ggusd);
      
      updateStatus(
        `🎉 Payment successful! Transaction: ${txHash.substring(0, 10)}... 
         Your ${starlets} Starlets will be added to your account shortly.`, 
        'success'
      );
      
      // Clear form
      setStarletAmount('');
      setGgusdAmount('');
      
      // Check status after a delay
      setTimeout(() => checkPurchaseStatus(txHash, chain), 5000);
      
    } catch (error) {
      console.error('Purchase failed:', error);
      updateStatus(`❌ Payment failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkPurchaseStatus = async (txHash, chain) => {
    try {
      const statusResult = await purchaseManager.checkPurchaseStatus(txHash, chain);
      if (statusResult.confirmed) {
        updateStatus(
          `✅ Purchase confirmed! ${statusResult.starletAmount} Starlets added to your account.`, 
          'success'
        );
      }
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  const handleLogout = () => {
    purchaseManager.logout();
    setIsLoggedIn(false);
    setUserInfo(null);
    setUserWallets(null);
    setStarletAmount('');
    setGgusdAmount('');
    updateStatus('', '');
  };

  if (!isLoggedIn) {
    return (
      <div className="starlet-store">
        <div className="login-section">
          <h1>🌟 Starlet Store</h1>
          <h2>Welcome to Starlet Store</h2>
          <p>Login with your FSL ID to purchase Starlets using GGUSD tokens.</p>
          <button 
            className="chain-button login-btn" 
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Logging in...' : '🔐 Login with FSL ID'}
          </button>
          {status.message && (
            <div className={`status ${status.type}`}>
              {status.message}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="starlet-store">
      <div className="purchase-section">
        <h1>🌟 Starlet Store</h1>
        <h2>Purchase Starlets</h2>
        
        <div className="user-info">
          <p><strong>Welcome!</strong></p>
          <p>Ethereum/Polygon/BSC: {userWallets?.ethereum || 'Not connected'}</p>
          <p>Solana: {userWallets?.solana || 'Not connected'}</p>
        </div>
        
        <div className="input-section">
          <label>
            Starlets to buy:
            <input 
              type="number" 
              value={starletAmount}
              onChange={(e) => setStarletAmount(e.target.value)}
              placeholder="100" 
              min="1" 
              max="10000"
              disabled={loading}
            />
          </label>
        </div>
        
        <div className="input-section">
          <label>
            GGUSD to pay:
            <input 
              type="number" 
              value={ggusdAmount}
              onChange={(e) => setGgusdAmount(e.target.value)}
              placeholder="10.00" 
              min="0.01" 
              step="0.01"
              disabled={loading}
            />
          </label>
        </div>
        
        <div className="payment-methods">
          <h3>Choose Payment Method:</h3>
          <button 
            className="chain-button polygon" 
            onClick={() => handlePurchase('polygon')}
            disabled={loading}
          >
            🔷 Pay with Polygon GGUSD
          </button>
          <button 
            className="chain-button bsc" 
            onClick={() => handlePurchase('bsc')}
            disabled={loading}
          >
            🟡 Pay with BSC GGUSD
          </button>
          <button 
            className="chain-button ethereum" 
            onClick={() => handlePurchase('ethereum')}
            disabled={loading}
          >
            ⚡ Pay with Ethereum GGUSD
          </button>
          {/* Solana button commented out until implementation */}
          {/* <button 
            className="chain-button solana" 
            onClick={() => handlePurchase('solana')}
            disabled={loading}
          >
            ⭐ Pay with Solana GGUSD
          </button> */}
        </div>
        
        {status.message && (
          <div className={`status ${status.type}`}>
            {status.message}
          </div>
        )}
        
        <button 
          className="logout-btn" 
          onClick={handleLogout}
          disabled={loading}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default StarletStore;