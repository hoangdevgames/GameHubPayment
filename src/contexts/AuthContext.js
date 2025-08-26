import React, { createContext, useContext, useState, useEffect } from 'react';
import fslAuthService from '../services/fslAuth';
import marketUserDataService from '../services/marketUserDataService';

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
  const [showInsufficientDataPopup, setShowInsufficientDataPopup] = useState(false);
  const [missingDataFields, setMissingDataFields] = useState([]);
  const [incomingUserData, setIncomingUserData] = useState(null);

  // Check for incoming data from GamingHub or API on app load - NO AUTO-LOGIN
  useEffect(() => {
    // Check for incoming data from GamingHub or try new API first
    checkIncomingData();
  }, []);

  const checkIncomingData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userDataParam = urlParams.get('userData');
    const source = urlParams.get('source');
    const token = urlParams.get('token');
    
    // Try new API first if we have a token
    if (token) {
      try {
        console.log('🔄 Attempting to fetch user data from new API...');
        const apiData = await marketUserDataService.fetchMarketUserData(token);
        
        if (apiData && marketUserDataService.isDataSufficient(apiData)) {
          console.log('✅ New API data is sufficient, storing for later use');
          
          // 🔑 Set FSL ID từ API vào FSL Auth Service
          if (apiData.fslId) {
            console.log('🔑 Setting FSL ID from API:', apiData.fslId);
            fslAuthService.setFSLIDFromAPI(apiData.fslId);
          }
          
          // Transform API data to userProfile structure
          const userProfile = marketUserDataService.transformApiDataToUserProfile(apiData);
          
          // Check for critical missing fields and show popup if needed
          const criticalMissingFields = [];
          if (!apiData.solAddr) criticalMissingFields.push('Solana wallet address');
          if (apiData.level === undefined || apiData.level === null) criticalMissingFields.push('User level');
          if (!apiData.email) criticalMissingFields.push('Email address');
          
          if (criticalMissingFields.length > 0) {
            setMissingDataFields(criticalMissingFields);
            setShowInsufficientDataPopup(true);
          }
          
          // Store the API token and user data for later use
          setApiToken(token);
          setIncomingUserData({
            source: 'api',
            userProfile: userProfile,
            token: token,
            fslId: apiData.fslId //  Lưu FSL ID
          });
          
          console.log('📦 API data stored, ready for payment process');
          return;
        } else {
          console.log('⚠️ New API data is insufficient, falling back to GamingHub parameters');
        }
      } catch (error) {
        console.log('❌ New API failed, falling back to GamingHub parameters:', error.message);
      }
    }
    
    // Fallback to GamingHub parameters
    if (source === 'gaminghub' && userDataParam && token) {
      try {
        const userData = JSON.parse(atob(userDataParam));
        
        console.log('🔄 Fallback: Received data from GamingHub, storing for later use');
        
        // Debug: Log wallet addresses received
        console.log('🔗 Received wallet addresses from GamingHub:');
        console.log('  EVM Address:', userData.userProfile?.evmAddr);
        console.log('  Solana Address:', userData.userProfile?.solAddr);
        console.log('  API Token:', token);
        
        // 🔑 Set FSL ID từ GamingHub vào FSL Auth Service (nếu có)
        if (userData.fslId) {
          console.log('🔑 Setting FSL ID from GamingHub:', userData.fslId);
          fslAuthService.setFSLIDFromAPI(userData.fslId);
        }
        
        // Store the API token and user data for later use - NO AUTO-LOGIN
        setApiToken(token);
        setIncomingUserData({
          source: 'gaminghub',
          userData: userData,
          token: token
        });
        
        console.log('📦 GamingHub data stored, ready for payment process');
        
        // KHÔNG clear URL parameters để giữ data khi reload
        // window.history.replaceState({}, document.title, url.pathname + url.search);
      } catch (error) {
        console.error('Failed to parse incoming data:', error);
        // Show user-friendly error message
        alert('Failed to load purchase data. Please try again or contact support.');
      }
    }
  };

  // REMOVED: autoLoginWithGamingHubData and autoLoginWithApiData functions
  // These are no longer needed since we don't auto-login

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      // Only load transaction history, not balance (balance will be loaded when needed)
      const transactionData = await fslAuthService.getTransactionHistory();
      setTransactions(transactionData);
      
      // Note: Balance is loaded separately when needed for payment
      // We don't need to load FSL balance on app startup
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // Manual login function - only called when user explicitly wants to login
  const signIn = async () => {
    setLoading(true);
    try {
      const userData = await fslAuthService.signIn();
      setUser(userData);
      await loadUserData();
      return userData;
    } catch (error) {
      console.error('Sign in failed:', error);
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
      console.error('Sign message failed:', error);
      throw error;
    }
  };

  const callContract = async (contractParams) => {
    try {
      const result = await fslAuthService.callContract(contractParams);
      return result;
    } catch (error) {
      console.error('Call contract failed:', error);
      throw error;
    }
  };

  // Function to get stored incoming data for payment process
  const getIncomingUserData = () => {
    return incomingUserData;
  };

  // Function to clear incoming data after payment
  const clearIncomingUserData = () => {
    setIncomingUserData(null);
  };

  // Function to select a package for purchase
  const selectPackage = (packageData) => {
    setSelectedPackage(packageData);
  };

  // Function to clear selected package
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
    setSelectedPackage,
    selectPackage,
    clearSelectedPackage,
    showInsufficientDataPopup,
    missingDataFields,
    setShowInsufficientDataPopup,
    signIn,
    signOut,
    signMessage,
    callContract,
    getIncomingUserData,
    clearIncomingUserData,
    // Keep these for backward compatibility
    loadUserData,
    setUser,
    setBalance,
    setTransactions,
    setApiToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 