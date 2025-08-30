import React, { useState, useEffect } from 'react';
import oauthFSLAuthService from '../services/oauthFSLAuth';
import './OAuthLoginButton.css';

/**
 * OAuth Login Button Component
 * Replaces the existing FSL SDK login with OAuth-based authentication
 */
const OAuthLoginButton = ({ onLoginSuccess, onLoginError, className = '' }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already authenticated on component mount
    checkAuthenticationStatus();
  }, []);

  /**
   * Check if user is already authenticated
   */
  const checkAuthenticationStatus = async () => {
    try {
      const isAuth = oauthFSLAuthService.isUserAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        const user = oauthFSLAuthService.getCurrentUser();
        setUserInfo(user);
        console.log('✅ User already authenticated:', user);
      }
    } catch (error) {
      console.error('❌ Error checking authentication status:', error);
    }
  };

  /**
   * Handle OAuth login
   */
  const handleOAuthLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Starting OAuth login...');
      
      // Start OAuth flow
      await oauthFSLAuthService.authenticateWithOAuth();
      
      // Note: The actual authentication happens in the OAuth callback page
      // This function will redirect the user to FSL OAuth
      
    } catch (error) {
      console.error('❌ OAuth login failed:', error);
      setError(error.message);
      setIsLoading(false);
      
      if (onLoginError) {
        onLoginError(error);
      }
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Logging out...');
      
      // Logout from OAuth service
      oauthFSLAuthService.logout();
      
      // Update local state
      setIsAuthenticated(false);
      setUserInfo(null);
      setError(null);
      
      console.log('✅ Logout successful');
      
      // Notify parent component
      if (onLoginSuccess) {
        onLoginSuccess(null); // Pass null to indicate logout
      }
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify user identity after OAuth callback
   */
  const verifyUserIdentity = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Verifying user identity...');
      
      // Verify user identity
      const verificationResult = await oauthFSLAuthService.verifyUserIdentity();
      
      if (verificationResult.success) {
        setIsAuthenticated(true);
        setUserInfo(verificationResult.user);
        setError(null);
        
        console.log('✅ User identity verified:', verificationResult.user);
        
        // Notify parent component
        if (onLoginSuccess) {
          onLoginSuccess(verificationResult.user);
        }
        
        return true;
      } else {
        throw new Error(verificationResult.error);
      }
      
    } catch (error) {
      console.error('❌ User identity verification failed:', error);
      setError(error.message);
      setIsAuthenticated(false);
      setUserInfo(null);
      
      if (onLoginError) {
        onLoginError(error);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check for OAuth callback and handle it
   */
  useEffect(() => {
    const checkOAuthCallback = () => {
      // Check if we have an access token from OAuth callback
      const accessToken = localStorage.getItem('fsl_access_token');
      
      if (accessToken && !isAuthenticated) {
        console.log('🔄 OAuth callback detected, verifying user identity...');
        
        // Set the access token in the service
        oauthFSLAuthService.accessToken = accessToken;
        
        // Verify user identity
        verifyUserIdentity();
      }
    };

    // Check immediately
    checkOAuthCallback();
    
    // Also check when storage changes (for cross-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === 'fsl_access_token') {
        checkOAuthCallback();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated]);

  /**
   * Handle popup messages from OAuth callback
   */
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'fsl_oauth_success') {
        console.log('✅ OAuth success message received:', event.data);
        
        // Set the access token
        oauthFSLAuthService.accessToken = event.data.accessToken;
        
        // Verify user identity
        verifyUserIdentity();
      } else if (event.data.type === 'fsl_oauth_error') {
        console.error('❌ OAuth error message received:', event.data);
        setError(`OAuth Error: ${event.data.error}`);
        setIsLoading(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <div className={`oauth-login-button ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Processing...</span>
        </div>
      </div>
    );
  }

  // Render authenticated state
  if (isAuthenticated && userInfo) {
    return (
      <div className={`oauth-login-button authenticated ${className}`}>
        <div className="user-info">
          <div className="user-avatar">
            {userInfo.fslProfile?.avatar ? (
              <img src={userInfo.fslProfile.avatar} alt="User Avatar" />
            ) : (
              <div className="avatar-placeholder">
                {userInfo.fslId?.toString().charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="user-details">
            <div className="user-name">
              {userInfo.fslProfile?.nickname || userInfo.fslProfile?.username || `FSL User ${userInfo.fslId}`}
            </div>
            <div className="user-id">ID: {userInfo.fslId}</div>
            <div className="verification-status">
              ✅ Verified at {new Date(userInfo.verifiedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
        <button 
          className="logout-btn"
          onClick={handleLogout}
          disabled={isLoading}
        >
          Logout
        </button>
      </div>
    );
  }

  // Render login button
  return (
    <div className={`oauth-login-button ${className}`}>
      {error && (
        <div className="error-message">
          ❌ {error}
          <button 
            className="retry-btn"
            onClick={() => {
              setError(null);
              handleOAuthLogin();
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      <button 
        className="login-btn"
        onClick={handleOAuthLogin}
        disabled={isLoading}
      >
        <span className="login-icon">🔐</span>
        <span className="login-text">Login with FSL ID</span>
      </button>
      
      <div className="login-info">
        <small>
          Secure OAuth authentication with FSL ID
        </small>
      </div>
    </div>
  );
};

export default OAuthLoginButton;
