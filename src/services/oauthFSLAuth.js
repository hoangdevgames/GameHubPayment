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
    this.REDIRECT_URI = window.location.origin + window.location.pathname; // Use current web URL
    

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
      
      this.accessToken = params.get('access_token');
      const state = params.get('state');
      const error = params.get('error');
      
      console.log('🔍 OAuth callback params:', { accessToken: !!this.accessToken, state, error });
      
      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }
      
      if (!this.accessToken) {
        throw new Error('No access token received from OAuth');
      }
      
      // Store access token
      localStorage.setItem('fsl_access_token', this.accessToken);
      localStorage.setItem('fsl_oauth_timestamp', Date.now().toString());
      
      console.log('✅ OAuth callback successful, access token stored');
      
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
   * Get stored access token or trigger re-authentication
   */
  async getAccessToken() {
    try {
      // Check if we have a valid access token
      const storedToken = localStorage.getItem('fsl_access_token');
      const timestamp = localStorage.getItem('fsl_oauth_timestamp');
      
      if (storedToken && timestamp) {
        const tokenAge = Date.now() - parseInt(timestamp);
        const tokenLifetime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (tokenAge < tokenLifetime) {
          this.accessToken = storedToken;
          console.log('✅ Using stored access token');
          return this.accessToken;
        } else {
          console.log('⚠️ Access token expired, clearing...');
          this.clearStoredTokens();
        }
      }
      
      // No valid token, need to authenticate
      console.log('🔄 No valid access token, redirecting to OAuth...');
      await this.authenticateWithOAuth();
      
    } catch (error) {
      console.error('❌ Failed to get access token:', error);
      throw error;
    }
  }

  /**
   * Clear stored OAuth tokens
   */
  clearStoredTokens() {
    localStorage.removeItem('fsl_access_token');
    localStorage.removeItem('fsl_oauth_timestamp');
    this.accessToken = null;
    console.log('🗑️ Stored tokens cleared');
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
      
      const response = await fetch(this.FSL_USER_PROFILE_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
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
      
      // This should call your existing /app/marketUserData API
      // You'll need to implement this based on your current implementation
      const response = await fetch(`${API_CONFIG.server_url}/api/app/marketUserData`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add any required headers (auth tokens, etc.)
        }
      });
      
      if (!response.ok) {
        throw new Error(`Market API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Market user data received:', data);
      
      return data;
      
    } catch (error) {
      console.error('❌ Failed to get market user data:', error);
      throw error;
    }
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
    console.log('✅ User logged out successfully');
  }
}

const oauthFSLAuthService = new OAuthFSLAuthService();
export default oauthFSLAuthService;
