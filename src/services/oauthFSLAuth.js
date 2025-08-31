import { API_CONFIG } from './fslConfig';

/**
 * OAuth-based FSL Authentication Service
 * 
 * Flow:
 * 1. OAuth Authentication → Get access token
 * 2. User Identity Verification → Compare with /app/marketUserData
 * 3. FSL SDK Payment → Use access token for blockchain operations
 */
class OAuthFSLAuthService {
  constructor() {
    this.accessToken = null;
    this.currentUser = null;
    this.fslAuth = null;
    this.isInitialized = false;
    this.isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
    
    // FSL OAuth Configuration
    this.FSL_OAUTH_URL = 'https://9ijsflpfgm3.joysteps.io/api/account/oauth/authorize';
    this.FSL_USER_PROFILE_URL = 'https://9ijsflpfgm3.joysteps.io/api/account/party/user';
    this.APP_KEY = 'MiniGame';
    this.REDIRECT_URI = window.location.href; // Use current web URL
    
    this.apiToken = null; // New property for API token

    // ✅ NEW: Add callback for verification success
    this.onVerificationSuccess = null;

  }

  // ✅ NEW: Method to set verification success callback
  setVerificationSuccessCallback(callback) {
    this.onVerificationSuccess = callback;
  }

  /**
   * Phase 1: OAuth Authentication
   * Redirect user to FSL OAuth for authentication
   */
  async authenticateWithOAuth() {
    try {
      console.log('🔄 Starting OAuth authentication...');
      
      const params = new URLSearchParams({
        response_type: 'token',
        appkey: this.APP_KEY,
        redirect_uri: encodeURIComponent(this.REDIRECT_URI),
        scope: 'basic',
        state: 'test',
      });
      
      const oauthUrl = `${this.FSL_OAUTH_URL}?${params.toString()}`;
      console.log('🔗 OAuth URL:', oauthUrl);
      
      // Redirect to FSL OAuth
      window.location.href = oauthUrl;
      
    } catch (error) {
      console.error('❌ OAuth authentication failed:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback and extract access token
   * This should be called from the callback page
   */
  handleOAuthCallback() {
    try {
      console.log('🔄 Handling OAuth callback...');
      
      // Get access token from URL fragment
      const fragment = window.location.hash.substring(1);
      const params = new URLSearchParams(fragment);
      
              // ❌ REMOVED: Direct accessToken assignment
        // this.accessToken = params.get('access_token');  // REMOVED
      const state = params.get('state');
      const error = params.get('error');
      
      console.log('🔍 OAuth callback params:', { accessToken: !!this.accessToken, state, error });
      
      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }
      
      if (!this.accessToken) {
        throw new Error('No access token received from OAuth');
      }
      
      // Store access token in instance only - NO localStorage
      // localStorage.setItem('fsl_access_token', this.accessToken);  // REMOVED
      // localStorage.setItem('fsl_oauth_timestamp', Date.now().toString());  // REMOVED
      
      console.log('✅ OAuth callback successful, access token stored in instance only');
      
      return {
        success: true,
        accessToken: this.accessToken,
        state: state
      };
      
    } catch (error) {
      console.error('❌ OAuth callback handling failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set access token from external source (e.g., AuthContext)
   * ⚠️ IMPORTANT: This method will NEVER write to localStorage
   * It only updates the instance token to prevent conflicts
   */
  setAccessToken(token) {
    console.log('🔑 Setting access token from external source:', token.substring(0, 10) + '...');
    this.accessToken = token;
    
    // ❌ NEVER write to localStorage - only use instance token
    // This prevents conflicts with old tokens
    console.log('✅ Access token set to instance (not stored in localStorage)');
  }

  /**
   * Get stored access token or trigger re-authentication
   * ⚠️ IMPORTANT: This method will NEVER fallback to localStorage
   * It only returns the current instance token or throws an error
   */
  async getAccessToken() {
    try {
      // 🔑 ONLY use current instance token - NO localStorage fallback
      if (this.accessToken) {
        console.log('✅ Using current instance access token:', this.accessToken.substring(0, 10) + '...');
        return this.accessToken;
      }
      
      // ❌ NO localStorage fallback - throw error if no token
      throw new Error('No access token available. Please set token via setAccessToken() first.');
      
    } catch (error) {
      console.error('❌ Failed to get access token:', error);
      throw error;
    }
  }

  /**
   * Clear stored OAuth tokens
   * ⚠️ IMPORTANT: This method will NOT clear instance tokens
   * It only clears localStorage to prevent conflicts
   */
  clearStoredTokens() {
    localStorage.removeItem('fsl_access_token');
    localStorage.removeItem('fsl_oauth_timestamp');
    // ❌ DO NOT clear instance tokens - keep current working tokens
    // this.accessToken = null;  // REMOVED
    // this.apiToken = null;     // REMOVED
    console.log('🗑️ localStorage tokens cleared (instance tokens preserved)');
  }

  /**
   * Phase 2: User Identity Verification
   * Get user profile from FSL API and verify with /app/marketUserData
   */
  async verifyUserIdentity() {
    try {
      console.log('🔍 Verifying user identity...');
      
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      // Get user profile from FSL API
      const fslUserProfile = await this.getFSLUserProfile();
      console.log('📊 FSL User Profile:', fslUserProfile);
      
      // Get market user data from your API
      const marketUserData = await this.getMarketUserData();
      console.log('📊 Market User Data:', marketUserData);
      
      // Compare FSL IDs
      const fslId = fslUserProfile.data?.fslUid || fslUserProfile.data?.uid;
      const marketFSLId = marketUserData.fslId;
      
      console.log('🔍 Comparing FSL IDs:');
      console.log('  FSL API FSL ID:', fslId);
      console.log('  Market API FSL ID:', marketFSLId);
      
      if (!fslId || !marketFSLId) {
        throw new Error('Missing FSL ID from one or both sources');
      }
      
      const isMatch = fslId.toString() === marketFSLId.toString();
      console.log('✅ FSL ID match:', isMatch);
      
      if (isMatch) {
        // Store verified user data
        this.currentUser = {
          fslId: fslId,
          fslProfile: fslUserProfile.data,
          marketProfile: marketUserData,
          isVerified: true,
          verifiedAt: new Date().toISOString()
        };
        
        console.log('✅ User identity verified:', this.currentUser);
        
        // ✅ NEW: Call callback if verification is successful
        if (this.onVerificationSuccess) {
          this.onVerificationSuccess({
            success: true,
            user: this.currentUser,
            fslId: fslId
          });
        }
        
        return {
          success: true,
          user: this.currentUser,
          fslId: fslId
        };
      } else {
        throw new Error('FSL ID mismatch. User may be logged into different account.');
      }
      
    } catch (error) {
      console.error('❌ User identity verification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user profile from FSL API using access token
   */
  async getFSLUserProfile() {
    try {
      console.log('📡 Getting FSL user profile...');
      console.log('🔗 API URL:', this.FSL_USER_PROFILE_URL);
      
      // 🔑 Ensure we have the latest access token
      if (!this.accessToken) {
        throw new Error('No access token available. Please set token via setAccessToken() first.');
      }
      
      console.log('🔑 Access Token:', this.accessToken);
      console.log('🔑 Request Headers:', {
        'Authorization': `Bearer ${this.accessToken}`,
      });
      
      const response = await fetch(this.FSL_USER_PROFILE_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`FSL API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ FSL user profile received:', data);
      
      return data;
      
    } catch (error) {
      console.error('❌ Failed to get FSL user profile:', error);
      throw error;
    }
  }

  /**
   * Get market user data from your API
   */
  async getMarketUserData() {
    try {
      console.log('📡 Getting market user data...');
      
      // Use marketUserDataService instead of direct API call
      // This ensures consistency with the rest of the app
      if (!this.apiToken) {
        throw new Error('No API token available for market user data');
      }
      
      // Import and use marketUserDataService
      const { default: marketUserDataService } = await import('./marketUserDataService');
      const apiData = await marketUserDataService.fetchMarketUserData(this.apiToken);
      
      console.log('✅ Market user data received:', apiData);
      return apiData;
      
    } catch (error) {
      console.error('❌ Failed to get market user data:', error);
      throw error;
    }
  }

  /**
   * Set API token for market user data calls
   */
  setApiToken(token) {
    console.log('🔑 Setting API token for market user data:', token);
    this.apiToken = token;
  }









  /**
   * Check if user is authenticated and verified
   */
  isUserAuthenticated() {
    return !!(this.accessToken && this.currentUser?.isVerified);
  }

  /**
   * Get current user info
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get access token for FSL SDK to use
   */
  getAccessTokenForFSL() {
    return this.accessToken;
  }

  /**
   * Logout and clear all data
   */
  logout() {
    this.clearStoredTokens();
    this.currentUser = null;
    this.fslAuth = null;
    this.isInitialized = false;
    // ❌ DO NOT clear instance tokens - keep current working tokens
    // this.accessToken = null;  // REMOVED
    // this.apiToken = null;     // REMOVED
    console.log('✅ User logged out successfully (instance tokens preserved)');
  }

  /**
   * Debug method to show current token state
   */
  debugTokenState() {
    console.log('🔍 OAuth FSL Auth Service Token State:');
    console.log('  Instance Access Token:', this.accessToken ? this.accessToken.substring(0, 10) + '...' : 'null');
    console.log('  Instance API Token:', this.apiToken ? this.apiToken.substring(0, 10) + '...' : 'null');
    console.log('  localStorage Access Token:', localStorage.getItem('fsl_access_token') ? localStorage.getItem('fsl_access_token').substring(0, 10) + '...' : 'null');
    console.log('  localStorage Timestamp:', localStorage.getItem('fsl_oauth_timestamp'));
  }

  /**
   * Force clear instance tokens (use with caution)
   * This should only be called when you want to completely reset the service
   */
  forceClearInstanceTokens() {
    console.log('⚠️ Force clearing instance tokens...');
    this.setAccessToken(null);  // Use setter method
    this.apiToken = null;
    console.log('✅ Instance tokens cleared');
  }
}

const oauthFSLAuthService = new OAuthFSLAuthService();
export default oauthFSLAuthService;
