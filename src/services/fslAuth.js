import FSLAuthorization from 'fsl-authorization';
import { Buffer } from 'buffer';

class FSLAuthService {
  constructor() {
    this.fslAuth = null;
    this.currentUser = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    this.fslAuth = FSLAuthorization.init({
      responseType: 'code',
      appKey: 'MiniGame', // Thay bằng App Key thực của bạn
      redirectUri: 'https://hoangdevgames.github.io/GameHubPayment/callback',
      scope: 'basic,wallet',
      state: 'gamehub_payment',
      usePopup: true,
      isApp: true,
      domain: 'https://gm3.joysteps.io/'
    });

    this.isInitialized = true;
    console.log('FSL Auth Service initialized');
  }

  // Set user data từ GamingHub
  setUserFromGamingHub(userData) {
    this.currentUser = {
      id: userData.fslId,
      address: userData.address || '0x' + Math.random().toString(36).substr(2, 40),
      name: userData.telegramFirstName || userData.name || 'FSL User',
      isConnected: true,
      platform: userData.platform,
      telegramUID: userData.telegramUID,
      telegramUsername: userData.telegramUsername,
      userProfile: userData.userProfile
    };
    console.log('User set from GamingHub:', this.currentUser);
  }

  // Verify FSL ID (đã có từ GamingHub)
  async verifyFSLID(fslId) {
    try {
      this.init();
      
      // Trong thực tế, bạn sẽ verify FSL ID với backend
      // Ở đây tôi giả lập verification thành công
      return {
        success: true,
        verified: true,
        userInfo: {
          address: '0x' + Math.random().toString(36).substr(2, 40),
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

  // Sign in với FSL
  async signIn() {
    try {
      this.init();
      
      const result = await this.fslAuth.signInV2();
      if (result.code) {
        // Lưu user data
        this.currentUser = {
          id: result.fslId || 'demo_fsl_id',
          address: result.address || '0x' + Math.random().toString(36).substr(2, 40),
          name: result.name || 'FSL User',
          isConnected: true
        };
        
        return this.currentUser;
      }
      throw new Error('Sign in failed');
    } catch (error) {
      console.error('FSL Sign in error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Sign out
  signOut() {
    this.currentUser = null;
    console.log('User signed out');
  }

  // Get balance (mock data)
  async getBalance() {
    return {
      gmt: Math.random() * 1000,
      sol: Math.random() * 10,
      usdc: Math.random() * 500
    };
  }

  // Get transaction history (mock data)
  async getTransactionHistory() {
    return [
      {
        id: 1,
        type: 'payment',
        amount: 100,
        currency: 'GMT',
        status: 'completed',
        timestamp: new Date().toISOString()
      }
    ];
  }

  // Sign message
  async signMessage(message) {
    try {
      this.init();
      
      const result = await this.fslAuth.signSolMessage({ msg: message });
      return result;
    } catch (error) {
      console.error('Sign message error:', error);
      throw error;
    }
  }

  // Call Solana contract (GMT payment) - Dùng URL-based approach
  async callSolanaContract(contractParams) {
    try {
      this.init();
      
      // Kiểm tra user đã được set chưa
      if (!this.currentUser) {
        throw new Error('User not initialized. Please set user data first.');
      }
      
      console.log('Calling Solana contract with user:', this.currentUser);
      
      // Dùng URL-based approach theo documentation
      const args = {
        contractAddress: '0x7DdEFA1890f3d5B8c4C4C4C4C4C4C4C4C4C4C4C4', // GMT token contract
        methodName: 'transfer',
        params: [
          'MERCHANT_ADDRESS', // Thay bằng merchant address thực
          contractParams.amount * Math.pow(10, 6) // Convert to wei
        ],
        abi: [
          {
            constant: false,
            inputs: [
              { name: '_to', type: 'address' },
              { name: '_value', type: 'uint256' },
            ],
            name: 'transfer',
            outputs: [{ name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        gasLimit: '100000',
        to: 'MERCHANT_ADDRESS',
        chainId: 137, // Polygon mainnet
      };

      const url = `https://id.fsl.com/authorization/call-data?arguments=${JSON.stringify({
        ...args,
        appKey: 'MiniGame', // Thay bằng App Key thực
      })}`;

      console.log('Opening FSL authorization URL:', url);

      // Mở popup để user authorize
      const popup = window.open(
        url,
        'fslAuthWindow',
        `left=${window.screen.width / 2 - 200},top=${
          window.screen.height / 2 - 500
        },width=500,height=800,popup=1`
      );

      // Listen for result
      return new Promise((resolve, reject) => {
        const handleMessage = (e) => {
          if (e.data.type === 'fsl_auth') {
            console.log('FSL Auth result:', e.data.data);
            window.removeEventListener('message', handleMessage);
            
            if (e.data.data.success) {
              resolve({
                hash: e.data.data.transactionHash || 'mock_tx_hash',
                success: true
              });
            } else {
              reject(new Error(e.data.data.error || 'Payment failed'));
            }
          }
        };
        
        window.addEventListener('message', handleMessage, false);
        
        // Timeout after 5 minutes
        setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          reject(new Error('Payment timeout'));
        }, 300000);
      });

    } catch (error) {
      console.error('Solana contract call error:', error);
      throw error;
    }
  }

  // Process GMT payment
  async processGMTPayment(purchaseData) {
    try {
      console.log('Processing GMT payment for:', purchaseData);
      console.log('Current user:', this.currentUser);
      
      // Kiểm tra user đã được set chưa
      if (!this.currentUser) {
        throw new Error('User not initialized. Please set user data first.');
      }
      
      // 1. Verify user has enough balance
      const balance = await this.getBalance();
      const requiredAmount = purchaseData.amount * 0.1; // Giả sử 1 Starlet = 0.1 GMT
      
      if (balance.gmt < requiredAmount) {
        throw new Error('Insufficient GMT balance');
      }

      // 2. Create payment transaction
      const paymentParams = {
        amount: requiredAmount,
        recipient: 'MERCHANT_ADDRESS', // Thay bằng merchant address thực
        token: 'GMT',
        purchaseId: `purchase_${Date.now()}`,
        ...purchaseData
      };

      // 3. Execute payment
      const result = await this.callSolanaContract(paymentParams);
      
      // 4. Return transaction result
      return {
        success: true,
        transactionHash: result.hash || 'mock_tx_hash',
        amount: requiredAmount,
        currency: 'GMT',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('GMT payment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process card payment (mock)
  async processCardPayment(purchaseData) {
    try {
      console.log('Processing card payment for:', purchaseData);
      
      // Simulate card payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        transactionId: `card_${Date.now()}`,
        amount: purchaseData.amount,
        currency: 'USD',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Card payment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const fslAuthService = new FSLAuthService();
export default fslAuthService; 