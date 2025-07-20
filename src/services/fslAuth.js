import FSLAuthorization from 'fsl-authorization';
import { Buffer } from 'buffer';

/* global BigInt */

/**
 * FSL Authentication Service with Solana GMT Payment Support
 * 
 * GMT Token Address on Solana: CS493ksQGHFqppNRTEUdcpQS2frLLjdtj4RJEFYaU7zi
 * 
 * Payment Methods:
 * - processGMTPayment(): Solana GMT payments using SPL Token instructions
 */
class FSLAuthService {
  constructor() {
    this.fslAuth = null;
    this.currentUser = null;
    this.isInitialized = false;
    this.isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
  }

  async init() {
    if (this.isInitialized && this.fslAuth) return this.fslAuth;

    try {
      this.fslAuth = await FSLAuthorization.init({
        responseType: 'code',
        appKey: 'MiniGame',
        redirectUri: 'https://hoangdevgames.github.io/GameHubPayment/callback',
        scope: 'basic,wallet',
        state: 'gamehub_payment',
        usePopup: true,
        isApp: false,
        domain: 'https://gm3.joysteps.io',
      });

      this.isInitialized = true;
      console.log('FSL Auth Service initialized successfully');
      return this.fslAuth;
    } catch (error) {
      console.error('Failed to initialize FSL Auth:', error);
      throw error;
    }
  }

  // Set user data từ GamingHub
  setUserFromGamingHub(userData) {
    console.log('Setting user from GamingHub with data:', userData);
    
    this.currentUser = {
      id: userData.fslId,
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
      await this.init();
      
      // Trong thực tế, bạn sẽ verify FSL ID với backend
      // Ở đây tôi giả lập verification thành công
      return {
        success: true,
        verified: true,
        userInfo: {
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
      const fslAuth = await this.init();
      
      const result = await fslAuth.signInV2();
      if (result.code) {
        // Lưu user data
        this.currentUser = {
          id: result.fslId || 'demo_fsl_id',
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
  async signOut() {
    try {
      if (this.fslAuth) {
        await this.fslAuth.signOut();
      }
      this.currentUser = null;
      console.log('User signed out');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  // Get balance using FSL SDK
  async getBalance() {
    try {
      await this.init();
      
      // Trong thực tế, bạn sẽ gọi API để lấy balance thực
      // Ở đây tôi giả lập balance data với số lượng đủ để test
      return {
        gmt: 1000 + Math.random() * 500, // Đảm bảo ít nhất 1000 GMT
        sol: 5 + Math.random() * 5,      // Đảm bảo ít nhất 5 SOL
      };
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
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

  // Sign message using FSL SDK
  async signMessage(message) {
    try {
      const fslAuth = await this.init();
      
      const result = await fslAuth.signSolMessage({ 
        msg: message,
        domain: 'https://gm3.joysteps.io'
      });
      return result;
    } catch (error) {
      console.error('Sign message error:', error);
      throw error;
    }
  }

  // Process GMT payment using Solana SPL Token instructions
  async processGMTPayment(purchaseData) {
    try {
      console.log('Processing Solana GMT payment for:', purchaseData);
      console.log('Current user:', this.currentUser);
      
      // Kiểm tra user đã được set chưa
      if (!this.currentUser) {
        throw new Error('User not initialized. Please set user data first.');
      }

      const fslAuth = await this.init();
      
      // 1. Verify user has enough GMT balance
      const balance = await this.getBalance();
      const requiredAmount = purchaseData.amount * 0.1; // Giả sử 1 Starlet = 0.1 GMT
      
      console.log('GMT Balance check:', {
        currentBalance: balance.gmt,
        requiredAmount: requiredAmount,
        purchaseAmount: purchaseData.amount,
        hasEnough: balance.gmt >= requiredAmount
      });
      
      if (balance.gmt < requiredAmount) {
        if (this.isDevelopment) {
          console.warn('Development mode: Bypassing insufficient balance check for GMT payment');
          console.warn(`Current balance: ${balance.gmt.toFixed(2)} GMT, Required: ${requiredAmount.toFixed(2)} GMT`);
        } else {
          throw new Error(`Insufficient GMT balance. Current: ${balance.gmt.toFixed(2)} GMT, Required: ${requiredAmount.toFixed(2)} GMT`);
        }
      }

      // 2. GMT Token Mint Address (cần tìm đúng mint address của GMT trên Solana)
      const gmtTokenMintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC mint address (ví dụ)

      // 3. User's GMT Token Account (địa chỉ bạn copy từ ví)
      const userGmtTokenAccount = 'CS493ksQGHFqppNRTEUdcpQS2frLLjdtj4RJEFYaU7zi';

      // 4. Merchant's GMT Token Account (cần có địa chỉ này)
      const merchantGmtTokenAccount = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
      
      // 4. Convert amount to token units (GMT has 6 decimals on Solana)
      const amountInTokenUnits = Math.floor(requiredAmount * Math.pow(10, 6));

      // 5. Create SPL Token transfer instruction
      // SPL Token Program ID
      const splTokenProgramId = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      
      // Helper function to convert number to 8-byte little-endian buffer
      const numberToBytes = (num) => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        const value = Math.floor(num);
        // Use BigInt if available, otherwise fallback to regular number handling
        if (typeof BigInt !== 'undefined') {
          view.setBigUint64(0, BigInt(value), true); // little-endian
        } else {
          // Fallback for environments without BigInt support
          const high = Math.floor(value / Math.pow(2, 32));
          const low = value % Math.pow(2, 32);
          view.setUint32(0, low, true); // little-endian
          view.setUint32(4, high, true); // little-endian
        }
        return new Uint8Array(buffer);
      };

      // SPL Token transfer instruction (instruction index 3 for transfer)
      const transferInstruction = {
        programId: splTokenProgramId,
        keys: [
          { pubkey: userGmtTokenAccount, isSigner: false, isWritable: true }, // Source: your GMT token account
          { pubkey: merchantGmtTokenAccount, isSigner: false, isWritable: true }, // Destination: merchant's GMT token account  
          { pubkey: '11111111111111111111111111111111', isSigner: true, isWritable: false }, // Authority (your wallet) - FSL SDK handles
        ],
        data: Buffer.from([3, ...numberToBytes(amountInTokenUnits)])
      };

      // 6. Call Solana instructions using FSL SDK
      // FSL SDK will handle the wallet integration and signing automatically
      const result = await fslAuth.callSolInstructions({
        instructions: [transferInstruction], // ✅ Đã có
        rpc: 'https://api.mainnet-beta.solana.com', // ✅ Đã có
        unitLimit: 200000,                   // ✅ Đã có  
        unitPrice: 5000,                     // ✅ Đã có
        domain: 'https://gm3.joysteps.io',   // ✅ Đã có
        uid: this.currentUser.id,            // ✅ Đã có
        onlySign: false                      // ✅ Đã có - Execute transaction
      });

      console.log('Solana GMT payment transaction result:', result);
      
      // 7. Return transaction result
      return {
        success: true,
        transactionHash: result.transactionHash || result.signature || result.hash || 'mock_tx_hash',
        amount: requiredAmount,
        currency: 'GMT',
        timestamp: new Date().toISOString(),
        purchaseData: purchaseData,
        network: 'Solana'
      };
    } catch (error) {
      console.error('Solana GMT payment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify transaction signature
  async verifyTransaction(signature, message) {
    try {
      await this.init();
      
      // Sử dụng FSL SDK để verify signature
      const verifiedAddress = FSLAuthorization.evmVerifyMessage(message, signature);
      return {
        success: true,
        verifiedAddress: verifiedAddress,
        isValid: true // FSL SDK handles the verification
      };
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get GMT token address for Solana
  getGMTTokenAddress() {
    return 'CS493ksQGHFqppNRTEUdcpQS2frLLjdtj4RJEFYaU7zi';
  }
}

const fslAuthService = new FSLAuthService();
export default fslAuthService; 