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
      
      console.log('Verifying FSL ID:', fslId);
      
      // Since FSL SDK doesn't have a direct verifyFSLID method,
      // we'll simulate verification by checking if the FSL ID is valid
      // In a real implementation, you would:
      // 1. Call your backend API to verify the FSL ID
      // 2. Or use FSL SDK's signIn method to verify
      
      // For now, we'll simulate a successful verification
      // You can replace this with actual API call to your backend
      const isValidFSLID = fslId && fslId.toString().length > 0;
      
      if (isValidFSLID) {
        // Simulate successful verification
        return {
          success: true,
          verified: true,
          userInfo: {
            address: '0x' + Math.random().toString(36).substr(2, 40),
            email: 'user@example.com',
            fslId: fslId
          }
        };
      } else {
        throw new Error('Invalid FSL ID');
      }
    } catch (error) {
      console.error('FSL ID verification failed:', error);
      return {
        success: false,
        verified: false,
        error: error.message
      };
    }
  }

  // Alternative: Verify FSL ID through backend API
  async verifyFSLIDWithBackend(fslId) {
    try {
      // Replace with your actual backend API endpoint
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/verify-fsl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fslId })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          verified: data.verified,
          userInfo: data.userInfo
        };
      } else {
        throw new Error('Backend verification failed');
      }
    } catch (error) {
      console.error('Backend FSL ID verification failed:', error);
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