import FSLAuthorization from 'fsl-authorization';
import { Buffer } from 'buffer';

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
      appKey: 'MiniGame', // Thay bằng App Key thực của bạn
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
      await this.init();
      
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
      const fslAuth = await this.init();
      
      const result = await fslAuth.signInV2();
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
        usdc: 1000 + Math.random() * 500 // Đảm bảo ít nhất 1000 USDC
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

  // Process GMT payment using EVM contract call
  async processGMTPayment(purchaseData) {
    try {
      console.log('Processing GMT payment for:', purchaseData);
      console.log('Current user:', this.currentUser);
      
      // Kiểm tra user đã được set chưa
      if (!this.currentUser) {
        throw new Error('User not initialized. Please set user data first.');
      }

      const fslAuth = await this.init();
      
      // 1. Verify user has enough balance
      const balance = await this.getBalance();
      const requiredAmount = purchaseData.amount * 0.1; // Giả sử 1 Starlet = 0.1 GMT
      
      console.log('Balance check:', {
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

      // 2. GMT Token Contract ABI (ERC-20 transfer function)
      const gmtTokenABI = [
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
      ];

      // 3. GMT Token Contract Address (thay bằng address thực)
      const gmtTokenAddress = '0x7DdEFA1890f3d5B8c4C4C4C4C4C4C4C4C4C4C4C4';
      
      // 4. Merchant address (thay bằng merchant address thực)
      const merchantAddress = '0x1234567890123456789012345678901234567890';
      
      // 5. Convert amount to wei (GMT has 6 decimals)
      const amountInWei = (requiredAmount * Math.pow(10, 6)).toString();

      // 6. Call EVM contract using FSL SDK
      const result = await fslAuth.callEvmContract({
        contractAddress: gmtTokenAddress,
        methodName: 'transfer',
        abi: gmtTokenABI,
        chainId: 137, // Polygon mainnet (thay bằng chain ID thực)
        chain: 'polygon',
        value: '0', // No ETH value, only GMT tokens
        gasLimit: '100000',
        params: [merchantAddress, amountInWei],
        to: gmtTokenAddress,
        rpc: 'https://polygon-rpc.com', // Thay bằng RPC URL thực
        domain: 'https://gm3.joysteps.io',
        uid: this.currentUser.id,
        onlySign: false // Execute transaction, not just sign
      });

      console.log('GMT payment transaction result:', result);
      
      // 7. Return transaction result
      return {
        success: true,
        transactionHash: result.transactionHash || result.hash || 'mock_tx_hash',
        amount: requiredAmount,
        currency: 'GMT',
        timestamp: new Date().toISOString(),
        purchaseData: purchaseData
      };
    } catch (error) {
      console.error('GMT payment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process Solana payment using Solana instructions
  async processSolanaPayment(purchaseData) {
    try {
      console.log('Processing Solana payment for:', purchaseData);
      console.log('Current user:', this.currentUser);
      
      // Kiểm tra user đã được set chưa
      if (!this.currentUser) {
        throw new Error('User not initialized. Please set user data first.');
      }

      const fslAuth = await this.init();
      
      // 1. Verify user has enough SOL balance
      const balance = await this.getBalance();
      const requiredAmount = purchaseData.amount * 0.001; // Giả sử 1 Starlet = 0.001 SOL
      
      console.log('SOL Balance check:', {
        currentBalance: balance.sol,
        requiredAmount: requiredAmount,
        purchaseAmount: purchaseData.amount,
        hasEnough: balance.sol >= requiredAmount
      });
      
      if (balance.sol < requiredAmount) {
        if (this.isDevelopment) {
          console.warn('Development mode: Bypassing insufficient balance check for SOL payment');
          console.warn(`Current balance: ${balance.sol.toFixed(4)} SOL, Required: ${requiredAmount.toFixed(4)} SOL`);
        } else {
          throw new Error(`Insufficient SOL balance. Current: ${balance.sol.toFixed(4)} SOL, Required: ${requiredAmount.toFixed(4)} SOL`);
        }
      }

      // 2. Create Solana transfer instruction
      // Trong thực tế, bạn sẽ tạo instruction thực để transfer SOL
      
      // Helper function to convert number to 8-byte little-endian buffer
      const numberToBytes = (num) => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        // Convert to 64-bit integer and handle large numbers safely
        const value = Math.floor(num);
        if (value > Number.MAX_SAFE_INTEGER) {
          // For very large numbers, split into high and low 32-bit parts
          const high = Math.floor(value / Math.pow(2, 32));
          const low = value % Math.pow(2, 32);
          view.setUint32(0, low, true); // little-endian
          view.setUint32(4, high, true); // little-endian
        } else {
          // For smaller numbers, use regular 64-bit conversion
          view.setFloat64(0, value, true); // little-endian
        }
        return new Uint8Array(buffer);
      };
      
      const transferInstruction = {
        programId: '11111111111111111111111111111111', // System Program
        keys: [
          { pubkey: this.currentUser.address, isSigner: true, isWritable: true },
          { pubkey: 'MERCHANT_SOLANA_ADDRESS', isSigner: false, isWritable: true }
        ],
        data: Buffer.from([2, 0, 0, 0, ...numberToBytes(requiredAmount * Math.pow(10, 9))])
      };

      // 3. Call Solana instructions using FSL SDK
      const result = await fslAuth.callSolInstructions({
        instructions: [transferInstruction],
        rpc: 'https://api.mainnet-beta.solana.com', // Thay bằng RPC URL thực
        unitLimit: 200000,
        unitPrice: 5000,
        domain: 'https://gm3.joysteps.io',
        uid: this.currentUser.id,
        onlySign: false // Execute transaction, not just sign
      });

      console.log('Solana payment transaction result:', result);
      
      // 4. Return transaction result
      return {
        success: true,
        transactionHash: result.transactionHash || result.signature || 'mock_tx_hash',
        amount: requiredAmount,
        currency: 'SOL',
        timestamp: new Date().toISOString(),
        purchaseData: purchaseData
      };
    } catch (error) {
      console.error('Solana payment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process USDC payment using EVM contract call
  async processUSDCPayment(purchaseData) {
    try {
      console.log('Processing USDC payment for:', purchaseData);
      console.log('Current user:', this.currentUser);
      
      // Kiểm tra user đã được set chưa
      if (!this.currentUser) {
        throw new Error('User not initialized. Please set user data first.');
      }

      const fslAuth = await this.init();
      
      // 1. Verify user has enough USDC balance
      const balance = await this.getBalance();
      const requiredAmount = purchaseData.amount; // 1 Starlet = 1 USDC
      
      console.log('USDC Balance check:', {
        currentBalance: balance.usdc,
        requiredAmount: requiredAmount,
        purchaseAmount: purchaseData.amount,
        hasEnough: balance.usdc >= requiredAmount
      });
      
      if (balance.usdc < requiredAmount) {
        if (this.isDevelopment) {
          console.warn('Development mode: Bypassing insufficient balance check for USDC payment');
          console.warn(`Current balance: ${balance.usdc.toFixed(2)} USDC, Required: ${requiredAmount.toFixed(2)} USDC`);
        } else {
          throw new Error(`Insufficient USDC balance. Current: ${balance.usdc.toFixed(2)} USDC, Required: ${requiredAmount.toFixed(2)} USDC`);
        }
      }

      // 2. USDC Token Contract ABI (ERC-20 transfer function)
      const usdcTokenABI = [
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
      ];

      // 3. USDC Token Contract Address (thay bằng address thực)
      const usdcTokenAddress = '0xA0b86a33E6441b8c4C4C4C4C4C4C4C4C4C4C4C4C4';
      
      // 4. Merchant address (thay bằng merchant address thực)
      const merchantAddress = '0x1234567890123456789012345678901234567890';
      
      // 5. Convert amount to wei (USDC has 6 decimals)
      const amountInWei = (requiredAmount * Math.pow(10, 6)).toString();

      // 6. Call EVM contract using FSL SDK
      const result = await fslAuth.callEvmContract({
        contractAddress: usdcTokenAddress,
        methodName: 'transfer',
        abi: usdcTokenABI,
        chainId: 137, // Polygon mainnet (thay bằng chain ID thực)
        chain: 'polygon',
        value: '0', // No ETH value, only USDC tokens
        gasLimit: '100000',
        params: [merchantAddress, amountInWei],
        to: usdcTokenAddress,
        rpc: 'https://polygon-rpc.com', // Thay bằng RPC URL thực
        domain: 'https://gm3.joysteps.io',
        uid: this.currentUser.id,
        onlySign: false // Execute transaction, not just sign
      });

      console.log('USDC payment transaction result:', result);
      
      // 7. Return transaction result
      return {
        success: true,
        transactionHash: result.transactionHash || result.hash || 'mock_tx_hash',
        amount: requiredAmount,
        currency: 'USDC',
        timestamp: new Date().toISOString(),
        purchaseData: purchaseData
      };
    } catch (error) {
      console.error('USDC payment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process card payment (mock - không có trong FSL SDK)
  async processCardPayment(purchaseData) {
    try {
      console.log('Processing card payment for:', purchaseData);
      
      // Card payment không có trong FSL SDK, sử dụng mock
      // Trong thực tế, bạn sẽ integrate với payment gateway
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        transactionId: `card_${Date.now()}`,
        amount: purchaseData.amount,
        currency: 'USD',
        timestamp: new Date().toISOString(),
        purchaseData: purchaseData
      };
    } catch (error) {
      console.error('Card payment failed:', error);
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
        isValid: verifiedAddress.toLowerCase() === this.currentUser.address.toLowerCase()
      };
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user's wallet addresses
  async getWalletAddresses() {
    try {
      await this.init();
      
      // Trong thực tế, bạn sẽ lấy addresses từ FSL SDK
      return {
        evm: this.currentUser?.address || '0x0000000000000000000000000000000000000000',
        solana: this.currentUser?.solanaAddress || '0000000000000000000000000000000000000000000000000000000000000000'
      };
    } catch (error) {
      console.error('Get wallet addresses error:', error);
      throw error;
    }
  }
}

const fslAuthService = new FSLAuthService();
export default fslAuthService; 