# Troubleshooting Guide - Solana GMT Payment Integration

## Issue: "Non-base58 character" Error

### Problem Description
When clicking confirm on the FSL authorization page, you encounter:
```
Error: Non-base58 character
    at Object.ye [as decode] (index-C0PMOEIh.js:2250:255759)
    at new Es (index-C0PMOEIh.js:2250:351536)
    at c.assignPublicKey (index-C0PMOEIh.js:3004:156107)
```

### Root Cause
This error occurs because the previous implementation was trying to manually handle Solana addresses instead of using FSL SDK's built-in wallet integration. The issue was caused by:

1. **Manual Address Handling**: Trying to pass Solana addresses from GamingHub instead of using FSL SDK
2. **Incorrect Flow**: Not using FSL SDK's `callSolInstructions` method properly
3. **Complex Integration**: Over-engineering the wallet integration

### Solutions Implemented

#### 1. Use FSL SDK's Built-in Wallet Integration
- **Before**: Manually passing Solana addresses from GamingHub
- **After**: Let FSL SDK handle all wallet operations automatically

```javascript
// Before (incorrect - manual address handling)
solanaAddress: userData.solanaAddress || null

// After (correct - FSL SDK handles everything)
// No need to track Solana addresses manually
```

#### 2. Proper FSL SDK Usage
- **Use `callSolInstructions`**: Let FSL SDK handle wallet integration
- **Automatic Signing**: FSL SDK handles transaction signing
- **Built-in Wallet**: No need for external wallet addresses

```javascript
// Correct FSL SDK usage
const result = await fslAuth.callSolInstructions({
  instructions: [transferInstruction],
  rpc: 'https://api.mainnet-beta.solana.com',
  unitLimit: 200000,
  unitPrice: 5000,
  domain: 'https://gm3.joysteps.io',
  uid: this.currentUser.id,
  onlySign: false // Execute transaction
});
```

#### 3. Simplified Data Transfer
- **Removed**: Solana address from GamingHub → GameHubPayment transfer
- **Kept**: Only essential user data (FSL ID, Telegram info)
- **Reason**: FSL SDK handles wallet integration automatically

#### 4. Enhanced Error Handling
- **Removed**: Dependency on external Solana addresses
- **Added**: Better error messages for FSL SDK operations
- **Added**: Debug logging for FSL SDK calls

### Testing Steps

#### 1. Verify FSL SDK Integration
```javascript
// Check in browser console
console.log('FSL Auth initialized:', !!fslAuth);
console.log('User FSL ID:', this.currentUser.id);
```

#### 2. Test Payment Flow
1. **GamingHub**: Click "PAY WITH SOLANA-GMT"
2. **GameHubPayment**: Should receive user data with FSL ID
3. **FSL Auth**: Should open FSL authorization popup
4. **Transaction**: Should execute using FSL SDK's wallet

#### 3. Debug Logging
The system now includes comprehensive logging:
```javascript
console.log('Setting user from GamingHub with data:', userData);
console.log('User set from GamingHub:', this.currentUser);
console.log('Processing Solana GMT payment for:', purchaseData);
console.log('Solana GMT payment transaction result:', result);
```

### Configuration Requirements

#### 1. FSL SDK Configuration
```javascript
const fslAuth = await FSLAuthorization.init({
  responseType: 'code',
  appKey: 'MiniGame',
  redirectUri: 'https://hoangdevgames.github.io/GameHubPayment/callback',
  scope: 'basic,wallet',
  state: 'gamehub_payment',
  usePopup: true,
  isApp: false,
  domain: 'https://gm3.joysteps.io',
});
```

#### 2. GMT Token Configuration
```javascript
// Solana GMT Token Address (STEPN GMT)
const gmtTokenAddress = 'CS493ksQGHFqppNRTEUdcpQS2frLLjdtj4RJEFYaU7zi';

// SPL Token Program ID
const splTokenProgramId = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
```

### Common Issues and Solutions

#### Issue 1: "User not initialized"
**Solution**: Ensure FSL ID is passed from GamingHub
```javascript
// Check in GamingHub
console.log('User FSL ID:', shared.userProfile?.fslId);
```

#### Issue 2: FSL authorization fails
**Solution**: Verify FSL SDK configuration and domain settings
```javascript
// Check domain matches
domain: 'https://gm3.joysteps.io'
```

#### Issue 3: Transaction fails with insufficient balance
**Solution**: Check GMT balance on Solana network
```javascript
// GMT balance check
const balance = await fslAuthService.getBalance();
console.log('GMT Balance:', balance.gmt);
```

### Monitoring and Debugging

#### 1. Browser Console Logs
Monitor these logs for debugging:
- `Setting user from GamingHub with data:`
- `User set from GamingHub:`
- `Processing Solana GMT payment for:`
- `Solana GMT payment transaction result:`

#### 2. Network Requests
Check these network calls:
- FSL authorization requests
- Solana RPC calls via FSL SDK
- Transaction submissions

#### 3. Error Tracking
Common error patterns:
- `Non-base58 character`: Should be resolved with FSL SDK
- `User not initialized`: Check FSL ID transfer
- `Insufficient GMT balance`: Balance issue

### Key Benefits of New Approach

1. **Simplified Integration**: No need to manage Solana addresses
2. **FSL SDK Native**: Uses FSL SDK's built-in wallet integration
3. **Automatic Signing**: FSL SDK handles all transaction signing
4. **Better Security**: Leverages FSL's secure wallet infrastructure
5. **Reduced Complexity**: Fewer moving parts, fewer failure points

### Next Steps

1. **Test the Integration**: Verify the complete payment flow works
2. **Monitor Logs**: Check browser console for any remaining issues
3. **Update Documentation**: Keep this guide updated with new findings
4. **Performance Optimization**: Consider adding retry mechanisms for failed transactions

### Support

If issues persist:
1. Check browser console logs
2. Verify FSL SDK configuration
3. Confirm FSL ID is being passed correctly
4. Test with different user accounts
5. Contact development team with specific error messages 