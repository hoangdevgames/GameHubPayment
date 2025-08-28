import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const [apiToken, setApiToken] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  // Thêm refs để prevent duplicate calls
  const isInitialized = useRef(false);
  const isAutoLoginInProgress = useRef(false);
  const hasLoadedUserData = useRef(false);

  // Check if user is already authenticated on app load
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
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
    const source = urlParams.get('source');
    const token = urlParams.get('token');
    
    if (source === 'gaminghub' && userDataParam && token && !isAutoLoginInProgress.current) {
      try {
        const userData = JSON.parse(atob(userDataParam));
        
        console.log('Received data from GamingHub:', { userData, token });
        
        // Debug: Log wallet addresses received
        console.log('🔗 Received wallet addresses from GamingHub:');
        console.log('  EVM Address:', userData.userProfile?.evmAddr);
        console.log('  Solana Address:', userData.userProfile?.solAddr);
        console.log('  API Token:', token);
        
        // Store the API token
        setApiToken(token);
        
        // Auto-login with received data
        autoLoginWithGamingHubData(userData, token);
        
        // KHÔNG clear URL parameters để giữ data khi reload
        // window.history.replaceState({}, document.title, url.pathname + url.search);
      } catch (error) {
        console.error('Failed to parse incoming data:', error);
        // Show user-friendly error message
        alert('Failed to load purchase data. Please try again or contact support.');
      }
    }
  };

  const autoLoginWithGamingHubData = async (userData, token) => {
    if (isAutoLoginInProgress.current) return;
    isAutoLoginInProgress.current = true;
    
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
        
        // Load user data only once
        if (!hasLoadedUserData.current) {
          await loadUserData();
          hasLoadedUserData.current = true;
        }
        
        console.log('Auto-login successful with GamingHub data');
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
        
        console.log('Auto-login completed with mock verification (demo mode)');
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
      // Don't throw error, just log it
      // In production, you might want to show an error message to user
    } finally {
      setLoading(false);
      isAutoLoginInProgress.current = false;
    }
  };

  const loadUserData = async () => {
    if (hasLoadedUserData.current) return;
    
    try {
      const [balanceData, transactionData] = await Promise.all([
        fslAuthService.getBalance(),
        fslAuthService.getTransactionHistory()
      ]);
      
      setBalance(balanceData);
      setTransactions(transactionData);
      hasLoadedUserData.current = true;
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const signIn = async () => {
    if (loading) return; // Prevent multiple sign-in attempts
    
    setLoading(true);
    try {
      const userData = await fslAuthService.signIn();
      setUser(userData);
      
      // Reset flag and load user data
      hasLoadedUserData.current = false;
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
    setSelectedPackage(null);
    
    // Reset flags
    hasLoadedUserData.current = false;
    isAutoLoginInProgress.current = false;
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

  const selectPackage = (packageData) => {
    setSelectedPackage(packageData);
  };

  const clearSelectedPackage = () => {
    setSelectedPackage(null);
  };

  const value = {
    user,
    loading,
    balance,
    transactions,
    apiToken,
    selectedPackage,
    signIn,
    signOut,
    signMessage,
    callContract,
    refreshUserData,
    selectPackage,
    clearSelectedPackage,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 