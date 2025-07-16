import React, { createContext, useContext, useState, useEffect } from 'react';
import fslAuthService from '../services/fslAuth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [purchaseData, setPurchaseData] = useState(null);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const currentUser = fslAuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadUserData();
    }
    
    // Check for incoming data from GamingHub
    checkIncomingData();
  }, []);

  const checkIncomingData = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userDataParam = urlParams.get('userData');
    const purchaseDataParam = urlParams.get('purchaseData');
    const source = urlParams.get('source');
    
    if (source === 'gaminghub' && userDataParam && purchaseDataParam) {
      try {
        const userData = JSON.parse(atob(userDataParam));
        const purchaseInfo = JSON.parse(atob(purchaseDataParam));
        
        console.log('Received data from GamingHub:', { userData, purchaseInfo });
        
        // Auto-login with received data
        autoLoginWithGamingHubData(userData, purchaseInfo);
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Failed to parse incoming data:', error);
      }
    }
  };

  const autoLoginWithGamingHubData = async (userData, purchaseInfo) => {
    setLoading(true);
    try {
      // Verify FSL ID first
      const verificationResult = await fslAuthService.verifyFSLID(userData.fslId);
      
      if (verificationResult.success && verificationResult.verified) {
        // Set user data
        const user = {
          id: userData.fslId,
          address: verificationResult.userInfo?.address || '0x...',
          name: userData.telegramFirstName || 'STEPN Player',
          isConnected: true,
          platform: userData.platform,
          telegramUID: userData.telegramUID,
          telegramUsername: userData.telegramUsername,
          userProfile: userData.userProfile
        };
        
        setUser(user);
        setPurchaseData(purchaseInfo);
        
        // Load user data
        await loadUserData();
        
        console.log('Auto-login successful with GamingHub data');
      } else {
        console.error('FSL ID verification failed');
        throw new Error('FSL ID verification failed');
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const [balanceData, transactionData] = await Promise.all([
        fslAuthService.getBalance(),
        fslAuthService.getTransactionHistory()
      ]);
      
      setBalance(balanceData);
      setTransactions(transactionData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const signIn = async () => {
    setLoading(true);
    try {
      const userData = await fslAuthService.signIn();
      setUser(userData);
      await loadUserData();
      return userData;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    fslAuthService.signOut();
    setUser(null);
    setBalance(null);
    setTransactions([]);
  };

  const signMessage = async (message) => {
    try {
      const result = await fslAuthService.signMessage(message);
      return result;
    } catch (error) {
      console.error('Sign message error:', error);
      throw error;
    }
  };

  const callContract = async (contractParams) => {
    try {
      const result = await fslAuthService.callContract(contractParams);
      return result;
    } catch (error) {
      console.error('Contract call error:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await loadUserData();
    }
  };

  const value = {
    user,
    loading,
    balance,
    transactions,
    purchaseData,
    signIn,
    signOut,
    signMessage,
    callContract,
    refreshUserData,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 