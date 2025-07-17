import fslAuthService from './fslAuth';

class TelegramPaymentService {
  constructor() {
    this.gamingHubBaseUrl = 'https://emperor1412.github.io/GamingHub';
  }

  // Sync purchase data back to GamingHub
  async syncPurchaseToGamingHub(purchaseData, userData) {
    try {
      console.log('Syncing purchase data to GamingHub:', { purchaseData, userData });
      
      // In a real implementation, you would:
      // 1. Call GamingHub's API to sync the purchase
      // 2. Update user's starlets balance
      // 3. Log the transaction
      
      const syncData = {
        fslId: userData.fslId,
        telegramUID: userData.telegramUID,
        platform: userData.platform,
        purchase: {
          amount: purchaseData.amount,
          productType: purchaseData.productType,
          currency: purchaseData.currency,
          transactionId: this.generateTransactionId(),
          timestamp: new Date().toISOString(),
          status: 'completed'
        }
      };

      // Simulate API call to GamingHub
      const response = await fetch(`${this.gamingHubBaseUrl}/api/sync-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syncData)
      });

      if (response.ok) {
        console.log('Purchase synced successfully to GamingHub');
        return { success: true };
      } else {
        throw new Error('Failed to sync purchase');
      }
    } catch (error) {
      console.error('Error syncing purchase to GamingHub:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate a unique transaction ID
  generateTransactionId() {
    return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  // Get GMT balance using FSL SDK
  async getGMTBalance(walletAddress) {
    try {
      // Use FSL SDK to get real balance
      const balance = await fslAuthService.getBalance();
      
      return {
        balance: balance.gmt || 0,
        currency: 'GMT',
        walletAddress: walletAddress || fslAuthService.getCurrentUser()?.address
      };
    } catch (error) {
      console.error('Error getting GMT balance:', error);
      throw error;
    }
  }

  // Get SOL balance using FSL SDK
  async getSOLBalance(walletAddress) {
    try {
      // Use FSL SDK to get real balance
      const balance = await fslAuthService.getBalance();
      
      return {
        balance: balance.sol || 0,
        currency: 'SOL',
        walletAddress: walletAddress || fslAuthService.getCurrentUser()?.solanaAddress
      };
    } catch (error) {
      console.error('Error getting SOL balance:', error);
      throw error;
    }
  }

  // Get USDC balance using FSL SDK
  async getUSDCBalance(walletAddress) {
    try {
      // Use FSL SDK to get real balance
      const balance = await fslAuthService.getBalance();
      
      return {
        balance: balance.usdc || 0,
        currency: 'USDC',
        walletAddress: walletAddress || fslAuthService.getCurrentUser()?.address
      };
    } catch (error) {
      console.error('Error getting USDC balance:', error);
      throw error;
    }
  }

  // Process Solana-GMT payment using FSL SDK
  async processSolanaGMTPayment(amount, walletAddress) {
    try {
      console.log('Processing Solana-GMT payment:', { amount, walletAddress });
      
      // Use FSL SDK for GMT payment
      const purchaseData = {
        amount: amount,
        productType: 'starlets',
        currency: 'GMT',
        quantity: 1
      };

      const result = await fslAuthService.processGMTPayment(purchaseData);
      
      if (result.success) {
        return {
          success: true,
          transactionHash: result.transactionHash,
          amount: result.amount,
          currency: 'GMT',
          timestamp: result.timestamp
        };
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Solana-GMT payment failed:', error);
      throw error;
    }
  }

  // Process Solana payment using FSL SDK
  async processSolanaPayment(amount, walletAddress) {
    try {
      console.log('Processing Solana payment:', { amount, walletAddress });
      
      // Use FSL SDK for SOL payment
      const purchaseData = {
        amount: amount,
        productType: 'starlets',
        currency: 'SOL',
        quantity: 1
      };

      const result = await fslAuthService.processSolanaPayment(purchaseData);
      
      if (result.success) {
        return {
          success: true,
          transactionHash: result.transactionHash,
          amount: result.amount,
          currency: 'SOL',
          timestamp: result.timestamp
        };
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Solana payment failed:', error);
      throw error;
    }
  }

  // Process USDC payment using FSL SDK
  async processUSDCPayment(amount, walletAddress) {
    try {
      console.log('Processing USDC payment:', { amount, walletAddress });
      
      // Use FSL SDK for USDC payment
      const purchaseData = {
        amount: amount,
        productType: 'starlets',
        currency: 'USDC',
        quantity: 1
      };

      const result = await fslAuthService.processUSDCPayment(purchaseData);
      
      if (result.success) {
        return {
          success: true,
          transactionHash: result.transactionHash,
          amount: result.amount,
          currency: 'USDC',
          timestamp: result.timestamp
        };
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('USDC payment failed:', error);
      throw error;
    }
  }

  // Get user's wallet addresses using FSL SDK
  async getWalletAddresses() {
    try {
      const addresses = await fslAuthService.getWalletAddresses();
      return {
        evm: addresses.evm,
        solana: addresses.solana
      };
    } catch (error) {
      console.error('Error getting wallet addresses:', error);
      throw error;
    }
  }

  // Verify transaction using FSL SDK
  async verifyTransaction(signature, message) {
    try {
      const verification = await fslAuthService.verifyTransaction(signature, message);
      return verification;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw error;
    }
  }

  // Get transaction history using FSL SDK
  async getTransactionHistory() {
    try {
      const history = await fslAuthService.getTransactionHistory();
      return history;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  // Sign message using FSL SDK
  async signMessage(message) {
    try {
      const signature = await fslAuthService.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  // Get current user from FSL SDK
  getCurrentUser() {
    return fslAuthService.getCurrentUser();
  }

  // Set user from GamingHub data
  setUserFromGamingHub(userData) {
    fslAuthService.setUserFromGamingHub(userData);
  }
}

const telegramPaymentService = new TelegramPaymentService();
export default telegramPaymentService; 