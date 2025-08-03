# **🧪 Testnet Setup Guide for GGUSD Payments**

Updated for testnet environment: **https://gm3.joysteps.io/**  
Treasury Address: **`0x2572421a30c0097357Cd081228D5F1C07ce96bee`**

## **🎯 Overview**

This guide helps you set up and test GGUSD token payments on multiple testnet blockchains. Based on [MetaMask testnet documentation](https://docs.metamask.io/services/how-to/get-testnet-tokens/) và [Ethereum networks guide](https://ethereum.org/en/developers/docs/networks/).

## **⚙️ Supported Testnets**

| Testnet | Chain ID | RPC URL | Faucet |
|---------|----------|---------|---------|
| **Polygon Amoy** | 80002 | https://rpc-amoy.polygon.technology/ | [Polygon Faucet](https://faucet.polygon.technology/) |
| **BSC Testnet** | 97 | https://data-seed-prebsc-1-s1.binance.org:8545/ | [BSC Faucet](https://www.bnbchain.org/en/testnet-faucet) |
| **Ethereum Sepolia** | 11155111 | https://sepolia.infura.io/v3/ | [Sepolia Faucet](https://faucet.quicknode.com/ethereum/sepolia) |
| **Arbitrum Sepolia** | 421614 | https://sepolia-rollup.arbitrum.io/rpc | [Arbitrum Faucet](https://faucet.quicknode.com/arbitrum/sepolia) |
| **Base Sepolia** | 84532 | https://sepolia.base.org | [Base Faucet](https://faucet.quicknode.com/base/sepolia) |

## **🚀 Quick Setup**

### **1. Add Testnets to MetaMask**

```javascript
// Use testnetHelper.js to get chain configs
import { getMetaMaskChainConfig } from './src/utils/testnetHelper';

// Add Polygon Amoy Testnet
const polygonConfig = getMetaMaskChainConfig(80002);
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [polygonConfig]
});
```

### **2. Get Testnet Tokens**

Visit faucets để lấy test tokens cho gas fees:

#### **Polygon Amoy:**
- 🔗 **Faucet**: https://faucet.polygon.technology/
- 💰 **Tokens**: MATIC testnet tokens

#### **BSC Testnet:**
- 🔗 **Faucet**: https://www.bnbchain.org/en/testnet-faucet
- 💰 **Tokens**: tBNB testnet tokens

#### **Ethereum Sepolia:**
- 🔗 **Faucet**: https://faucet.quicknode.com/ethereum/sepolia
- 💰 **Tokens**: Sepolia ETH

#### **Arbitrum Sepolia:**
- 🔗 **Faucet**: https://faucet.quicknode.com/arbitrum/sepolia  
- 💰 **Tokens**: Arbitrum Sepolia ETH

### **3. Deploy GGUSD Test Contracts**

**IMPORTANT**: You need to deploy GGUSD test token contracts on each testnet.

```solidity
// Simple ERC-20 GGUSD test contract
contract TestGGUSD {
    string public name = "Test GGUSD";
    string public symbol = "tGGUSD";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**18;
    
    mapping(address => uint256) public balanceOf;
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount);
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }
}
```

### **4. Update Contract Addresses**

Update `src/services/fslAuth.js` với deployed contract addresses:

```javascript
this.GGUSD_CONTRACTS = {
  80002: '0xYOUR_POLYGON_GGUSD_CONTRACT',     // Polygon Amoy
  97: '0xYOUR_BSC_GGUSD_CONTRACT',           // BSC Testnet  
  11155111: '0xYOUR_SEPOLIA_GGUSD_CONTRACT', // Ethereum Sepolia
  421614: '0xYOUR_ARBITRUM_GGUSD_CONTRACT',  // Arbitrum Sepolia
  84532: '0xYOUR_BASE_GGUSD_CONTRACT',       // Base Sepolia
};
```

## **🔧 Testing Payment Flow**

### **1. Test Wallet Connection**

```javascript
import testnetHelper from './src/utils/testnetHelper';

// Validate treasury address
const isValidTreasury = testnetHelper.validateTreasuryAddress(
  '0x2572421a30c0097357Cd081228D5F1C07ce96bee'
);
console.log('Treasury valid:', isValidTreasury);
```

### **2. Test GGUSD Payment**

```javascript
import fslAuthService from './src/services/fslAuth';

// Test Polygon Amoy payment
const result = await fslAuthService.processGGUSDPayment(
  {
    amount: 10,        // 10 Starlets
    quantity: 10,
    productName: 'Test Starlets'
  },
  80002                // Polygon Amoy chain ID
);

console.log('Payment result:', result);
```

### **3. Monitor Transaction**

```javascript
import { getExplorerUrl } from './src/utils/testnetHelper';

const explorerUrl = getExplorerUrl(80002, 'YOUR_TX_HASH');
console.log('View transaction:', explorerUrl);
// Output: https://amoy.polygonscan.com/tx/YOUR_TX_HASH
```

## **📋 Pre-launch Checklist**

- [ ] ✅ **Treasury Address Set**: `0x2572421a30c0097357Cd081228D5F1C07ce96bee`
- [ ] ⚠️ **GGUSD Contracts Deployed** on all testnets
- [ ] ✅ **Testnet Configurations** updated in code
- [ ] ✅ **Payment UI** shows testnet names
- [ ] ✅ **Faucet Links** available for users
- [ ] ⚠️ **Test Transactions** completed successfully

## **🎮 UI Changes Made**

### **Payment Buttons Updated:**

- 🔷 **"PAY WITH POLYGON AMOY TESTNET-GGUSD"**
- 🟡 **"PAY WITH BSC TESTNET-GGUSD"** 
- 🟦 **"PAY WITH ETHEREUM SEPOLIA-GGUSD"**
- 🔹 **"PAY WITH ARBITRUM SEPOLIA-GGUSD"** (NEW)

### **Chain IDs Updated:**

```javascript
// Old Mainnet IDs → New Testnet IDs
137 → 80002    // Polygon Mainnet → Polygon Amoy
56 → 97        // BSC Mainnet → BSC Testnet  
1 → 11155111   // Ethereum → Sepolia
// + 421614    // Arbitrum Sepolia (NEW)
```

## **🔗 Useful Resources**

- **MetaMask Testnet Guide**: https://docs.metamask.io/services/how-to/get-testnet-tokens/
- **Ethereum Networks**: https://ethereum.org/en/developers/docs/networks/
- **Polygon Docs**: https://docs.polygon.technology/
- **BSC Testnet**: https://docs.bnbchain.org/docs/binance-testnet
- **Arbitrum Docs**: https://docs.arbitrum.io/

## **🚨 Important Notes**

1. **Treasury Address**: All testnet payments go to `0x2572421a30c0097357Cd081228D5F1C07ce96bee`

2. **GGUSD Contracts**: You MUST deploy test GGUSD contracts on each testnet before testing

3. **Faucet Tokens**: Get testnet native tokens (MATIC, tBNB, ETH) for gas fees

4. **GameHub Integration**: Configured for https://gm3.joysteps.io/

5. **Development Mode**: Current implementation is in testnet/development mode

## **💡 Next Steps**

1. **Deploy GGUSD contracts** on all testnets
2. **Update contract addresses** in code  
3. **Test payment flow** on each chain
4. **Verify transactions** on block explorers
5. **Test with real FSL ID** integration

## **🆘 Troubleshooting**

### **Problem**: "Unsupported chain ID" error
**Solution**: Check if chain ID matches testnet configuration

### **Problem**: "Insufficient funds" error  
**Solution**: Get testnet tokens from faucets

### **Problem**: "Contract not found" error
**Solution**: Deploy GGUSD test contract và update address

### **Problem**: Transaction fails
**Solution**: Check gas fees và contract permissions

**Ready for testnet deployment! 🚀**