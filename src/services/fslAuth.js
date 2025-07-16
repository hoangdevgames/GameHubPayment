import FSLAuthorization from 'fsl-authorization';

class FSLAuthService {
  constructor() {
    this.fslAuth = null;
    this.isInitialized = false;
    this.user = null;
  }

  // Initialize FSL Authorization
  init() {
    if (this.isInitialized) return;

    this.fslAuth = FSLAuthorization.init({
      responseType: 'code',
      appKey: 'demo-app-key', // Replace with your actual app key
      redirectUri: window.location.origin,
      scope: 'wallet', // 'basic' | 'wallet'
      state: 'stepn-app-state',
      usePopup: true,
      isApp: true,
    });

    this.isInitialized = true;
    console.log('FSL Authorization initialized');
  }

  // Sign in with FSL ID
  async signIn() {
    try {
      this.init();
      
      const result = await this.fslAuth.signInV2();
      
      if (result && result.code) {
        // In a real app, you would send this code to your backend
        // to exchange for user information
        console.log('Sign in successful:', result);
        
        // For demo purposes, we'll create a mock user
        this.user = {
          id: 'demo-user-id',
          address: '0x1234567890abcdef...',
          name: 'STEPN Player',
          isConnected: true
        };
        
        return this.user;
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  // Sign out
  signOut() {
    this.user = null;
    console.log('User signed out');
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.user && this.user.isConnected;
  }

  // Sign a message
  async signMessage(message) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const result = await this.fslAuth.callEvmSign({
        chainId: 137, // Polygon mainnet
        msg: message,
        chain: 'Polygon',
      });

      console.log('Message signed:', result);
      return result;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  }

  // Call smart contract
  async callContract(contractParams) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const result = await this.fslAuth.callEvmContract(contractParams);
      console.log('Contract call result:', result);
      return result;
    } catch (error) {
      console.error('Contract call failed:', error);
      throw error;
    }
  }

  // Get wallet balance (mock function)
  async getBalance() {
    if (!this.isAuthenticated()) {
      return null;
    }

    // Mock balance - in real app, you'd call blockchain API
    return {
      gst: '2,340',
      gmt: '150',
      usdc: '500.00',
      matic: '0.5'
    };
  }

  // Get transaction history (mock function)
  async getTransactionHistory() {
    if (!this.isAuthenticated()) {
      return [];
    }

    // Mock transaction history
    return [
      {
        id: '1',
        type: 'walk',
        amount: '+15 GST',
        timestamp: new Date().toISOString(),
        status: 'completed'
      },
      {
        id: '2',
        type: 'transfer',
        amount: '-50 GST',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed'
      }
    ];
  }

  // Verify FSL ID
  async verifyFSLID(fslId) {
    try {
      this.init();
      
      // In a real implementation, you would call FSL SDK to verify
      // For now, we'll simulate verification
      console.log('Verifying FSL ID:', fslId);
      
      // Simulate API call to verify FSL ID
      const verificationResult = await this.fslAuth.verifyFSLID(fslId);
      
      return {
        success: true,
        verified: true,
        userInfo: {
          address: '0x1234567890abcdef...',
          email: 'user@example.com',
          fslId: fslId
        }
      };
    } catch (error) {
      console.error('FSL ID verification failed:', error);
      return {
        success: false,
        verified: false,
        error: error.message
      };
    }
  }

  // Sign out
  signOut() {
    this.user = null;
    this.isInitialized = false;
    console.log('User signed out');
  }
}

// Create singleton instance
const fslAuthService = new FSLAuthService();

export default fslAuthService; 