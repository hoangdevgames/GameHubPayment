/**
 * Starlet Purchase Manager - Copy từ FSL Authorization Integration Guide
 * 
 * Quản lý toàn bộ purchase flow với multi-chain support
 */
import fslAuthService from './fslAuth';

class StarletPurchaseManager {
  constructor(appKey) {
    this.appKey = appKey || 'MiniGame';
    this.fslAuth = fslAuthService;
    this.isLoggedIn = false;
    this.userWallets = null;
    this.userInfo = null;
  }

  // Step 1: User Authentication - copy từ guide
  async login() {
    try {
      const result = await this.fslAuth.signIn();
      if (result) {
        console.log('Login successful');
        this.isLoggedIn = true;
        
        // Get user info and wallet addresses from FSL
        await this.loadUserProfile();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      this.isLoggedIn = false;
      return false;
    }
  }

  async loadUserProfile() {
    try {
      // Lấy user info từ FSL service
      const currentUser = this.fslAuth.getCurrentUser();
      if (currentUser) {
        this.userInfo = currentUser;
        this.userWallets = {
          solana: currentUser.userProfile?.solAddr || currentUser.walletAddress,
          ethereum: currentUser.userProfile?.evmAddr || currentUser.userProfile?.ethAddr
        };
        
        console.log('User profile loaded:', this.userInfo);
        console.log('User wallets:', this.userWallets);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      throw error;
    }
  }

  // Step 2: Verify wallet ownership - copy từ guide
  async verifyWalletOwnership(chain) {
    if (!this.isLoggedIn || !this.userWallets) {
      throw new Error('User must be logged in');
    }

    try {
      if (chain === 'solana') {
        if (!this.userWallets.solana) {
          throw new Error('No Solana wallet address found');
        }
        return await this.fslAuth.signMessage(`Verify Solana wallet for Starlet purchase\nPublic Key: ${this.userWallets.solana}\nTimestamp: ${Date.now()}`);
      } else {
        if (!this.userWallets.ethereum) {
          throw new Error('No EVM wallet address found');
        }
        const chainId = this.getChainId(chain);
        return await this.fslAuth.signEvmVerificationMessage(this.userWallets.ethereum, chainId);
      }
    } catch (error) {
      console.error('Wallet verification failed:', error);
      throw error;
    }
  }

  // Step 3: Execute purchase - copy từ guide với modifications
  async purchaseStarlets(chain, starletAmount, paymentAmount) {
    if (!this.isLoggedIn) {
      throw new Error('User must be logged in');
    }

    try {
      // Verify wallet ownership first
      await this.verifyWalletOwnership(chain);
      
      // Create purchase data
      const purchaseData = {
        amount: starletAmount,
        quantity: starletAmount,
        productName: 'Starlets',
        paymentAmount: paymentAmount
      };
      
      // Execute payment based on chain
      let txHash;
      switch (chain) {
        case 'polygon':
          txHash = await this.fslAuth.processGGUSDPayment(purchaseData, 137);
          break;
        case 'bsc':
          txHash = await this.fslAuth.processGGUSDPayment(purchaseData, 56);
          break;
        case 'ethereum':
          txHash = await this.fslAuth.processGGUSDPayment(purchaseData, 1);
          break;
        case 'solana':
          txHash = await this.fslAuth.processGMTPayment(purchaseData);
          break;
        default:
          throw new Error(`Unsupported chain: ${chain}`);
      }
      
      console.log(`Purchase completed on ${chain}:`, txHash);
      return txHash;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  getChainId(chain) {
    // Updated for TESTNET chain IDs
    const chainIds = {
      'polygon': 80002,     // Polygon Amoy Testnet  
      'bsc': 97,            // BSC Testnet
      'ethereum': 11155111, // Ethereum Sepolia
      'arbitrum': 421614,   // Arbitrum Sepolia (NEW)
    };
    return chainIds[chain];
  }

  // Step 4: Check purchase status - copy từ guide
  async checkPurchaseStatus(txHash, chain) {
    try {
      // Mock status check - trong production sẽ call backend API
      console.log(`Checking status for transaction ${txHash} on ${chain}`);
      
      // Simulate async check
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        confirmed: true,
        starletAmount: 100,
        status: 'completed',
        transactionHash: txHash,
        chain: chain,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to check purchase status:', error);
      throw error;
    }
  }

  // Transaction monitoring - copy từ guide
  async monitorTransaction(txHash, chain, maxAttempts = 10) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const status = await this.checkPurchaseStatus(txHash, chain);
        if (status.confirmed) {
          return status;
        }
        
        // Wait before next attempt (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error);
        if (attempt === maxAttempts) throw error;
      }
    }
    
    throw new Error('Transaction confirmation timeout');
  }

  // Get supported chains - Updated for TESTNET
  getSupportedChains() {
    return [
      {
        id: 'polygon',
        name: 'Polygon Amoy Testnet',
        currency: 'GGUSD',
        icon: '🔷',
        chainId: 80002
      },
      {
        id: 'bsc',
        name: 'BSC Testnet',
        currency: 'GGUSD',
        icon: '🟡',
        chainId: 97
      },
      {
        id: 'ethereum',
        name: 'Ethereum Sepolia',
        currency: 'GGUSD',
        icon: '🟦',
        chainId: 11155111
      },
      {
        id: 'arbitrum',
        name: 'Arbitrum Sepolia',
        currency: 'GGUSD',
        icon: '🔹',
        chainId: 421614
      },
      {
        id: 'solana',
        name: 'Solana Devnet',
        currency: 'GMT',
        icon: '⚡',
        chainId: null
      }
    ];
  }

  // Compatibility methods for StarletStore.js
  getLoginStatus() {
    return this.isLoggedIn;
  }

  getUserInfo() {
    return this.userInfo;
  }

  getUserWallets() {
    return this.userWallets;
  }

  logout() {
    this.isLoggedIn = false;
    this.userInfo = null;
    this.userWallets = null;
    // Also logout from FSL service
    if (this.fslAuth && this.fslAuth.signOut) {
      this.fslAuth.signOut();
    }
  }

  // Error handling - copy từ guide
  handlePurchaseError(error) {
    if (error.message.includes('User rejected')) {
      return {
        code: 'USER_REJECTED',
        message: 'Transaction was cancelled by user',
        userFriendly: 'You cancelled the transaction. Please try again if you want to complete the purchase.'
      };
    } else if (error.message.includes('insufficient funds')) {
      return {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient balance for transaction',
        userFriendly: 'You don\'t have enough balance. Please add funds to your wallet and try again.'
      };
    } else if (error.message.includes('network')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred',
        userFriendly: 'Network connection error. Please check your internet and try again.'
      };
    } else {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unknown error occurred',
        userFriendly: 'An unexpected error occurred. Please try again or contact support.'
      };
    }
  }
}

// Export cả class và default instance
export { StarletPurchaseManager };

// Tạo singleton instance
const starletPurchaseManager = new StarletPurchaseManager();
export default starletPurchaseManager;