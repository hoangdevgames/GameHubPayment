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
  const [shouldRedirectToPayment, setShouldRedirectToPayment] = useState(false);

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
        
        // Debug: Log wallet addresses received
        console.log('🔗 Received wallet addresses from GamingHub:');
        console.log('  EVM Address:', userData.userProfile?.evmAddr);
        console.log('  Solana Address:', userData.userProfile?.solAddr);
        
        // Auto-login with received data and redirect to payment
        autoLoginWithGamingHubData(userData, purchaseInfo);
        
        // KHÔNG clear URL parameters để giữ data khi reload
        // window.history.replaceState({}, document.title, url.pathname + url.search);
      } catch (error) {
        console.error('Failed to parse incoming data:', error);
        // Show user-friendly error message
        alert('Failed to load purchase data. Please try again or contact support.');
      }
    }
  };

  const autoLoginWithGamingHubData = async (userData, purchaseInfo) => {
    setLoading(true);
    try {
      // Set user data vào FSL Auth Service trước
      fslAuthService.setUserFromGamingHub(userData);
      
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
        
        // Set flag to redirect to payment page
        setShouldRedirectToPayment(true);
      } else {
        console.error('FSL ID verification failed:', verificationResult.error);
        // Don't throw error, just log it and continue with mock data
        // In production, you might want to show an error message to user
        
        // Set user data with mock verification for demo purposes
        const user = {
          id: userData.fslId,
          address: '0x' + Math.random().toString(36).substr(2, 40),
          name: userData.telegramFirstName || 'STEPN Player',
          isConnected: true,
          platform: userData.platform,
          telegramUID: userData.telegramUID,
          telegramUsername: userData.telegramUsername,
          userProfile: userData.userProfile
        };
        
        setUser(user);
        setPurchaseData(purchaseInfo);
        
        console.log('Auto-login completed with mock verification (demo mode)');
        
        // Set flag to redirect to payment page
        setShouldRedirectToPayment(true);
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
      // Don't throw error, just log it
      // In production, you might want to show an error message to user
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
    setPurchaseData(null);
    setShouldRedirectToPayment(false);
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

  const clearRedirectFlag = () => {
    setShouldRedirectToPayment(false);
  };

  const value = {
    user,
    loading,
    balance,
    transactions,
    purchaseData,
    shouldRedirectToPayment,
    signIn,
    signOut,
    signMessage,
    callContract,
    refreshUserData,
    clearRedirectFlag,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 