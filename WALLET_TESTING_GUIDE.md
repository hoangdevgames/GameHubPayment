# **🔍 FSL SDK Wallet & Balance Testing Guide**

## **🎯 What We're Testing**

1. **Wallet Address Retrieval**: Xem FSL SDK có trả về Solana & EVM wallet addresses không
2. **Real GMT Balance**: Sử dụng user's GMT balance function để lấy real balance
3. **Integration**: Check xem wallet address từ FSL SDK có work với balance function không

## **🚀 Quick Test Instructions**

### **Step 1: Setup Test Environment**
```javascript
// F12 để mở console, then:
window.setupTestEnvironment()
```

**Expected Output:**
```
✅ Test environment ready!
Available test functions:
=== WALLET & BALANCE TESTS ===
- window.testWalletAddress()        // Test FSL SDK wallet retrieval
- window.testGMTBalance()           // Test real GMT balance
- window.checkUserStatus()          // Check current user data
- window.getCurrentEvmAddress()     // Get current EVM address

=== PAYMENT TESTS ===
- window.testEvmPayment("polygon")  // Test Polygon Amoy
...

🎯 RECOMMENDED TEST SEQUENCE:
1. window.testWalletAddress()  // Check wallet retrieval
2. window.testGMTBalance()     // Check real balance
3. window.testEvmPayment("polygon") // Test payment
```

### **Step 2: Test Wallet Address Retrieval**
```javascript
window.testWalletAddress()
```

**What This Tests:**
- ✅ Solana address từ `userProfile.solAddr`
- ✅ EVM address từ `userProfile.evmAddr` hoặc `userProfile.ethAddr`
- ✅ FSL SDK direct wallet retrieval via `getWalletAddressFromFSL()`
- ✅ FSL SDK EVM address retrieval via `getEvmAddressFromFSL()`

**Expected Output (Success):**
```
🔍 Testing wallet address retrieval from FSL SDK...
Current user data: {id: "...", userProfile: {...}}
✅ Solana address from userProfile: ABC123...
✅ EVM address from userProfile: 0x123...
✅ FSL SDK wallet address: ABC123...
✅ FSL SDK EVM address: 0x123...
```

**Expected Output (If FSL SDK doesn't provide):**
```
✅ Solana address from userProfile: ABC123...
❌ No EVM address in userProfile
❌ FSL SDK wallet retrieval failed: Could not retrieve wallet address from FSL SDK
❌ FSL SDK EVM retrieval failed: Could not retrieve EVM address from FSL SDK
```

### **Step 3: Test Real GMT Balance**
```javascript
window.testGMTBalance()
```

**What This Tests:**
- ✅ Real GMT balance using user's `getSolanaGMTBalance()` function
- ✅ Real SOL balance using new `getSolanaSOLBalance()` function
- ✅ Integration với wallet address từ userProfile hoặc FSL SDK

**Expected Output (Success):**
```
💰 Testing real GMT balance retrieval...
Using wallet address from userProfile: ABC123...
Get Solana GMT balance for wallet: ABC123...
GMT accounts Solana: {value: [...]}
GMT balance Solana: 1250.5
SOL balance: 2.5
Balance result: {gmt: 1250.5, sol: 2.5}
```

**Expected Output (No Wallet):**
```
💰 Testing real GMT balance retrieval...
No wallet address available for balance check
Balance result: {gmt: 1234.56, sol: 5.67} // Mock data
```

### **Step 4: Check Complete User Status**
```javascript
window.checkUserStatus()
```

**Shows:**
- ✅ Current user object
- ✅ EVM address (real hoặc manually set)
- ✅ Solana address
- ✅ All user profile data

### **Step 5: Test EVM Payment (Should Work Now)**
```javascript
window.testEvmPayment('polygon')
```

**Expected Output:**
```
Using EVM address for Polygon Amoy Testnet: 0x2572421a30c0097357Cd081228D5F1C07ce96bee
Development mode: Skipping wallet verification
// Then will hit GGUSD contract issue (expected)
```

## **📊 Test Results Analysis**

### **Case 1: FSL SDK Provides Wallet Addresses** ✅ **BEST CASE**
```
✅ Solana address from userProfile: ABC123...
✅ EVM address from userProfile: 0x123...
✅ Real GMT balance: 1250.5
✅ Real SOL balance: 2.5
```
**Action**: All working perfectly! Real balances và addresses available.

### **Case 2: Only Solana Address Available** ⚠️ **PARTIAL**
```
✅ Solana address from userProfile: ABC123...
❌ No EVM address in userProfile
✅ Real GMT balance: 1250.5
```
**Action**: GMT payments work, EVM payments use fallback address (development mode).

### **Case 3: No Addresses from FSL SDK** ❌ **FALLBACK MODE**
```
❌ No Solana address in userProfile
❌ No EVM address in userProfile
❌ FSL SDK retrieval failed
```
**Action**: Using mock balances và treasury address for testing.

## **🛠️ Integration Points**

### **Updated Methods in `fslAuth.js`:**

1. **`getBalance()`** - Now uses real GMT balance function:
   ```javascript
   // Try multiple sources for wallet address:
   1. userProfile.solAddr
   2. currentUser.walletAddress  
   3. FSL SDK retrieval
   4. Fallback to mock data
   ```

2. **`getSolanaGMTBalance(walletAddress)`** - User's real GMT function:
   ```javascript
   // GMT mint: 7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx
   // RPC: https://lb2.stepn.com/
   // Returns real GMT balance or 0
   ```

3. **`getSolanaSOLBalance(walletAddress)`** - Bonus SOL balance:
   ```javascript
   // Returns real SOL balance in decimal form
   ```

## **🎯 Key Questions to Answer**

### **Q1: Does FSL SDK provide wallet addresses in userProfile?**
**Test**: `window.testWalletAddress()`
**Look for**: `userProfile.solAddr` và `userProfile.evmAddr`

### **Q2: Can FSL SDK retrieve wallet addresses via SDK calls?**
**Test**: `window.testWalletAddress()`
**Look for**: `✅ FSL SDK wallet address` hoặc `✅ FSL SDK EVM address`

### **Q3: Do real GMT balances work with available addresses?**
**Test**: `window.testGMTBalance()`
**Look for**: Real GMT numbers thay vì mock data

### **Q4: Are EVM payments working with enhanced address logic?**
**Test**: `window.testEvmPayment('polygon')`
**Look for**: `Using EVM address for Polygon Amoy Testnet: 0x...`

## **📝 Report Results**

Please test và report back với console output cho:

1. **`window.testWalletAddress()`** - Are wallet addresses available?
2. **`window.testGMTBalance()`** - Are real balances working?
3. **Current user data** - What's in `userProfile`?

**This will tell us exactly how FSL SDK provides wallet data và if the integration is working! 🚀**