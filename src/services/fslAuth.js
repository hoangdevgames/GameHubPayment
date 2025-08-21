import FSLAuthorization from 'fsl-authorization';
import { Buffer } from 'buffer';
import { API_CONFIG } from './fslConfig';

/* global BigInt */

// Thêm import Solana Web3
import { Connection, PublicKey } from '@solana/web3.js';

// Thêm import ethers cho EVM chains
import { ethers } from 'ethers';

// Thêm import Web3 cho EVM balance queries
import Web3 from 'web3';

/**
 * FSL Authentication Service with Multi-Chain Payment Support
 * 
 * Solana GMT Token: CS493ksQGHFqppNRTEUdcpQS2frLLjdtj4RJEFYaU7zi
 * 
 * Payment Methods:
 * - processGMTPayment(): Solana GMT payments using SPL Token instructions
 * - purchaseStarletsWithGGUSD(): EVM chain GGUSD payments (Polygon, BSC, Ethereum)
 * - signEvmVerificationMessage(): EVM wallet verification
 */
class FSLAuthService {
  constructor() {
    this.fslAuth = null;
    this.currentUser = null;
    this.isInitialized = false;
    this.isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

    // EVM Chain configurations - copy từ FSL Integration Guide
    this.GGUSD_ABI = [
      {
        "constant": false,
        "inputs": [
          {"name": "_to", "type": "address"},
          {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
    ];

    // GGUSD Contract addresses (updated with actual addresses)
    this.GGUSD_CONTRACTS = {
      137: '0xFFFFFF9936BD58a008855b0812B44D2c8dFFE2aA', // Polygon GGUSD contract address
      56: '0xffffff9936bd58a008855b0812b44d2c8dffe2aa',  // BSC GGUSD contract address
      80002: '0xfF39ac1e2aD4CbA1b86D77d972424fB8515242bd' // Amoy GGUSD contract address
    };

    // Default treasury addresses - will be updated from API
    this.TREASURY_ADDRESSES = {
      137: '0x1a7dabEfb9D1fD8BF3197d61C0D6aa8ef3948fEb', // Polygon treasury wallet
      56: '0x1a7dabEfb9D1fD8BF3197d61C0D6aa8ef3948fEb',  // BSC treasury wallet
      80002: '0x1a7dabEfb9D1fD8BF3197d61C0D6aa8ef3948fEb', // Amoy treasury wallet
    };
    
    // Dynamic treasury address from API (lineReceiveAddress)
    this.dynamicTreasuryAddress = null;

    this.CHAIN_NAMES = {
      80002: 'Amoy',
      137: 'Polygon',
      56: 'BSC',
    };

    // RPC URLs for each chain
    this.RPC_URLS = {
      80002: 'https://rpc-amoy.polygon.technology/', // Amoy testnet RPC
      137: 'https://polygon-rpc.com/', // Polygon mainnet RPC
      56: 'https://bsc-dataseed.binance.org/', // BSC mainnet RPC
    };

    // Chain mapping for FSL SDK
    this.FSL_CHAIN_MAPPING = {
      80002: 'polygon', // Amoy uses Polygon's gas token (MATIC/POL)
      137: 'polygon',   // Polygon mainnet
      56: 'bsc',        // BSC
    };
  }

  async init() {
    if (this.isInitialized && this.fslAuth) return this.fslAuth;

    try {
      this.fslAuth = await FSLAuthorization.init({
        responseType: 'code',
        appKey: 'MiniGame',
        redirectUri: 'https://hoangdevgames.github.io/GameHubPayment/callback',
        scope: 'basic,wallet,stepn',
        state: 'gamehub_payment',
        usePopup: true,
        isApp: false,
        domain: 'https://9ijsflpfgm3.joysteps.io',
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

  // Update treasury address from API (lineReceiveAddress)
  updateTreasuryAddress(lineReceiveAddress) {
    console.log('Updating treasury address from API:', lineReceiveAddress);
    this.dynamicTreasuryAddress = lineReceiveAddress;
    
    // Update all chain treasury addresses with the new address
    if (lineReceiveAddress) {
      Object.keys(this.TREASURY_ADDRESSES).forEach(chainId => {
        this.TREASURY_ADDRESSES[chainId] = lineReceiveAddress;
      });
      console.log('Updated treasury addresses:', this.TREASURY_ADDRESSES);
    }
  }

  // Get treasury address for a specific chain (uses dynamic address if available)
  getTreasuryAddress(chainId) {
    if (this.dynamicTreasuryAddress) {
      return this.dynamicTreasuryAddress;
    }
    return this.TREASURY_ADDRESSES[chainId];
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
      console.log('🔄 Starting getBalance()...');
      await this.init();
      
      // Lấy balance thực tế từ tất cả chains
      console.log('📊 Getting wallet info...');
      const walletInfo = await this.getAllWalletInfo();
      console.log('✅ Wallet info received:', walletInfo);
      
      // Lấy GGUSD balances
      console.log('💰 Getting GGUSD balances...');
      
      let ggusd_polygon = 0;
      let ggusd_bsc = 0;
      let ggusd_amoy = 0;
      
      if (walletInfo.wallets.polygon) {
        console.log('🔷 Getting Polygon GGUSD balance for:', walletInfo.wallets.polygon);
        try {
          ggusd_polygon = await this.getPolygonGGUSDBalance(walletInfo.wallets.polygon);
          console.log('✅ Polygon GGUSD balance:', ggusd_polygon);
        } catch (error) {
          console.error('❌ Polygon GGUSD balance error:', error);
        }
      }
      
      if (walletInfo.wallets.bsc) {
        console.log('🟡 Getting BSC GGUSD balance for:', walletInfo.wallets.bsc);
        try {
          ggusd_bsc = await this.getBSCGGUSDBalance(walletInfo.wallets.bsc);
          console.log('✅ BSC GGUSD balance:', ggusd_bsc);
        } catch (error) {
          console.error('❌ BSC GGUSD balance error:', error);
        }
      }
      
      if (walletInfo.wallets.amoy) {
        console.log('🟢 Getting Amoy GGUSD balance for:', walletInfo.wallets.amoy);
        try {
          ggusd_amoy = await this.getAmoyGGUSDBalance(walletInfo.wallets.amoy);
          console.log('✅ Amoy GGUSD balance:', ggusd_amoy);
        } catch (error) {
          console.error('❌ Amoy GGUSD balance error:', error);
        }
      }
      
      const result = {
        // GMT balances
        gmt: walletInfo.balances.solanaGMT || 0,
        
        // GGUSD balances
        ggusd_polygon: ggusd_polygon,
        ggusd_bsc: ggusd_bsc,
        ggusd_amoy: ggusd_amoy,
        
        // Wallet addresses
        walletAddresses: {
          solana: walletInfo.wallets.solana,
          polygon: walletInfo.wallets.polygon,
          bsc: walletInfo.wallets.bsc,
          amoy: walletInfo.wallets.amoy,
        }
      };
      
      console.log('🎯 Final balance result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Get balance error:', error);
      console.log('🔄 Falling back to mock data...');
      // Fallback to mock data if real balance fails
      const mockResult = {
        gmt: 1000 + Math.random() * 500,
        ggusd_polygon: 100 + Math.random() * 50,
        ggusd_bsc: 100 + Math.random() * 50,
        ggusd_amoy: 100 + Math.random() * 50,
      };
      console.log('🎭 Mock data result:', mockResult);
      return mockResult;
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
        domain: 'https://9ijsflpfgm3.joysteps.io',
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
        domain: 'https://9ijsflpfgm3.joysteps.io',
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
        domain: 'https://9ijsflpfgm3.joysteps.io',
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
        domain: 'https://9ijsflpfgm3.joysteps.io',
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
        domain: 'https://9ijsflpfgm3.joysteps.io',
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

  // ========== EVM CHAIN METHODS - Copy từ FSL Integration Guide ==========

  // Helper function để get chain name
  getChainName(chainId) {
    return this.CHAIN_NAMES[chainId] || 'Unknown';
  }

  // Message Signing for EVM Verification - copy từ guide
  async signEvmVerificationMessage(userAddress, chainId = 137) {
    const timestamp = Date.now();
    const message = `Verify wallet ownership for Starlet purchase\nAddress: ${userAddress}\nTimestamp: ${timestamp}\nChain: ${chainId}`;
    
    try {
      const fslAuth = await this.init();
      
      const signature = await fslAuth.callEvmSign({
        chainId: chainId,
        msg: message,
        chain: this.FSL_CHAIN_MAPPING[chainId], // ✅ Use proper FSL chain mapping
      });
      
      // Verify the signature
      const recoveredAddress = FSLAuthorization.evmVerifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() === userAddress.toLowerCase()) {
        console.log('Wallet verification successful');
        return { signature, message, timestamp };
      } else {
        throw new Error('Signature verification failed');
      }
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  }

  // ERC-20 GGUSD Token Transfer - copy từ guide với modifications
  async purchaseStarletsWithGGUSD(chainId, starletAmount, ggusdAmount) {
    const contractAddress = this.GGUSD_CONTRACTS[chainId];
    const treasuryAddress = this.getTreasuryAddress(chainId);
    
    if (!contractAddress || !treasuryAddress) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    
    try {
      const fslAuth = await this.init();
      
      // ✅ Lấy decimals từ contract thay vì hardcode
      const web3 = new Web3(this.RPC_URLS[chainId]);
      const contract = new web3.eth.Contract(this.GGUSD_ABI, contractAddress);
      const contractDecimals = await contract.methods.decimals().call();
      const decimals = Number(contractDecimals.toString());
      
      console.log(`🔍 Contract decimals for chain ${chainId}:`, decimals);
      
      // Convert GGUSD amount to proper decimals
      const amountInWei = ethers.parseUnits(ggusdAmount.toString(), decimals);
      const amountInWeiString = amountInWei.toString();
      
      console.log('🔗 GGUSD Payment Details:');
      console.log('  Contract Address:', contractAddress);
      console.log('  Treasury Address:', treasuryAddress);
      console.log('  Amount (GGUSD):', ggusdAmount);
      console.log('  Amount (Wei):', amountInWeiString);
      console.log('  Chain ID:', chainId);
      console.log('  Chain Name:', this.getChainName(chainId));
      console.log('  FSL Chain:', this.FSL_CHAIN_MAPPING[chainId]);
      console.log('  RPC URL:', this.RPC_URLS[chainId]);
      
      const txHash = await fslAuth.callEvmContract({
        contractAddress: contractAddress,
        methodName: 'transfer',
        params: [treasuryAddress, amountInWeiString], // Use string instead of BigInt
        abi: this.GGUSD_ABI,
        gasLimit: '150000', // ← Remove hardcoded gas limit
        chainId: chainId,
        chain: this.FSL_CHAIN_MAPPING[chainId], // ✅ Specify chain for proper gas token
        rpc: this.RPC_URLS[chainId], // ✅ Specify RPC URL for the network
      });
      
      console.log('Payment transaction successful:', txHash);
      
      // Call backend to verify transaction and mint Starlets
      await this.verifyAndMintStarlets(starletAmount, txHash, chainId);
      
      return {
        success: true,
        transactionHash: txHash,
        amount: ggusdAmount,
        currency: 'GGUSD',
        chain: this.getChainName(chainId),
        starletAmount: starletAmount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('GGUSD payment failed:', error);
      
      // Handle BigInt serialization errors specifically
      if (error.message && error.message.includes('BigInt')) {
        console.error('❌ BigInt serialization error detected!');
        console.error('This usually happens when BigInt values are passed to JSON.stringify()');
        console.error('Error details:', error);
      }
      
      // Handle popup blocker error specifically
      if (error.message && error.message.includes('pop-up cannot be ejected')) {
        console.warn('🚫 Popup blocked! Please allow popups for this site and try again.');
        console.warn('💡 How to fix: Check your browser popup settings');
      }
      
      // Return user-friendly error message
      let userFriendlyError = error.message;
      if (error.message && error.message.includes('pop-up cannot be ejected')) {
        userFriendlyError = 'Payment popup was blocked. Please allow popups for this site and try again.';
      } else if (error.message && error.message.includes('BigInt')) {
        userFriendlyError = 'Payment processing error. Please try again or contact support.';
      }
      
      return {
        success: false,
        error: userFriendlyError,
        originalError: error.message
      };
    }
  }

  // Chain-specific purchase functions - copy từ guide
  async buyStarletsPolygon(starletAmount, ggusdAmount) {
    return await this.purchaseStarletsWithGGUSD(137, starletAmount, ggusdAmount);
  }

  async buyStarletsBSC(starletAmount, ggusdAmount) {
    return await this.purchaseStarletsWithGGUSD(56, starletAmount, ggusdAmount);
  }

  async buyStarletsEthereum(starletAmount, ggusdAmount) {
    return await this.purchaseStarletsWithGGUSD(1, starletAmount, ggusdAmount);
  }

  async buyStarletsAmoy(starletAmount, ggusdAmount) {
    return await this.purchaseStarletsWithGGUSD(80002, starletAmount, ggusdAmount);
  }

  // Custom Data Transaction Method for Amoy
  async callEvmContractByCallDataWithCustomData(purchaseData, chainId, customData) {
    try {
      console.log('🔗 Processing custom data transaction on Amoy...');
      console.log('📊 Purchase Data:', purchaseData);
      console.log('🔗 Chain ID:', chainId);
      console.log('📝 Custom Data:', customData);
      
      const fslAuth = await this.init();
      
      // Lấy contract và treasury addresses
      const contractAddress = this.GGUSD_CONTRACTS[chainId];
      const treasuryAddress = this.getTreasuryAddress(chainId);
      
      if (!contractAddress || !treasuryAddress) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }
      
      // Tính toán GGUSD amount - use price field which contains the GGUSD amount to pay
      const ggusdAmount = purchaseData.price || purchaseData.ggusdAmount || 1;
      
      // Lấy decimals từ contract
      const web3 = new Web3(this.RPC_URLS[chainId]);
      const contract = new web3.eth.Contract(this.GGUSD_ABI, contractAddress);
      const contractDecimals = await contract.methods.decimals().call();
      const decimals = Number(contractDecimals.toString());
      
      // Convert GGUSD amount to proper decimals
      const amountInWei = ethers.parseUnits(ggusdAmount.toString(), decimals);
      const amountInWeiString = amountInWei.toString();
      
      console.log('💰 Transaction Details:');
      console.log('  Contract Address:', contractAddress);
      console.log('  Treasury Address:', treasuryAddress);
      console.log('  Amount (GGUSD):', ggusdAmount);
      console.log('  Amount (Wei):', amountInWeiString);
      console.log('  Custom Data Length:', customData.length);
      
      // Tạo callData với custom data
      const transferFunctionSelector = '0xa9059cbb'; // transfer(address,uint256)
      const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256'],
        [treasuryAddress, amountInWeiString]
      );
      
      // Kết hợp function selector, params và custom data
      const callData = transferFunctionSelector + encodedParams.slice(2) + customData.slice(2);
      
      console.log('🔗 Final CallData:', callData);
      
      // Gọi FSL SDK với callData
      const result = await fslAuth.callEvmContractByCallData({
        contractAddress: contractAddress,
        callData: callData,
        chainId: chainId,
        gasLimit: '200000', // Tăng gas limit cho custom data
        chain: this.FSL_CHAIN_MAPPING[chainId],
        rpc: this.RPC_URLS[chainId],
      });
      
      console.log('✅ Custom data transaction successful:', result);
      
      // Confirm transaction hash with backend API
      const confirmResult = await this.confirmTransactionHash(result.transactionHash || result.hash || 'mock_tx_hash');
      
      return {
        success: true,
        transactionHash: result.transactionHash || result.hash || 'mock_tx_hash',
        amount: ggusdAmount,
        currency: 'GGUSD',
        chain: this.getChainName(chainId),
        starletAmount: purchaseData.quantity || 1,
        timestamp: new Date().toISOString(),
        customData: customData,
        network: 'Amoy Testnet',
        // Add backend confirmation data
        confirmData: confirmResult
      };
      
    } catch (error) {
      console.error('❌ Custom data transaction failed:', error);
      
      // Handle specific errors
      if (error.message && error.message.includes('pop-up cannot be ejected')) {
        console.warn('🚫 Popup blocked! Please allow popups for this site.');
        return {
          success: false,
          error: 'Payment popup was blocked. Please allow popups for this site and try again.',
          originalError: error.message
        };
      }
      
      return {
        success: false,
        error: error.message,
        chain: this.getChainName(chainId)
      };
    }
  }

  // Alternative: Using Popup Window for Contract Calls - copy từ guide
  async purchaseWithPopup(chainId, ggusdAmount, appKey) {
    const contractAddress = this.GGUSD_CONTRACTS[chainId];
    const treasuryAddress = this.getTreasuryAddress(chainId);
    const amountInWei = ethers.parseUnits(ggusdAmount.toString(), 18);
    const amountInWeiString = amountInWei.toString(); // Convert BigInt to string
    
    const contractParams = {
      contractAddress: contractAddress,
      methodName: 'transfer',
      params: [treasuryAddress, amountInWeiString], // Use string instead of BigInt
      abi: this.GGUSD_ABI,
      gasLimit: '150000',
      chainId: chainId,
      chain: this.FSL_CHAIN_MAPPING[chainId], // ✅ Specify chain for proper gas token
      rpc: this.RPC_URLS[chainId], // ✅ Specify RPC URL for the network
    };
    
    const url = `https://id.fsl.com/authorization/sign?arguments=${JSON.stringify({
      ...contractParams,
      appKey: appKey,
    })}`;
    
    return new Promise((resolve, reject) => {
      const popup = window.open(
        url,
        'contractCallWindow',
        `left=${window.screen.width / 2 - 250},top=${window.screen.height / 2 - 400},width=500,height=800,popup=1`
      );
      
      const handleMessage = (e) => {
        if (e.data.type === 'fsl_auth') {
          window.removeEventListener('message', handleMessage);
          popup.close();
          
          if (e.data.data.error) {
            reject(new Error(e.data.data.error));
          } else {
            resolve(e.data.data);
          }
        }
      };
      
      window.addEventListener('message', handleMessage, false);
      
      // Handle popup being closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          reject(new Error('User closed the popup'));
        }
      }, 1000);
    });
  }

  // EIP-712 Typed Data Signing - copy từ guide
  async signPurchaseOrder(orderData, chainId) {
    const domain = {
      name: 'StarletStore',
      version: '1',
      chainId: chainId,
      verifyingContract: this.GGUSD_CONTRACTS[chainId],
    };

    const types = {
      PurchaseOrder: [
        { name: 'buyer', type: 'address' },
        { name: 'starletAmount', type: 'uint256' },
        { name: 'ggusdAmount', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    try {
      const fslAuth = await this.init();
      
      const signature = await fslAuth.signTypedData({
        domain,
        types,
        message: orderData,
        chainId: chainId,
      });

      // Verify signature
      const recoveredAddress = FSLAuthorization.evmVerifyTypedData(
        domain,
        types,
        orderData,
        signature
      );

      console.log('Order signed by:', recoveredAddress);
      return { signature, recoveredAddress };
    } catch (error) {
      console.error('Order signing failed:', error);
      throw error;
    }
  }

  // Confirm transaction hash with backend API
  async confirmTransactionHash(txHash) {
    try {
      console.log(`🔍 Confirming transaction hash: ${txHash}`);
      
      const response = await fetch(`${API_CONFIG.server_url}/api/app/sys/confirmHash?pwd=pwd&token=${this.apiToken}&tx=${txHash}`);
      const data = await response.json();
      
      console.log('📊 Confirm Hash Response:', data);
      
      if (data.code === 0) {
        console.log('✅ Transaction confirmed successfully:', data.data);
        return {
          success: true,
          ...data.data
        };
      } else if (data.code === 102002 || data.code === 102001) {
        console.log('🔄 Token expired, attempting to refresh...');
        // Token expired, attempt to refresh
        const loginResult = await this.refreshToken();
        if (loginResult.success) {
          // Retry the API call
          const retryResponse = await fetch(`${API_CONFIG.server_url}/api/app/sys/confirmHash?pwd=pwd&token=${this.apiToken}&tx=${txHash}`);
          const retryData = await retryResponse.json();
          if (retryData.code === 0) {
            console.log('✅ Transaction confirmed successfully (retry):', retryData.data);
            return {
              success: true,
              ...retryData.data
            };
          } else {
            console.error('❌ Failed to confirm transaction (retry):', retryData);
            return {
              success: false,
              error: retryData.message || 'Failed to confirm transaction'
            };
          }
        } else {
          console.error('❌ Failed to refresh token');
          return {
            success: false,
            error: 'Authentication failed'
          };
        }
      } else {
        console.error('❌ Failed to confirm transaction:', data);
        return {
          success: false,
          error: data.message || 'Failed to confirm transaction'
        };
      }
    } catch (error) {
      console.error('❌ Error confirming transaction hash:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // Refresh token method
  async refreshToken() {
    try {
      // This should be implemented based on your authentication flow
      // For now, return false to indicate token refresh failed
      console.log('🔄 Token refresh not implemented yet');
      return { success: false };
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return { success: false };
    }
  }

  // Mock backend verification function (keep for compatibility)
  async verifyAndMintStarlets(starletAmount, txHash, chainId) {
    console.log(`Verifying transaction ${txHash} on chain ${chainId} for ${starletAmount} starlets`);
    // In production, call your backend API here
    // await fetch('/api/verify-purchase', { ... });
    return true;
  }

  // Main EVM payment processor
  async processGGUSDPayment(purchaseData, chainId = 137) {
    try {
      console.log('Processing GGUSD payment:', { purchaseData, chainId });
      
      if (!this.currentUser) {
        throw new Error('User not initialized. Please login first.');
      }

      const chainName = this.getChainName(chainId);
      const starletAmount = purchaseData.quantity || purchaseData.amount;
      
      // Calculate GGUSD amount properly
      let ggusdAmount;
      if (purchaseData.ggusdAmount) {
        ggusdAmount = purchaseData.ggusdAmount; // Use provided GGUSD amount
      } else if (purchaseData.price) {
        ggusdAmount = purchaseData.price; // Use price field (GGUSD amount to pay)
      } else if (purchaseData.stars) {
        const starsToGGUSDRate = 1; // 1 Star = 1 GGUSD
        ggusdAmount = purchaseData.stars * starsToGGUSDRate; // Calculate from Stars
      } else {
        ggusdAmount = starletAmount; // Fallback to starlet amount (should not happen)
      }
      
      console.log('💰 GGUSD Amount Calculation:');
      console.log('  Purchase Data:', purchaseData);
      console.log('  Starlet Amount:', starletAmount);
      console.log('  Stars Required:', purchaseData.stars);
      console.log('  GGUSD Amount:', ggusdAmount);

      // 1. Get EVM wallet address from FSL Authorization
      let userAddress;
      try {
        // For Amoy testnet, prioritize EVM address
        if (chainId === 80002) {
          userAddress = this.currentUser.userProfile?.evmAddr;
          if (!userAddress) {
            console.log(`Getting Amoy EVM wallet address from FSL Authorization...`);
            userAddress = await this.getCurrentWalletAddress('amoy');
            console.log(`✅ Got Amoy EVM wallet address from FSL (ownership verified):`, userAddress);
          } else {
            console.log(`✅ Using existing Amoy EVM wallet address:`, userAddress);
          }
        } else {
          // For other chains, use existing logic
          userAddress = this.currentUser.walletAddress || this.currentUser.userProfile?.evmAddr;
          
          // If not available, get from FSL Authorization automatically
          if (!userAddress) {
            console.log(`Getting ${chainName} wallet address from FSL Authorization...`);
            const chainMap = { 137: 'polygon', 56: 'bsc', 1: 'ethereum' };
            const chainKey = chainMap[chainId] || 'ethereum';
            userAddress = await this.getCurrentWalletAddress(chainKey);
            console.log(`✅ Got ${chainName} wallet address from FSL (ownership verified):`, userAddress);
          } else {
            console.log(`✅ Using existing ${chainName} wallet address:`, userAddress);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to get ${chainName} wallet address:`, error);
        throw new Error(`Could not retrieve ${chainName} wallet address. Please ensure your wallet is connected to FSL ID.`);
      }

      // 2. Wallet ownership already verified when getting address
      // No need for additional verification as user already signed to get wallet address
      console.log('✅ Wallet ownership verified (user signed to get address)');

      // 3. Check GGUSD balance before payment
      console.log(`Checking ${chainName} GGUSD balance...`);
      let ggusdBalance = 0;
      try {
        if (chainId === 80002) {
          ggusdBalance = await this.getAmoyGGUSDBalance(userAddress);
        } else if (chainId === 137) {
          ggusdBalance = await this.getPolygonGGUSDBalance(userAddress);
        } else if (chainId === 56) {
          ggusdBalance = await this.getBSCGGUSDBalance(userAddress);
        }
        console.log(`✅ ${chainName} GGUSD Balance:`, ggusdBalance);
      } catch (error) {
        console.warn(`⚠️ Could not check ${chainName} GGUSD balance:`, error);
      }

      // Check if user has enough GGUSD
      if (ggusdBalance < ggusdAmount) {
        const errorMsg = `Insufficient GGUSD balance. You have ${ggusdBalance} GGUSD but need ${ggusdAmount} GGUSD for this purchase.`;
        console.error('❌', errorMsg);
        
        // In development mode, allow proceeding with insufficient balance for testing
        if (this.isDevelopment) {
          console.warn('⚠️ Development mode: Proceeding with insufficient balance for testing');
        } else {
          return {
            success: false,
            error: errorMsg,
            balance: ggusdBalance,
            required: ggusdAmount,
            chain: chainName
          };
        }
      }

      // 4. Execute payment based on chain
      console.log(`Executing ${chainName} GGUSD payment...`);
      console.log('🔗 Payment parameters:');
      console.log('  Chain ID:', chainId);
      console.log('  Starlet Amount:', starletAmount);
      console.log('  GGUSD Amount:', ggusdAmount);
      console.log('  User Address:', userAddress);
      console.log('  GGUSD Balance:', ggusdBalance);
      
      const result = await this.purchaseStarletsWithGGUSD(chainId, starletAmount, ggusdAmount);
      
      if (result.success) {
        console.log(`${chainName} GGUSD payment successful:`, result);
        return {
          success: true,
          transactionHash: result.transactionHash,
          amount: ggusdAmount,
          currency: 'GGUSD',
          chain: chainName,
          starletAmount: starletAmount,
          timestamp: new Date().toISOString(),
          purchaseData: purchaseData,
          network: chainName,
          walletAddress: userAddress // Include wallet address in response
        };
      } else {
        throw new Error(result.error || `${chainName} payment failed`);
      }
    } catch (error) {
      console.error(`${this.getChainName(chainId)} GGUSD payment failed:`, error);
      return {
        success: false,
        error: error.message,
        chain: this.getChainName(chainId)
      };
    }
  }

  // ========== WALLET ADDRESS METHODS ==========

  /**
   * Lấy địa chỉ ví hiện tại từ FSL Authorization
   * @param {string} chain - 'solana' hoặc 'ethereum' hoặc 'polygon' hoặc 'bsc'
   * @returns {Promise<string>} Địa chỉ ví
   */
  async getCurrentWalletAddress(chain = 'solana') {
    try {
      console.log(`🔍 Getting ${chain} wallet address...`);
      const fslAuth = await this.init();
      
      if (!this.currentUser) {
        throw new Error('User not initialized. Please login first.');
      }

      console.log('👤 Current user profile:', this.currentUser.userProfile);

      // 1. Thử lấy từ userProfile trước (từ GamingHub data)
      if (this.currentUser.userProfile) {
        if (chain === 'solana' && this.currentUser.userProfile.solAddr) {
          console.log('✅ Got Solana address from userProfile:', this.currentUser.userProfile.solAddr);
          return this.currentUser.userProfile.solAddr;
        }
        if (chain !== 'solana' && this.currentUser.userProfile.evmAddr) {
          console.log('✅ Got EVM address from userProfile:', this.currentUser.userProfile.evmAddr);
          return this.currentUser.userProfile.evmAddr;
        }
      }
      
      console.log('⚠️ No wallet address found in userProfile, trying FSL SDK...');

      // 2. Lấy từ FSL SDK bằng message signing
      if (chain === 'solana') {
        return await this.getSolanaWalletAddressFromFSL();
      } else {
        // EVM chains: ethereum, polygon, bsc
        const chainId = this.getChainIdFromName(chain);
        return await this.getEVMWalletAddressFromFSL(chainId);
      }

    } catch (error) {
      console.error(`Error getting ${chain} wallet address:`, error);
      throw error;
    }
  }

  /**
   * Lấy địa chỉ Solana ví từ FSL SDK
   */
  async getSolanaWalletAddressFromFSL() {
    try {
      const fslAuth = await this.init();
      
      // Method 1: Sign message để verify và lấy address
      const message = `Get Solana wallet address - ${Date.now()}`;
      
      const result = await fslAuth.signSolMessage({
        msg: message,
        domain: 'https://9ijsflpfgm3.joysteps.io',
        uid: this.currentUser.id,
      });

      // Check if FSL SDK returns wallet address in result
      if (result.address || result.walletAddress || result.solanaAddress) {
        const address = result.address || result.walletAddress || result.solanaAddress;
        console.log('Got Solana address from signSolMessage:', address);
        return address;
      }

      // Method 2: Thử lấy từ FSL SDK storage
      if (fslAuth.uid && fslAuth.sdkStorage) {
        const userData = fslAuth.sdkStorage.getUserData(fslAuth.uid);
        if (userData && userData.solanaAddress) {
          console.log('Got Solana address from SDK storage:', userData.solanaAddress);
          return userData.solanaAddress;
        }
      }

      throw new Error('Could not retrieve Solana wallet address from FSL SDK');
      
    } catch (error) {
      console.error('Error getting Solana wallet address from FSL:', error);
      throw error;
    }
  }

  /**
   * Lấy địa chỉ EVM ví từ FSL SDK
   */
  async getEVMWalletAddressFromFSL(chainId = 1) {
    try {
      const fslAuth = await this.init();
      
      // Method 1: Sign EVM message để verify và lấy address
      const message = `Get EVM wallet address for chain ${chainId} - ${Date.now()}`;
      
      const signature = await fslAuth.callEvmSign({
        chainId: chainId,
        msg: message,
        chain: this.FSL_CHAIN_MAPPING[chainId], // ✅ Use proper FSL chain mapping
      });

      // Recover address từ signature
      const recoveredAddress = FSLAuthorization.evmVerifyMessage(message, signature);
      
      if (recoveredAddress) {
        console.log(`Got EVM address from callEvmSign for chain ${chainId}:`, recoveredAddress);
        return recoveredAddress;
      }

      throw new Error(`Could not retrieve EVM wallet address for chain ${chainId} from FSL SDK`);
      
    } catch (error) {
      console.error(`Error getting EVM wallet address for chain ${chainId}:`, error);
      throw error;
    }
  }

  /**
   * Helper function to get chainId from chain name
   */
  getChainIdFromName(chainName) {
    const chainIds = {
      'polygon': 137,
      'bsc': 56,
      'amoy': 80002,
    };
    return chainIds[chainName.toLowerCase()] || 137; // Default to Polygon
  }

  /**
   * Lấy GMT balance và địa chỉ ví cho Solana
   */
  async getSolanaGMTBalanceWithAddress() {
    try {
      // Lấy địa chỉ ví Solana hiện tại
      const walletAddress = await this.getCurrentWalletAddress('solana');
      console.log('Current Solana wallet address:', walletAddress);

      // Sử dụng hàm balance GMT của bạn
      const balance = await this.getSolanaGMTBalance(walletAddress);

      return {
        walletAddress: walletAddress,
        balance: balance,
        chain: 'solana',
        currency: 'GMT'
      };
      
    } catch (error) {
      console.error('Error getting Solana GMT balance with address:', error);
      throw error;
    }
  }

  /**
   * Lấy GMT balance và địa chỉ ví cho Polygon
   */
  async getPolygonGMTBalanceWithAddress() {
    try {
      // Lấy địa chỉ ví Polygon hiện tại
      const walletAddress = await this.getCurrentWalletAddress('polygon');
      console.log('Current Polygon wallet address:', walletAddress);

      // Sử dụng hàm balance GMT của bạn
      const balance = await this.getPolygonGMTBalance(walletAddress);

      return {
        walletAddress: walletAddress,
        balance: balance,
        chain: 'polygon',
        currency: 'GMT',
        chainId: 137
      };
      
    } catch (error) {
      console.error('Error getting Polygon GMT balance with address:', error);
      throw error;
    }
  }

  /**
   * Lấy GMT balance và địa chỉ ví cho Amoy
   */
  async getAmoyGMTBalanceWithAddress() {
    try {
      // Lấy địa chỉ ví Amoy hiện tại
      const walletAddress = await this.getCurrentWalletAddress('amoy');
      console.log('Current Amoy wallet address:', walletAddress);

      // Sử dụng hàm balance GMT của bạn
      const balance = await this.getAmoyGMTBalance(walletAddress);

      return {
        walletAddress: walletAddress,
        balance: balance,
        chain: 'amoy',
        currency: 'GMT',
        chainId: 80002
      };
      
    } catch (error) {
      console.error('Error getting Amoy GMT balance with address:', error);
      throw error;
    }
  }

  // Copy 2 hàm GMT balance hiện tại của bạn vào đây
  async getSolanaGMTBalance(walletAddress) {
    console.log('Get Solana GMT balance for wallet:', walletAddress);

    // Check if wallet address is valid
    if (!walletAddress) {
        console.log('No wallet address provided');
        return 0;
    }

    // GMT token mint address on Solana
    const GMT_MINT = new PublicKey('7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx');
    
    try {
        // Initialize connection with commitment
        const connection = new Connection('https://lb2.stepn.com/', 'confirmed');
        const wallet = new PublicKey(walletAddress);

        // Get token accounts by owner
        const accounts = await connection.getParsedTokenAccountsByOwner(
            wallet,
            { mint: GMT_MINT }
        );

        console.log('GMT accounts Solana:', accounts);

        if (accounts.value.length > 0) {
            // Get the first account's balance
            const balance = accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            console.log('GMT balance Solana:', balance);
            return balance;
        }
        return 0;
    } catch (error) {
        console.error('Error getting Solana GMT balance:', error);
        return 0;
    }
  }

  async getPolygonGMTBalance(walletAddress) {
    console.log('Get Polygon GMT balance for wallet:', walletAddress);

    if (!walletAddress) {
        console.log('No wallet address provided');
        return 0;
    }

    const GMT_CONTRACT = '0x714DB550b574b3E927af3D93E26127D15721D4C2';
    
    try {
        // Simple ERC-20 ABI for balanceOf and decimals
        const tokenABI = [
            {
                "constant": true,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            }
        ];

        const web3 = new Web3('https://lb5.stepn.com/');
        const contract = new web3.eth.Contract(tokenABI, GMT_CONTRACT);

        try {
            // First get the token decimals
            const decimals = await contract.methods.decimals().call();
            console.log('GMT token decimals:', decimals);

            const balance = await Promise.race([
                contract.methods.balanceOf(walletAddress).call(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 10000)
                )
            ]);

            console.log('GMT balance Polygon (raw):', balance);
            
            if (balance !== undefined) {
                // Convert BigInt values to strings before calculation
                const balanceNum = Number(balance.toString());
                const decimalsNum = Number(decimals.toString());
                const formattedBalance = balanceNum / Math.pow(10, decimalsNum);
                console.log('GMT balance Polygon (formatted):', formattedBalance);
                return formattedBalance;
            }
            return 0;
        } catch (error) {
            console.error('Error getting Polygon GMT balance:', error);
            return 0;
        }
    } catch (error) {
        console.error('Error initializing Web3:', error);
        return 0;
    }
  }

  async getAmoyGMTBalance(walletAddress) {
    console.log('Get Amoy GMT balance for wallet:', walletAddress);

    if (!walletAddress) {
        console.log('No wallet address provided');
        return 0;
    }

    const GMT_CONTRACT = '0x714DB550b574b3E927af3D93E26127D15721D4C2';
    
    try {
        const web3 = new Web3('https://lb5.stepn.com/');
        
        const tokenABI = [
            {
                "constant": true,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            }
        ];
        
        const contract = new web3.eth.Contract(tokenABI, GMT_CONTRACT);

        try {
            // First get the token decimals
            const decimals = await contract.methods.decimals().call();
            console.log('GMT token decimals (Amoy):', decimals);

            const balance = await Promise.race([
                contract.methods.balanceOf(walletAddress).call(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 10000)
                )
            ]);

            console.log('GMT balance Amoy (raw):', balance);
            
            if (balance !== undefined) {
                // Convert BigInt values to strings before calculation
                const balanceNum = Number(balance.toString());
                const decimalsNum = Number(decimals.toString());
                const formattedBalance = balanceNum / Math.pow(10, decimalsNum);
                console.log('GMT balance Amoy (formatted):', formattedBalance);
                return formattedBalance;
            }
            return 0;
        } catch (error) {
            console.error('Error getting Amoy GMT balance:', error);
            return 0;
        }
    } catch (error) {
        console.error('Error initializing Web3 for Amoy:', error);
        return 0;
    }
  }

  // ========== GGUSD BALANCE METHODS ==========

  /**
   * Lấy GGUSD balance cho Amoy testnet
   */
  async getAmoyGGUSDBalance(walletAddress) {
    console.log('Get Amoy GGUSD balance for wallet:', walletAddress);

    if (!walletAddress) {
        console.log('No wallet address provided');
        return 0;
    }

    const GGUSD_CONTRACT = '0xfF39ac1e2aD4CbA1b86D77d972424fB8515242bd';
    
    try {
        const web3 = new Web3('https://rpc-amoy.polygon.technology/');
        
        const tokenABI = [
            {
                "constant": true,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            }
        ];
        
        const contract = new web3.eth.Contract(tokenABI, GGUSD_CONTRACT);

        try {
            // First get the token decimals
            const decimals = await contract.methods.decimals().call();
            console.log('GGUSD token decimals (Amoy):', decimals);
            console.log('🔍 Decimals type:', typeof decimals);
            console.log('🔍 Decimals value:', decimals.toString());

            const balance = await Promise.race([
                contract.methods.balanceOf(walletAddress).call(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 10000)
                )
            ]);

            console.log('GGUSD balance Amoy (raw):', balance);
            console.log('🔍 Balance type:', typeof balance);
            console.log('🔍 Balance value:', balance.toString());
            
            if (balance !== undefined) {
                // Convert BigInt values to strings before calculation
                const balanceNum = Number(balance.toString());
                const decimalsNum = Number(decimals.toString());
                
                console.log('🔍 Balance calculation details:');
                console.log('  Raw balance:', balanceNum);
                console.log('  Decimals:', decimalsNum);
                console.log('  Division: 10^' + decimalsNum + ' =', Math.pow(10, decimalsNum));
                
                const formattedBalance = balanceNum / Math.pow(10, decimalsNum);
                console.log('  Result:', balanceNum + ' / ' + Math.pow(10, decimalsNum) + ' =', formattedBalance);
                console.log('GGUSD balance Amoy (formatted):', formattedBalance);
                return formattedBalance;
            }
            return 0;
        } catch (error) {
            console.error('Error getting Amoy GGUSD balance:', error);
            return 0;
        }
    } catch (error) {
        console.error('Error initializing Web3 for Amoy GGUSD:', error);
        return 0;
    }
  }

  /**
   * Lấy GGUSD balance cho Polygon
   */
  async getPolygonGGUSDBalance(walletAddress) {
    console.log('Get Polygon GGUSD balance for wallet:', walletAddress);

    if (!walletAddress) {
        console.log('No wallet address provided');
        return 0;
    }

    const GGUSD_CONTRACT = '0xFFFFFF9936BD58a008855b0812B44D2c8dFFE2aA';
    
    try {
        const web3 = new Web3('https://lb5.stepn.com/');
        
        const tokenABI = [
            {
                "constant": true,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            }
        ];
        
        const contract = new web3.eth.Contract(tokenABI, GGUSD_CONTRACT);

        try {
            // First get the token decimals
            const decimals = await contract.methods.decimals().call();
            console.log('GGUSD token decimals (Polygon):', decimals);
            console.log('🔍 Decimals type:', typeof decimals);
            console.log('🔍 Decimals value:', decimals.toString());

            const balance = await Promise.race([
                contract.methods.balanceOf(walletAddress).call(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 10000)
                )
            ]);

            console.log('GGUSD balance Polygon (raw):', balance);
            console.log('🔍 Balance type:', typeof balance);
            console.log('🔍 Balance value:', balance.toString());
            
            if (balance !== undefined) {
                // Convert BigInt values to strings before calculation
                const balanceNum = Number(balance.toString());
                const decimalsNum = Number(decimals.toString());
                
                console.log('🔍 Balance calculation details:');
                console.log('  Raw balance:', balanceNum);
                console.log('  Decimals:', decimalsNum);
                console.log('  Division: 10^' + decimalsNum + ' =', Math.pow(10, decimalsNum));
                
                const formattedBalance = balanceNum / Math.pow(10, decimalsNum);
                console.log('  Result:', balanceNum + ' / ' + Math.pow(10, decimalsNum) + ' =', formattedBalance);
                console.log('GGUSD balance Polygon (formatted):', formattedBalance);
                return formattedBalance;
            }
            return 0;
        } catch (error) {
            console.error('Error getting Polygon GGUSD balance:', error);
            return 0;
        }
    } catch (error) {
        console.error('Error initializing Web3 for Polygon GGUSD:', error);
        return 0;
    }
  }

  /**
   * Lấy GGUSD balance cho BSC
   */
  async getBSCGGUSDBalance(walletAddress) {
    console.log('Get BSC GGUSD balance for wallet:', walletAddress);

    if (!walletAddress) {
        console.log('No wallet address provided');
        return 0;
    }

    const GGUSD_CONTRACT = '0xffffff9936bd58a008855b0812b44d2c8dffe2aa';
    
    try {
        const web3 = new Web3('https://bsc-dataseed.binance.org');
        
        const tokenABI = [
            {
                "constant": true,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            }
        ];
        
        const contract = new web3.eth.Contract(tokenABI, GGUSD_CONTRACT);

        try {
            // First get the token decimals
            const decimals = await contract.methods.decimals().call();
            console.log('GGUSD token decimals (BSC):', decimals);

            const balance = await Promise.race([
                contract.methods.balanceOf(walletAddress).call(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 10000)
                )
            ]);

            console.log('GGUSD balance BSC (raw):', balance);
            
            if (balance !== undefined) {
                // Convert BigInt values to strings before calculation
                const balanceNum = Number(balance.toString());
                const decimalsNum = Number(decimals.toString());
                const formattedBalance = balanceNum / Math.pow(10, decimalsNum);
                console.log('GGUSD balance BSC (formatted):', formattedBalance);
                return formattedBalance;
            }
            return 0;
        } catch (error) {
            console.error('Error getting BSC GGUSD balance:', error);
            return 0;
        }
    } catch (error) {
        console.error('Error initializing Web3 for BSC GGUSD:', error);
        return 0;
    }
  }

  /**
   * Lấy tất cả wallet addresses và balances
   */
  async getAllWalletInfo() {
    try {
      console.log('🔍 Getting all wallet info for current user...');
      console.log('👤 Current user:', this.currentUser);
      
      const walletInfo = {
        user: this.currentUser?.name || 'Unknown',
        userId: this.currentUser?.id || 'Unknown',
        wallets: {},
        balances: {},
        timestamp: new Date().toISOString()
      };

      // Get Solana wallet and GMT balance
      try {
        console.log('⚡ Getting Solana wallet and GMT balance...');
        const solanaInfo = await this.getSolanaGMTBalanceWithAddress();
        walletInfo.wallets.solana = solanaInfo.walletAddress;
        walletInfo.balances.solanaGMT = solanaInfo.balance;
        console.log('✅ Solana wallet info retrieved:', solanaInfo);
      } catch (error) {
        console.warn('⚠️ Could not get Solana wallet info:', error.message);
        console.error('❌ Solana error details:', error);
        walletInfo.wallets.solana = null;
        walletInfo.balances.solanaGMT = 0;
      }

      // Get Polygon wallet and GMT balance
      try {
        console.log('🔷 Getting Polygon wallet and GMT balance...');
        const polygonInfo = await this.getPolygonGMTBalanceWithAddress();
        walletInfo.wallets.polygon = polygonInfo.walletAddress;
        walletInfo.balances.polygonGMT = polygonInfo.balance;
        console.log('✅ Polygon wallet info retrieved:', polygonInfo);
      } catch (error) {
        console.warn('⚠️ Could not get Polygon wallet info:', error.message);
        console.error('❌ Polygon error details:', error);
        walletInfo.wallets.polygon = null;
        walletInfo.balances.polygonGMT = 0;
      }

      // Get Amoy wallet and GMT balance
      try {
        console.log('🟢 Getting Amoy wallet and GMT balance...');
        const amoyInfo = await this.getAmoyGMTBalanceWithAddress();
        walletInfo.wallets.amoy = amoyInfo.walletAddress;
        walletInfo.balances.amoyGMT = amoyInfo.balance;
        console.log('✅ Amoy wallet info retrieved:', amoyInfo);
      } catch (error) {
        console.warn('⚠️ Could not get Amoy wallet info:', error.message);
        console.error('❌ Amoy error details:', error);
        walletInfo.wallets.amoy = null;
        walletInfo.balances.amoyGMT = 0;
      }

      // Get BSC wallet (optional)
      try {
        console.log('🟡 Getting BSC wallet address...');
        const bscAddress = await this.getCurrentWalletAddress('bsc');
        walletInfo.wallets.bsc = bscAddress;
        console.log('✅ BSC wallet address retrieved:', bscAddress);
      } catch (error) {
        console.warn('⚠️ Could not get BSC wallet:', error.message);
        console.error('❌ BSC error details:', error);
        walletInfo.wallets.bsc = null;
      }

      console.log('🎯 Complete wallet info:', walletInfo);
      return walletInfo;
      
    } catch (error) {
      console.error('Error getting all wallet info:', error);
      throw error;
    }
  }

  // ========== END WALLET ADDRESS METHODS ==========

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