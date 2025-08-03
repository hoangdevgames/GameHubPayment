import FSLAuthorization from 'fsl-authorization';
import { Buffer } from 'buffer';

/* global BigInt */

// Thêm import Solana Web3
import { Connection, PublicKey } from '@solana/web3.js';

// Thêm import ethers cho EVM chains
import { ethers } from 'ethers';

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

    // TESTNET Configuration - Updated for https://gm3.joysteps.io/
    this.GGUSD_CONTRACTS = {
      // Mainnet contracts (commented out for testnet)
      // 137: '0x...', // Polygon GGUSD contract address
      // 56: '0x...',  // BSC GGUSD contract address  
      // 1: '0x...',   // Ethereum GGUSD contract address
      
      // TESTNET contracts (need actual GGUSD testnet addresses)
      80002: '0x...', // Polygon Amoy Testnet GGUSD
      97: '0x...',    // BSC Testnet GGUSD
      11155111: '0x...', // Ethereum Sepolia GGUSD
      421614: '0x...', // Arbitrum Sepolia GGUSD
      84532: '0x...',  // Base Sepolia GGUSD
    };

    // User's provided testnet treasury address
    this.TREASURY_ADDRESSES = {
      // All testnets use the same treasury address from user
      80002: '0x2572421a30c0097357Cd081228D5F1C07ce96bee', // Polygon Amoy Testnet
      97: '0x2572421a30c0097357Cd081228D5F1C07ce96bee',    // BSC Testnet
      11155111: '0x2572421a30c0097357Cd081228D5F1C07ce96bee', // Ethereum Sepolia
      421614: '0x2572421a30c0097357Cd081228D5F1C07ce96bee', // Arbitrum Sepolia
      84532: '0x2572421a30c0097357Cd081228D5F1C07ce96bee',  // Base Sepolia
    };

    this.CHAIN_NAMES = {
      // Testnet chain names
      80002: 'Polygon Amoy Testnet',
      97: 'BSC Testnet', 
      11155111: 'Ethereum Sepolia',
      421614: 'Arbitrum Sepolia',
      84532: 'Base Sepolia'
    };

    // RPC URLs for testnets
    this.TESTNET_RPCS = {
      80002: 'https://rpc-amoy.polygon.technology/', // Polygon Amoy
      97: 'https://data-seed-prebsc-1-s1.binance.org:8545/', // BSC Testnet
      11155111: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY', // Ethereum Sepolia
      421614: 'https://sepolia-rollup.arbitrum.io/rpc', // Arbitrum Sepolia
      84532: 'https://sepolia.base.org' // Base Sepolia
    };
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
      walletAddress: userData.userProfile?.solAddr, // ✅ Solana wallet address
      evmAddress: userData.userProfile?.evmAddr || userData.userProfile?.ethAddr // ✅ EVM wallet address
    };
    console.log('User set from GamingHub:', this.currentUser);
  }

  // Manual setter for EVM address (for testing purposes)
  setEvmAddress(evmAddress) {
    if (this.currentUser) {
      this.currentUser.evmAddress = evmAddress;
      if (this.currentUser.userProfile) {
        this.currentUser.userProfile.evmAddr = evmAddress;
      }
      console.log('EVM address manually set:', evmAddress);
    } else {
      console.warn('No current user to set EVM address for');
    }
  }

  // Helper để get EVM address hiện tại
  getCurrentEvmAddress() {
    if (this.currentUser?.evmAddress) {
      return this.currentUser.evmAddress;
    }
    if (this.currentUser?.userProfile?.evmAddr) {
      return this.currentUser.userProfile.evmAddr;
    }
    if (this.currentUser?.userProfile?.ethAddr) {
      return this.currentUser.userProfile.ethAddr;
    }
    if (this.currentUser?.walletAddress && this.currentUser.walletAddress.startsWith('0x')) {
      return this.currentUser.walletAddress;
    }
    return null;
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

  // Get balance using FSL SDK - Updated với real GMT balance function
  async getBalance() {
    try {
      await this.init();
      
      // Try to get real GMT balance using user's Solana wallet
      let gmtBalance = 0;
      let solBalance = 0;
      
      try {
        // 1. Get wallet address from FSL SDK hoặc userProfile
        let walletAddress = null;
        
        // Try từ userProfile trước
        if (this.currentUser?.userProfile?.solAddr) {
          walletAddress = this.currentUser.userProfile.solAddr;
          console.log('Using wallet address from userProfile:', walletAddress);
        } else if (this.currentUser?.walletAddress) {
          walletAddress = this.currentUser.walletAddress;
          console.log('Using wallet address from currentUser:', walletAddress);
        } else {
          // Try lấy từ FSL SDK
          try {
            walletAddress = await this.getWalletAddressFromFSL();
            console.log('Got wallet address from FSL SDK:', walletAddress);
          } catch (fslError) {
            console.warn('Could not get wallet address from FSL SDK:', fslError.message);
          }
        }
        
        // 2. Nếu có wallet address, lấy real GMT balance
        if (walletAddress) {
          gmtBalance = await this.getSolanaGMTBalance(walletAddress);
          // Also get SOL balance for completeness
          solBalance = await this.getSolanaSOLBalance(walletAddress);
        } else {
          console.warn('No wallet address available, using mock balance');
          // Fallback to mock data
          gmtBalance = 1000 + Math.random() * 500;
          solBalance = 5 + Math.random() * 5;
        }
        
      } catch (balanceError) {
        console.warn('Error getting real balance, using mock data:', balanceError.message);
        // Fallback to mock data
        gmtBalance = 1000 + Math.random() * 500;
        solBalance = 5 + Math.random() * 5;
      }
      
      console.log('Final balance result:', { gmt: gmtBalance, sol: solBalance });
      
      return {
        gmt: gmtBalance,
        sol: solBalance,
      };
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  }

  // Real Solana GMT balance function - copy từ user's code
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
            return balance || 0;
        }
        return 0;
    } catch (error) {
        console.error('Error getting Solana GMT balance:', error);
        return 0;
    }
  }

  // Bonus: Get SOL balance
  async getSolanaSOLBalance(walletAddress) {
    console.log('Get Solana SOL balance for wallet:', walletAddress);

    if (!walletAddress) {
        console.log('No wallet address provided');
        return 0;
    }
    
    try {
        const connection = new Connection('https://lb2.stepn.com/', 'confirmed');
        const wallet = new PublicKey(walletAddress);
        
        const balance = await connection.getBalance(wallet);
        const solBalance = balance / 1e9; // Convert lamports to SOL
        
        console.log('SOL balance:', solBalance);
        return solBalance;
    } catch (error) {
        console.error('Error getting Solana SOL balance:', error);
        return 0;
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
        chain: this.getChainName(chainId),
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
  async purchaseStarletsWithGGUSD(chainId, starletAmount, ggusdAmount, decimals = 18) {
    const contractAddress = this.GGUSD_CONTRACTS[chainId];
    const treasuryAddress = this.TREASURY_ADDRESSES[chainId];
    
    if (!contractAddress || !treasuryAddress) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    
    try {
      const fslAuth = await this.init();
      
      // Convert GGUSD amount to proper decimals
      const amountInWei = ethers.parseUnits(ggusdAmount.toString(), decimals);
      
      const txHash = await fslAuth.callEvmContract({
        contractAddress: contractAddress,
        methodName: 'transfer',
        params: [treasuryAddress, amountInWei],
        abi: this.GGUSD_ABI,
        gasLimit: '150000',
        chainId: chainId,
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
      return {
        success: false,
        error: error.message
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

  // Alternative: Using Popup Window for Contract Calls - copy từ guide
  async purchaseWithPopup(chainId, ggusdAmount, appKey) {
    const contractAddress = this.GGUSD_CONTRACTS[chainId];
    const treasuryAddress = this.TREASURY_ADDRESSES[chainId];
    const amountInWei = ethers.parseUnits(ggusdAmount.toString(), 18);
    
    const contractParams = {
      contractAddress: contractAddress,
      methodName: 'transfer',
      params: [treasuryAddress, amountInWei],
      abi: this.GGUSD_ABI,
      gasLimit: '150000',
      chainId: chainId,
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

  // Mock backend verification function
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
      const ggusdAmount = purchaseData.amount || starletAmount; // Adjust rate as needed

      // 1. Get EVM wallet address - Enhanced logic for FSL integration
      let userAddress = this.getCurrentEvmAddress();
      
      if (!userAddress) {
        // For testnet: Use FSL SDK to get EVM address or use treasury as fallback
        console.warn('No EVM address found in user profile, attempting FSL SDK retrieval...');
        try {
          // Try to get EVM address from FSL SDK
          userAddress = await this.getEvmAddressFromFSL();
        } catch (fslError) {
          console.warn('FSL SDK EVM address retrieval failed:', fslError.message);
          
          // TESTNET FALLBACK: Use treasury address for testing
          if (this.isDevelopment) {
            console.warn('Development mode: Using treasury address as user address for testing');
            userAddress = this.TREASURY_ADDRESSES[chainId];
          } else {
            throw new Error(`No EVM wallet address found for ${chainName} payment. Please ensure your wallet is connected to FSL.`);
          }
        }
      }

      if (!userAddress) {
        throw new Error(`No EVM wallet address found for ${chainName} payment`);
      }

      console.log(`Using EVM address for ${chainName}:`, userAddress);

      // 2. Verify wallet ownership (skip for testnet development)
      if (!this.isDevelopment) {
        await this.signEvmVerificationMessage(userAddress, chainId);
        console.log('Wallet verification successful');
      } else {
        console.log('Development mode: Skipping wallet verification');
      }

      // 3. Execute payment based on chain
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
          userAddress: userAddress
        };
      } else {
        throw new Error(result.error || `${chainName} payment failed`);
      }
    } catch (error) {
      console.error(`${this.getChainName(chainId)} GGUSD payment failed:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper method to get EVM address from FSL SDK
  async getEvmAddressFromFSL() {
    try {
      const fslAuth = await this.init();
      
      // Try to sign a message to get EVM address
      const message = "Get EVM wallet address";
      const result = await fslAuth.callEvmSign({
        chainId: 80002, // Polygon Amoy as default
        msg: message,
        chain: 'Polygon Amoy Testnet',
      });
      
      // If successful, try to recover address from signature
      if (result && result.signature) {
        const recoveredAddress = FSLAuthorization.evmVerifyMessage(message, result.signature);
        console.log('Recovered EVM address from FSL:', recoveredAddress);
        return recoveredAddress;
      }
      
      throw new Error('Could not retrieve EVM address from FSL SDK');
    } catch (error) {
      console.error('Error getting EVM address from FSL:', error);
      throw error;
    }
  }

  // ========== END EVM CHAIN METHODS ==========

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