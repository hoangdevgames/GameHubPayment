# **FSL Wallet Address & GMT Balance Integration Guide**

Kết hợp FSL Authorization với GMT balance checking để lấy địa chỉ ví và balance tự động.

## **🎯 Tính năng mới**

### **1. Lấy địa chỉ ví từ FSL Authorization**
```javascript
import fslAuthService from './src/services/fslAuth.js';

// Lấy địa chỉ Solana wallet hiện tại
const solanaAddress = await fslAuthService.getCurrentWalletAddress('solana');

// Lấy địa chỉ Polygon wallet hiện tại  
const polygonAddress = await fslAuthService.getCurrentWalletAddress('polygon');

// Lấy địa chỉ Ethereum wallet hiện tại
const ethereumAddress = await fslAuthService.getCurrentWalletAddress('ethereum');
```

### **2. GMT Balance với địa chỉ ví tự động**
```javascript
// Tự động lấy Solana wallet address và GMT balance
const solanaInfo = await fslAuthService.getSolanaGMTBalanceWithAddress();
console.log(solanaInfo);
// {
//   walletAddress: "ABC123...",
//   balance: 1250.5,
//   chain: "solana", 
//   currency: "GMT"
// }

// Tự động lấy Polygon wallet address và GMT balance
const polygonInfo = await fslAuthService.getPolygonGMTBalanceWithAddress();
console.log(polygonInfo);
// {
//   walletAddress: "0xabc123...",
//   balance: 850.2,
//   chain: "polygon",
//   currency: "GMT",
//   chainId: 137
// }
```

### **3. Lấy tất cả thông tin wallet một lần**
```javascript
const allWalletInfo = await fslAuthService.getAllWalletInfo();
console.log(allWalletInfo);
// {
//   user: "User Name",
//   userId: "fsl_user_id", 
//   wallets: {
//     solana: "ABC123...",
//     polygon: "0xabc123...",
//     ethereum: "0xdef456..."
//   },
//   balances: {
//     solanaGMT: 1250.5,
//     polygonGMT: 850.2
//   },
//   timestamp: "2024-01-01T12:00:00.000Z"
// }
```

## **🔧 Cách thức hoạt động**

### **Phương pháp lấy địa chỉ ví:**

1. **Từ userProfile** (ưu tiên): Lấy từ data GamingHub
   - Solana: `userProfile.solAddr`
   - EVM: `userProfile.evmAddr`

2. **Từ FSL SDK**: Message signing để recover address
   - Solana: `signSolMessage()` + address recovery  
   - EVM: `callEvmSign()` + `evmVerifyMessage()`

### **GMT Balance checking:**

- **Solana GMT**: Token mint `7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx`
- **Polygon GMT**: Contract `0x714DB550b574b3E927af3D93E26127D15721D4C2`

## **📱 Usage trong React Components**

### **Example: Wallet Info Component**
```jsx
import React, { useState, useEffect } from 'react';
import fslAuthService from '../services/fslAuth';

function WalletInfoComponent() {
  const [walletInfo, setWalletInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadWalletInfo = async () => {
    setLoading(true);
    try {
      const info = await fslAuthService.getAllWalletInfo();
      setWalletInfo(info);
    } catch (error) {
      console.error('Failed to load wallet info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fslAuthService.getCurrentUser()) {
      loadWalletInfo();
    }
  }, []);

  if (loading) return <div>Loading wallet info...</div>;
  if (!walletInfo) return <div>No wallet info available</div>;

  return (
    <div className="wallet-info">
      <h3>👤 {walletInfo.user}</h3>
      
      <div className="wallet-addresses">
        <h4>📍 Wallet Addresses:</h4>
        <p>🟡 Solana: {walletInfo.wallets.solana}</p>
        <p>🔷 Polygon: {walletInfo.wallets.polygon}</p>
        <p>🟦 Ethereum: {walletInfo.wallets.ethereum}</p>
      </div>
      
      <div className="balances">
        <h4>💰 GMT Balances:</h4>
        <p>Solana GMT: {walletInfo.balances.solanaGMT}</p>
        <p>Polygon GMT: {walletInfo.balances.polygonGMT}</p>
      </div>
    </div>
  );
}

export default WalletInfoComponent;
```

### **Example: Payment Component**
```jsx
function PaymentComponent({ purchaseData }) {
  const [selectedChain, setSelectedChain] = useState('solana');
  const [walletInfo, setWalletInfo] = useState(null);

  const loadWalletForChain = async (chain) => {
    try {
      if (chain === 'solana') {
        const info = await fslAuthService.getSolanaGMTBalanceWithAddress();
        setWalletInfo(info);
      } else if (chain === 'polygon') {
        const info = await fslAuthService.getPolygonGMTBalanceWithAddress();
        setWalletInfo(info);
      }
    } catch (error) {
      console.error(`Failed to load ${chain} wallet:`, error);
    }
  };

  const handleChainChange = (chain) => {
    setSelectedChain(chain);
    loadWalletForChain(chain);
  };

  const handlePayment = async () => {
    try {
      if (selectedChain === 'solana') {
        await fslAuthService.processGMTPayment(purchaseData);
      } else if (selectedChain === 'polygon') {
        await fslAuthService.processGGUSDPayment(purchaseData, 137);
      }
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <div className="payment-component">
      <div className="chain-selector">
        <button 
          onClick={() => handleChainChange('solana')}
          className={selectedChain === 'solana' ? 'selected' : ''}
        >
          🟡 PAY WITH SOLANA GMT
        </button>
        <button 
          onClick={() => handleChainChange('polygon')}
          className={selectedChain === 'polygon' ? 'selected' : ''}
        >
          🔷 PAY WITH POLYGON GMT
        </button>
      </div>

      {walletInfo && (
        <div className="wallet-preview">
          <p>Address: {walletInfo.walletAddress}</p>
          <p>Balance: {walletInfo.balance} GMT</p>
        </div>
      )}

      <button onClick={handlePayment} className="pay-button">
        💳 Pay Now
      </button>
    </div>
  );
}
```

## **⚡ Quick Start**

1. **Import service**:
   ```javascript
   import fslAuthService from './src/services/fslAuth.js';
   ```

2. **Ensure user is logged in**:
   ```javascript
   const user = fslAuthService.getCurrentUser();
   if (!user) {
     await fslAuthService.signIn();
   }
   ```

3. **Get wallet info**:
   ```javascript
   const walletInfo = await fslAuthService.getAllWalletInfo();
   ```

4. **Use trong payment flow**:
   ```javascript
   // Check balance trước khi payment
   const solanaInfo = await fslAuthService.getSolanaGMTBalanceWithAddress();
   if (solanaInfo.balance >= requiredAmount) {
     // Proceed with payment
     await fslAuthService.processGMTPayment(purchaseData);
   }
   ```

## **🔒 Error Handling**

```javascript
try {
  const walletInfo = await fslAuthService.getAllWalletInfo();
} catch (error) {
  if (error.message.includes('User not initialized')) {
    // Redirect to login
    await fslAuthService.signIn();
  } else if (error.message.includes('Could not retrieve')) {
    // Wallet connection issue
    console.warn('Wallet connection issue:', error.message);
  } else {
    // Other errors
    console.error('Unexpected error:', error);
  }
}
```

## **📋 Methods Summary**

| Method | Purpose | Returns |
|--------|---------|---------|
| `getCurrentWalletAddress(chain)` | Lấy địa chỉ ví cho chain | `string` |
| `getSolanaGMTBalanceWithAddress()` | Solana wallet + GMT balance | `{walletAddress, balance, chain, currency}` |
| `getPolygonGMTBalanceWithAddress()` | Polygon wallet + GMT balance | `{walletAddress, balance, chain, currency, chainId}` |
| `getAllWalletInfo()` | Tất cả wallet addresses + balances | `{user, wallets, balances, timestamp}` |
| `getSolanaGMTBalance(address)` | GMT balance cho address cụ thể | `number` |
| `getPolygonGMTBalance(address)` | GMT balance cho address cụ thể | `number` |

## **✨ Advantages**

- ✅ **Tự động lấy wallet address** từ FSL Authorization
- ✅ **Kết hợp balance checking** trong một lần gọi  
- ✅ **Support multi-chain**: Solana, Polygon, Ethereum
- ✅ **Error handling** và fallback mechanisms
- ✅ **Easy integration** với existing React components
- ✅ **Mainnet ready** với địa chỉ merchant đã cấu hình

**Status: ✅ Ready to use!**