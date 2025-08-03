# **FSL Authorization Integration Guide**

Note: This document is used only for reference purposes. 

## **Overview**

This guide provides comprehensive code snippets and task examples for integrating FSL Authorization into a web application for selling Starlets (in-game credits) with support for multiple blockchain networks.

## **Table of Contents**

1. [Initial Setup](https://claude.ai/chat/9dc57c23-4464-447b-b832-a6a9acd3f03c#initial-setup)  
2. [User Authentication](https://claude.ai/chat/9dc57c23-4464-447b-b832-a6a9acd3f03c#user-authentication)  
3. [EVM Chain Operations](https://claude.ai/chat/9dc57c23-4464-447b-b832-a6a9acd3f03c#evm-chain-operations)  
4. [Solana Chain Operations](https://claude.ai/chat/9dc57c23-4464-447b-b832-a6a9acd3f03c#solana-chain-operations)  
5. [Complete Purchase Flow](https://claude.ai/chat/9dc57c23-4464-447b-b832-a6a9acd3f03c#complete-purchase-flow)  
6. [Error Handling & Best Practices](https://claude.ai/chat/9dc57c23-4464-447b-b832-a6a9acd3f03c#error-handling--best-practices)

---

## **Initial Setup**

### **Installation**

```shell
npm install fsl-authorization ethers @solana/web3.js @solana/spl-token
```

### **Basic Configuration**

```javascript
import { FSLAuthorization } from 'fsl-authorization';

const fSLAuthorization = FSLAuthorization.init({
  responseType: 'code', // 'code' | 'token'
  appKey: 'YOUR_APP_KEY', // Get this from FSL team
  redirectUri: 'https://your-starlet-store.com/callback',
  scope: 'wallet', // Need 'wallet' scope for payments, not 'basic'
  state: 'starlet_purchase',
  usePopup: true,
  isApp: false, // Set to false for web applications
});
```

---

## **User Authentication**

### **Login with FSL ID**

```javascript
async function loginWithFSL() {
  try {
    const result = await fSLAuthorization.signInV2();
    if (result.code) {
      console.log('Login successful:', result.code);
      // Store user session or exchange code for access token
      return result;
    } else {
      throw new Error('No authorization code received');
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// Usage example
document.getElementById('loginButton').addEventListener('click', async () => {
  try {
    const loginResult = await loginWithFSL();
    // Update UI to show logged-in state
    showPurchasePage();
    // Optionally, get user wallet addresses from your backend
    await loadUserWalletAddresses(loginResult.code);
  } catch (error) {
    alert('Login failed. Please try again.');
  }
});
```

---

## **EVM Chain Operations**

### **1\. Message Signing for Verification**

```javascript
async function signEvmVerificationMessage(userAddress, chainId = 137) {
  const timestamp = Date.now();
  const message = `Verify wallet ownership for Starlet purchase\nAddress: ${userAddress}\nTimestamp: ${timestamp}\nChain: ${chainId}`;
  
  try {
    const signature = await fSLAuthorization.callEvmSign({
      chainId: chainId,
      msg: message,
      chain: getChainName(chainId), // 'Polygon', 'BSC', etc.
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

function getChainName(chainId) {
  const chainNames = {
    137: 'Polygon',
    56: 'BSC',
    1: 'Ethereum',
  };
  return chainNames[chainId] || 'Unknown';
}
```

### **2\. ERC-20 Token Transfer (GGUSD Payment)**

```javascript
import { ethers } from 'ethers';

// GGUSD Token Contract ABI (standard ERC-20 methods)
const GGUSD_ABI = [
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

// Contract addresses for different chains (replace with actual addresses)
const GGUSD_CONTRACTS = {
  137: '0x...', // Polygon GGUSD contract address
  56: '0x...',  // BSC GGUSD contract address
};

const TREASURY_ADDRESSES = {
  137: '0x...', // Your Polygon treasury wallet
  56: '0x...',  // Your BSC treasury wallet
};

async function purchaseStarletsWithGGUSD(chainId, starletAmount, ggusdAmount, decimals = 18) {
  const contractAddress = GGUSD_CONTRACTS[chainId];
  const treasuryAddress = TREASURY_ADDRESSES[chainId];
  
  if (!contractAddress || !treasuryAddress) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  
  // Convert GGUSD amount to proper decimals
  const amountInWei = ethers.utils.parseUnits(ggusdAmount.toString(), decimals);
  
  try {
    const txHash = await fSLAuthorization.callEvmContract({
      contractAddress: contractAddress,
      methodName: 'transfer',
      params: [treasuryAddress, amountInWei],
      abi: GGUSD_ABI,
      gasLimit: '150000', // String type, increased for safety
      chainId: chainId,
    });
    
    console.log('Payment transaction successful:', txHash);
    
    // Call your backend to verify transaction and mint Starlets
    await verifyAndMintStarlets(starletAmount, txHash, chainId);
    
    return txHash;
  } catch (error) {
    console.error('Payment failed:', error);
    throw error;
  }
}

// Chain-specific purchase functions
async function buyStarletsPolygon(starletAmount, ggusdAmount) {
  return await purchaseStarletsWithGGUSD(137, starletAmount, ggusdAmount);
}

async function buyStarletsBSC(starletAmount, ggusdAmount) {
  return await purchaseStarletsWithGGUSD(56, starletAmount, ggusdAmount);
}
```

### **3\. Alternative: Using Popup Window for Contract Calls**

```javascript
async function purchaseWithPopup(chainId, contractAddress, treasuryAddress, ggusdAmount, appKey) {
  const amountInWei = ethers.utils.parseUnits(ggusdAmount.toString(), 18);
  
  const contractParams = {
    contractAddress: contractAddress,
    methodName: 'transfer',
    params: [treasuryAddress, amountInWei],
    abi: GGUSD_ABI,
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
```

### **4\. EIP-712 Typed Data Signing (for order verification)**

```javascript
async function signPurchaseOrder(orderData, chainId) {
  const domain = {
    name: 'StarletStore',
    version: '1',
    chainId: chainId,
    verifyingContract: '0x...', // Your contract address
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
    const signature = await fSLAuthorization.signTypedData({
      domain,
      types,
      message: orderData,
      chainId: chainId, // Corrected parameter name
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
```

### **5\. Transaction Signing (without execution)**

```javascript
async function signTransactionOnly(contractParams) {
  try {
    const signedTx = await fSLAuthorization.signTransaction({
      contractAddress: contractParams.contractAddress,
      methodName: contractParams.methodName,
      params: contractParams.params,
      abi: contractParams.abi,
      gasLimit: contractParams.gasLimit,
      chainId: contractParams.chainId,
    });
    
    console.log('Transaction signed:', signedTx);
    return signedTx;
  } catch (error) {
    console.error('Transaction signing failed:', error);
    throw error;
  }
}
```

---

## **Solana Chain Operations**

### **1\. Solana Message Signing**

```javascript
async function signSolanaVerification(userPublicKey) {
  const timestamp = Date.now();
  const message = `Verify Solana wallet for Starlet purchase\nPublic Key: ${userPublicKey}\nTimestamp: ${timestamp}`;
  
  try {
    const signature = await fSLAuthorization.signSolMessage({ 
      msg: message 
    });
    console.log('Solana message signed:', signature);
    return { signature, message, timestamp };
  } catch (error) {
    console.error('Solana message signing failed:', error);
    throw error;
  }
}
```

### **2\. Solana SPL Token Transfer**

```javascript
import { 
  PublicKey, 
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import { 
  createTransferInstruction, 
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

// Solana contract addresses (replace with actual)
const SOLANA_GGUSD_MINT = new PublicKey('...'); // GGUSD SPL token mint
const SOLANA_TREASURY = new PublicKey('...'); // Your treasury wallet

async function purchaseStarletsWithSolanaGGUSD(starletAmount, ggusdAmount, userWalletPubkey) {
  const userWallet = new PublicKey(userWalletPubkey);
  
  try {
    // Get associated token accounts
    const userTokenAccount = await getAssociatedTokenAddress(
      SOLANA_GGUSD_MINT,
      userWallet
    );
    
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      SOLANA_GGUSD_MINT,
      SOLANA_TREASURY
    );
    
    // Create transfer instruction (assuming 6 decimals for GGUSD on Solana)
    const transferInstruction = createTransferInstruction(
      userTokenAccount,
      treasuryTokenAccount,
      userWallet,
      ggusdAmount * Math.pow(10, 6), // Adjust decimals as needed
      [],
      TOKEN_PROGRAM_ID
    );
    
    // Execute the transaction
    const txHash = await fSLAuthorization.callSolInstructions({
      instructions: [transferInstruction],
      keypairs: [],
    });
    
    console.log('Solana payment successful:', txHash);
    
    // Verify transaction and mint Starlets
    await verifyAndMintStarlets(starletAmount, txHash, 'solana');
    
    return txHash;
  } catch (error) {
    console.error('Solana payment failed:', error);
    throw error;
  }
}
```

### **3\. Sign Solana Instructions (without execution)**

```javascript
async function signSolanaInstructions(instructions) {
  try {
    const signedInstructions = await fSLAuthorization.signSolInstructions({
      instructions: instructions,
      keypairs: [],
    });
    
    console.log('Solana instructions signed:', signedInstructions);
    return signedInstructions;
  } catch (error) {
    console.error('Solana instructions signing failed:', error);
    throw error;
  }
}
```

---

## **Complete Purchase Flow**

### **Starlet Purchase Manager**

```javascript
class StarletPurchaseManager {
  constructor(appKey) {
    this.appKey = appKey;
    this.fSLAuth = FSLAuthorization.init({
      responseType: 'code',
      appKey: appKey,
      redirectUri: window.location.origin + '/callback',
      scope: 'wallet',
      state: 'starlet_purchase',
      usePopup: true,
      isApp: false,
    });
    
    this.isLoggedIn = false;
    this.userWallets = null;
    this.userInfo = null;
  }

  // Step 1: User Authentication
  async login() {
    try {
      const result = await this.fSLAuth.signInV2();
      if (result.code) {
        console.log('Login successful');
        this.isLoggedIn = true;
        
        // Get user info and wallet addresses from your backend
        await this.loadUserProfile(result.code);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      this.isLoggedIn = false;
      return false;
    }
  }

  async loadUserProfile(authCode) {
    try {
      // Call your backend API to exchange code for user info
      const response = await fetch('/api/auth/fsl-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode }),
      });
      
      const data = await response.json();
      this.userInfo = data.user;
      this.userWallets = data.wallets; // { ethereum: '0x...', solana: '...' }
      
      console.log('User profile loaded:', this.userInfo);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      throw error;
    }
  }

  // Step 2: Verify wallet ownership
  async verifyWalletOwnership(chain) {
    if (!this.isLoggedIn || !this.userWallets) {
      throw new Error('User must be logged in');
    }

    try {
      if (chain === 'solana') {
        return await signSolanaVerification(this.userWallets.solana);
      } else {
        const chainId = this.getChainId(chain);
        return await signEvmVerificationMessage(this.userWallets.ethereum, chainId);
      }
    } catch (error) {
      console.error('Wallet verification failed:', error);
      throw error;
    }
  }

  // Step 3: Execute purchase
  async purchaseStarlets(chain, starletAmount, ggusdAmount) {
    if (!this.isLoggedIn) {
      throw new Error('User must be logged in');
    }

    try {
      // Verify wallet ownership first
      await this.verifyWalletOwnership(chain);
      
      // Execute payment based on chain
      let txHash;
      switch (chain) {
        case 'polygon':
          txHash = await buyStarletsPolygon(starletAmount, ggusdAmount);
          break;
        case 'bsc':
          txHash = await buyStarletsBSC(starletAmount, ggusdAmount);
          break;
        case 'solana':
          txHash = await purchaseStarletsWithSolanaGGUSD(
            starletAmount, 
            ggusdAmount, 
            this.userWallets.solana
          );
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
    const chainIds = {
      'polygon': 137,
      'bsc': 56,
      'ethereum': 1,
    };
    return chainIds[chain];
  }

  // Step 4: Check purchase status
  async checkPurchaseStatus(txHash, chain) {
    try {
      const response = await fetch('/api/purchase/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash, chain }),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to check purchase status:', error);
      throw error;
    }
  }
}
```

### **Frontend Implementation**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Starlet Store</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .hidden { display: none; }
        .chain-button { margin: 10px; padding: 15px 25px; border: none; border-radius: 5px; cursor: pointer; }
        .polygon { background-color: #8247e5; color: white; }
        .bsc { background-color: #f3ba2f; color: black; }
        .solana { background-color: #00d4aa; color: black; }
        .status { margin: 20px 0; padding: 10px; border-radius: 5px; }
        .success { background-color: #d4edda; color: #155724; }
        .error { background-color: #f8d7da; color: #721c24; }
        .loading { background-color: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <div id="app">
        <h1>🌟 Starlet Store</h1>
        
        <!-- Login Section -->
        <div id="loginSection">
            <h2>Welcome to Starlet Store</h2>
            <p>Login with your FSL ID to purchase Starlets using GGUSD tokens.</p>
            <button id="loginBtn" class="chain-button">🔐 Login with FSL ID</button>
        </div>
        
        <!-- Purchase Section -->
        <div id="purchaseSection" class="hidden">
            <h2>Purchase Starlets</h2>
            <div id="userInfo"></div>
            
            <div style="margin: 20px 0;">
                <label>Starlets to buy: 
                    <input type="number" id="starletAmount" placeholder="100" min="1" max="10000">
                </label>
            </div>
            
            <div style="margin: 20px 0;">
                <label>GGUSD to pay: 
                    <input type="number" id="ggusdAmount" placeholder="10.00" min="0.01" step="0.01">
                </label>
            </div>
            
            <div style="margin: 20px 0;">
                <h3>Choose Payment Method:</h3>
                <button id="buyPolygon" class="chain-button polygon">
                    🔷 Pay with Polygon GGUSD
                </button>
                <button id="buyBSC" class="chain-button bsc">
                    🟡 Pay with BSC GGUSD
                </button>
                <button id="buySolana" class="chain-button solana">
                    ⭐ Pay with Solana GGUSD
                </button>
            </div>
            
            <div id="status"></div>
            
            <button id="logoutBtn" style="margin-top: 20px;">Logout</button>
        </div>
    </div>

    <script type="module">
        // Initialize the purchase manager
        const purchaseManager = new StarletPurchaseManager('YOUR_APP_KEY');
        
        // DOM elements
        const loginSection = document.getElementById('loginSection');
        const purchaseSection = document.getElementById('purchaseSection');
        const userInfo = document.getElementById('userInfo');
        const status = document.getElementById('status');
        
        // Login handler
        document.getElementById('loginBtn').addEventListener('click', async () => {
            updateStatus('Logging in...', 'loading');
            
            try {
                const success = await purchaseManager.login();
                if (success) {
                    loginSection.classList.add('hidden');
                    purchaseSection.classList.remove('hidden');
                    
                    userInfo.innerHTML = `
                        <p><strong>Welcome!</strong></p>
                        <p>Ethereum/Polygon/BSC: ${purchaseManager.userWallets?.ethereum || 'Not connected'}</p>
                        <p>Solana: ${purchaseManager.userWallets?.solana || 'Not connected'}</p>
                    `;
                    
                    updateStatus('Login successful! Choose your payment method.', 'success');
                } else {
                    updateStatus('Login failed. Please try again.', 'error');
                }
            } catch (error) {
                updateStatus(`Login error: ${error.message}`, 'error');
            }
        });

        // Purchase handlers
        document.getElementById('buyPolygon').addEventListener('click', () => handlePurchase('polygon'));
        document.getElementById('buyBSC').addEventListener('click', () => handlePurchase('bsc'));
        document.getElementById('buySolana').addEventListener('click', () => handlePurchase('solana'));

        // Logout handler
        document.getElementById('logoutBtn').addEventListener('click', () => {
            purchaseManager.isLoggedIn = false;
            purchaseManager.userWallets = null;
            purchaseManager.userInfo = null;
            
            loginSection.classList.remove('hidden');
            purchaseSection.classList.add('hidden');
            
            document.getElementById('starletAmount').value = '';
            document.getElementById('ggusdAmount').value = '';
            updateStatus('', '');
        });

        async function handlePurchase(chain) {
            const starletAmount = parseInt(document.getElementById('starletAmount').value);
            const ggusdAmount = parseFloat(document.getElementById('ggusdAmount').value);
            
            // Validation
            if (!starletAmount || starletAmount < 1) {
                updateStatus('Please enter a valid starlet amount (minimum 1)', 'error');
                return;
            }
            
            if (!ggusdAmount || ggusdAmount < 0.01) {
                updateStatus('Please enter a valid GGUSD amount (minimum 0.01)', 'error');
                return;
            }

            try {
                updateStatus(`Processing payment on ${chain.toUpperCase()}...`, 'loading');
                
                const txHash = await purchaseManager.purchaseStarlets(chain, starletAmount, ggusdAmount);
                
                updateStatus(
                    `🎉 Payment successful! Transaction: ${txHash.substring(0, 10)}... 
                     Your ${starletAmount} Starlets will be added to your account shortly.`, 
                    'success'
                );
                
                // Clear form
                document.getElementById('starletAmount').value = '';
                document.getElementById('ggusdAmount').value = '';
                
                // Check status after a delay
                setTimeout(() => checkPurchaseStatus(txHash, chain), 5000);
                
            } catch (error) {
                console.error('Purchase failed:', error);
                updateStatus(`❌ Payment failed: ${error.message}`, 'error');
            }
        }

        async function checkPurchaseStatus(txHash, chain) {
            try {
                const status = await purchaseManager.checkPurchaseStatus(txHash, chain);
                if (status.confirmed) {
                    updateStatus(
                        `✅ Purchase confirmed! ${status.starletAmount} Starlets added to your account.`, 
                        'success'
                    );
                }
            } catch (error) {
                console.error('Status check failed:', error);
            }
        }

        function updateStatus(message, type) {
            status.textContent = message;
            status.className = `status ${type}`;
        }
    </script>
</body>
</html>
```

---

## **Error Handling & Best Practices**

### **1\. Comprehensive Error Handling**

```javascript
class FSLError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = 'FSLError';
    this.code = code;
    this.details = details;
  }
}

function handleFSLError(error) {
  if (error.message.includes('User rejected')) {
    return new FSLError('Transaction was cancelled by user', 'USER_REJECTED', error);
  } else if (error.message.includes('insufficient funds')) {
    return new FSLError('Insufficient balance for transaction', 'INSUFFICIENT_FUNDS', error);
  } else if (error.message.includes('network')) {
    return new FSLError('Network error occurred', 'NETWORK_ERROR', error);
  } else {
    return new FSLError('Unknown error occurred', 'UNKNOWN_ERROR', error);
  }
}
```

### **2\. Transaction Status Monitoring**

```javascript
async function monitorTransaction(txHash, chain, maxAttempts = 10) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const status = await checkTransactionStatus(txHash, chain);
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
```

### **3\. Backend Verification (Node.js example)**

```javascript
// backend/services/blockchain-service.js
const { ethers } = require('ethers');

class BlockchainService {
  constructor() {
    this.providers = {
      polygon: new ethers.providers.JsonRpcProvider('https://polygon-rpc.com'),
      bsc: new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org'),
      // Add Solana connection here
    };
  }

  async verifyEvmTransaction(txHash, chainId, expectedAmount, expectedRecipient) {
    const provider = this.getProvider(chainId);
    
    try {
      const tx = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed or not found');
      }
      
      // Verify transaction details
      const isValid = this.validateTransaction(tx, expectedAmount, expectedRecipient);
      
      return {
        confirmed: true,
        valid: isValid,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return { confirmed: false, error: error.message };
    }
  }

  getProvider(chainId) {
    if (chainId === 137) return this.providers.polygon;
    if (chainId === 56) return this.providers.bsc;
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  validateTransaction(tx, expectedAmount, expectedRecipient) {
    // Add your validation logic here
    // Check recipient, amount, etc.
    return true;
  }
}

// Usage in your API endpoint
app.post('/api/verify-purchase', async (req, res) => {
  const { txHash, chainId, starletAmount, ggusdAmount } = req.body;
  
  try {
    const blockchainService = new BlockchainService();
    const verification = await blockchainService.verifyEvmTransaction(
      txHash, 
      chainId, 
      ggusdAmount, 
      process.env.TREASURY_ADDRESS
    );
    
    if (verification.confirmed && verification.valid) {
      // Mint Starlets in database
      await mintStarlets(req.user.id, starletAmount, txHash);
      res.json({ success: true, starletAmount });
    } else {
      res.status(400).json({ error: 'Transaction verification failed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## **Important Notes**

1. **Security**: Always verify transactions on your backend before crediting Starlets  
2. **Chain IDs**: Polygon (137), BSC (56), Ethereum (1)  
3. **Gas Estimation**: Consider implementing gas estimation for better UX  
4. **Token Decimals**: Verify GGUSD decimals on each chain (commonly 18 for EVM, 6 for Solana)  
5. **Rate Limiting**: Implement rate limiting to prevent abuse  
6. **Testing**: Always test on testnets first (Mumbai, BSC Testnet, Solana Devnet)  
7. **User Experience**: Provide clear feedback and loading states  
8. **Wallet Connection**: Users must connect their wallets through FSL ID before transactions

