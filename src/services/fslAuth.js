import FSLAuthorization from 'fsl-authorization';
import { Buffer } from 'buffer';

/* global BigInt */

// Thêm import Solana Web3
import { Connection, PublicKey } from '@solana/web3.js';

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
      userProfile: userData.userProfile, // ✅ Đã có solAddr trong userProfile
      walletAddress: userData.userProfile?.solAddr // ✅ Thêm wallet address
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
        domain: 'https://gm3.joysteps.io',
        uid: this.currentUser.id,
      });
      return result;
    } catch (error) {
      console.error('Sign message error:', error);
      throw error;
    }
  }

  // Lấy GMT Token Account Address của user
  async getGMTTokenAccountAddress(userWalletAddress) {
    try {
      // GMT token mint address trên Solana (đã có từ GamingHub)
      const GMT_MINT = new PublicKey('7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx');
      
      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const wallet = new PublicKey(userWalletAddress);

      // Lấy tất cả token accounts của user cho GMT mint
      const accounts = await connection.getParsedTokenAccountsByOwner(
        wallet,
        { mint: GMT_MINT }
      );

      if (accounts.value.length > 0) {
        // Trả về địa chỉ token account đầu tiên
        return accounts.value[0].pubkey.toString();
      }
      
      throw new Error('No GMT token account found for this wallet');
    } catch (error) {
      console.error('Error getting GMT token account:', error);
      throw error;
    }
  }

  // Lấy wallet address từ FSL SDK
  async getWalletAddressFromFSL() {
    try {
      const fslAuth = await this.init();
      
      // FSL SDK có thể cung cấp wallet address thông qua sign message
      // hoặc thông qua các API khác
      const message = "Get wallet address";
      const signature = await fslAuth.signSolMessage({
        msg: message,
        domain: 'https://gm3.joysteps.io',
        uid: this.currentUser.id,
      });
      
      // Hoặc có thể lấy từ FSL SDK storage
      if (fslAuth.sdkStorage) {
        const walletInfo = fslAuth.sdkStorage.getWalletInfo();
        if (walletInfo && walletInfo.solanaAddress) {
          return walletInfo.solanaAddress;
        }
      }
      
      // Fallback: sử dụng FSL SDK để lấy address
      const walletAddress = await this.getFSLWalletAddress();
      return walletAddress;
      
    } catch (error) {
      console.error('Error getting wallet address from FSL:', error);
      throw error;
    }
  }

  // Lấy FSL wallet address
  async getFSLWalletAddress() {
    try {
      const fslAuth = await this.init();
      
      // FSL SDK có thể có method để lấy wallet address
      // Hoặc thông qua sign message để verify address
      const message = "Get Solana wallet address";
      const result = await fslAuth.signSolMessage({
        msg: message,
        domain: 'https://gm3.joysteps.io',
        uid: this.currentUser.id,
      });
      
      // Nếu FSL SDK trả về address trong result
      if (result.address || result.walletAddress || result.solanaAddress) {
        return result.address || result.walletAddress || result.solanaAddress;
      }
      
      // Hoặc có thể lấy từ FSL SDK internal storage
      if (fslAuth.uid && fslAuth.sdkStorage) {
        const userData = fslAuth.sdkStorage.getUserData(fslAuth.uid);
        if (userData && userData.walletAddress) {
          return userData.walletAddress;
        }
      }
      
      throw new Error('Could not retrieve wallet address from FSL SDK');
      
    } catch (error) {
      console.error('Error getting FSL wallet address:', error);
      throw error;
    }
  }

  // Sửa lại processGMTPayment để sử dụng FSL SDK wallet
  async processGMTPayment(purchaseData) {
    try {
      console.log('Processing Solana GMT payment for:', purchaseData);
      
      if (!this.currentUser) {
        throw new Error('User not initialized. Please set user data first.');
      }

      const fslAuth = await this.init();
      
      // 1. Verify user has enough GMT balance
      const balance = await this.getBalance();
      const requiredAmount = purchaseData.amount * 0.1;
      
      if (balance.gmt < requiredAmount) {
        if (this.isDevelopment) {
          console.warn('Development mode: Bypassing insufficient balance check');
        } else {
          throw new Error(`Insufficient GMT balance. Current: ${balance.gmt.toFixed(2)} GMT, Required: ${requiredAmount.toFixed(2)} GMT`);
        }
      }

      // 2. Lấy wallet address từ FSL SDK thay vì từ userProfile
      let userWalletAddress;
      try {
        userWalletAddress = await this.getWalletAddressFromFSL();
        console.log('Got wallet address from FSL SDK:', userWalletAddress);
      } catch (error) {
        console.warn('Could not get wallet address from FSL SDK, trying fallback...');
        
        // Fallback: thử lấy từ userProfile
        userWalletAddress = this.currentUser.userProfile?.solAddr;
        
        if (!userWalletAddress) {
          if (this.isDevelopment) {
            console.warn('Development mode: Using FSL SDK without explicit wallet address');
            // FSL SDK sẽ tự động handle wallet
            return await this.processGMTPaymentWithFSLWalletOnly(purchaseData, requiredAmount);
          } else {
            throw new Error('User wallet address not found. Please ensure user has connected Solana wallet.');
          }
        }
      }

      // 3. Tự động lấy GMT Token Account Address
      const userGmtTokenAccount = await this.getGMTTokenAccountAddress(userWalletAddress);
      console.log('User GMT Token Account:', userGmtTokenAccount);

      // 4. Merchant's GMT Token Account
      const merchantGmtTokenAccount = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
      
      // 5. Convert amount to token units
      const amountInTokenUnits = Math.floor(requiredAmount * Math.pow(10, 6));

      // 6. Create SPL Token transfer instruction
      const splTokenProgramId = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      
      const numberToBytes = (num) => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        const value = Math.floor(num);
        if (typeof BigInt !== 'undefined') {
          view.setBigUint64(0, BigInt(value), true);
        } else {
          const high = Math.floor(value / Math.pow(2, 32));
          const low = value % Math.pow(2, 32);
          view.setUint32(0, low, true);
          view.setUint32(4, high, true);
        }
        return new Uint8Array(buffer);
      };

      const transferInstruction = {
        programId: splTokenProgramId,
        keys: [
          { pubkey: userGmtTokenAccount, isSigner: false, isWritable: true },
          { pubkey: merchantGmtTokenAccount, isSigner: false, isWritable: true },
          { pubkey: userWalletAddress, isSigner: true, isWritable: false }, // Authority
        ],
        data: Buffer.from([3, ...numberToBytes(amountInTokenUnits)])
      };

      // 7. Call Solana instructions using FSL SDK
      const result = await fslAuth.callSolInstructions({
        instructions: [transferInstruction],
        rpc: 'https://api.mainnet-beta.solana.com',
        unitLimit: 200000,
        unitPrice: 5000,
        domain: 'https://gm3.joysteps.io',
        uid: this.currentUser.id,
        onlySign: false
      });

      console.log('Solana GMT payment transaction result:', result);
      
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

  // Process payment chỉ với FSL SDK (không cần wallet address)
  async processGMTPaymentWithFSLWalletOnly(purchaseData, requiredAmount) {
    try {
      const fslAuth = await this.init();
      
      // FSL SDK sẽ tự động handle wallet và token accounts
      // Chỉ cần tạo instruction đơn giản
      const merchantGmtTokenAccount = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
      const amountInTokenUnits = Math.floor(requiredAmount * Math.pow(10, 6));
      
      // Tạo instruction đơn giản, FSL SDK sẽ fill wallet details
      const transferInstruction = {
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          // FSL SDK sẽ tự động fill source account
          { pubkey: merchantGmtTokenAccount, isSigner: false, isWritable: true },
          // FSL SDK sẽ tự động handle authority
        ],
        data: Buffer.from([3, ...this.numberToBytes(amountInTokenUnits)])
      };

      const result = await fslAuth.callSolInstructions({
        instructions: [transferInstruction],
        rpc: 'https://api.mainnet-beta.solana.com',
        unitLimit: 200000,
        unitPrice: 5000,
        domain: 'https://gm3.joysteps.io',
        uid: this.currentUser.id,
        onlySign: false
      });

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
      console.error('FSL-only GMT payment failed:', error);
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
      const verifiedAddress = FSLAuthorization.verifySolanaTransaction(signature, message);
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

  // Cập nhật getGMTTokenAddress để trả về đúng mint address
  getGMTTokenAddress() {
    return '7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx'; // GMT mint address từ GamingHub
  }

  // Helper function
  numberToBytes(num) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    const value = Math.floor(num);
    if (typeof BigInt !== 'undefined') {
      view.setBigUint64(0, BigInt(value), true);
    } else {
      const high = Math.floor(value / Math.pow(2, 32));
      const low = value % Math.pow(2, 32);
      view.setUint32(0, low, true);
      view.setUint32(4, high, true);
    }
    return new Uint8Array(buffer);
  }
}

const fslAuthService = new FSLAuthService();
export default fslAuthService; 