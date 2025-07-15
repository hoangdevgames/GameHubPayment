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

  // Check if user is already authenticated on app load
  useEffect(() => {
    const currentUser = fslAuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadUserData();
    }
  }, []);

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