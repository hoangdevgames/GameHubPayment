# FSL Authorization SDK Integration Guide

## Overview

This document explains how the GameHubPayment system has been refactored to use the official FSL Authorization SDK instead of URL-based approaches. This ensures proper security, consistency, and maintainability.

## Key Changes

### 1. Proper SDK Initialization

```javascript
// Before (URL-based approach)
const url = `https://gm3.joysteps.io/authorization/call-data?arguments=${JSON.stringify(args)}`;

// After (Proper SDK usage)
const fslAuth = await FSLAuthorization.init({
  responseType: 'code',
  appKey: 'MiniGame',
  redirectUri: 'https://hoangdevgames.github.io/GameHubPayment/callback',
  scope: 'basic,wallet',
  state: 'gamehub_payment',
  usePopup: true,
  isApp: false,
  domain: 'https://gm3.joysteps.io/',
});
```

### 2. Payment Methods Implementation

#### GMT Payment (EVM Contract Call)
```javascript
// Uses callEvmContract method for ERC-20 token transfers
const result = await fslAuth.callEvmContract({
  contractAddress: gmtTokenAddress,
  methodName: 'transfer',
  abi: gmtTokenABI,
  chainId: 137, // Polygon mainnet
  chain: 'polygon',
  value: '0', // No ETH value, only GMT tokens
  gasLimit: '100000',
  params: [merchantAddress, amountInWei],
  to: gmtTokenAddress,
  rpc: 'https://polygon-rpc.com',
  domain: 'https://gm3.joysteps.io/',
  uid: this.currentUser.id,
  onlySign: false // Execute transaction
});
```

#### Solana Payment (Solana Instructions)
```javascript
// Uses callSolInstructions method for Solana transactions
const result = await fslAuth.callSolInstructions({
  instructions: [transferInstruction],
  rpc: 'https://api.mainnet-beta.solana.com',
  unitLimit: 200000,
  unitPrice: 5000,
  domain: 'https://gm3.joysteps.io/',
  uid: this.currentUser.id,
  onlySign: false // Execute transaction
});
```

#### USDC Payment (EVM Contract Call)
```javascript
// Similar to GMT but with USDC token contract
const result = await fslAuth.callEvmContract({
  contractAddress: usdcTokenAddress,
  methodName: 'transfer',
  abi: usdcTokenABI,
  chainId: 137,
  chain: 'polygon',
  value: '0',
  gasLimit: '100000',
  params: [merchantAddress, amountInWei],
  to: usdcTokenAddress,
  rpc: 'https://polygon-rpc.com',
  domain: 'https://gm3.joysteps.io/',
  uid: this.currentUser.id,
  onlySign: false
});
```

## Available FSL SDK Methods

### Authentication
- `signInV2()` - Sign in with FSL
- `signOut()` - Sign out from FSL
- `signSolMessage()` - Sign messages for Solana

### EVM (Ethereum/Polygon) Methods
- `callEvmContract()` - Call smart contract methods
- `signEvmContract()` - Sign contract transactions
- `callEvmSign()` - Sign messages
- `callEvmContractByCallData()` - Call contracts with raw call data
- `signCallDataTransaction()` - Sign raw call data transactions

### Solana Methods
- `callSolInstructions()` - Execute Solana instructions
- `signSolInstructions()` - Sign Solana instructions
- `signSolTransaction()` - Sign Solana transactions

### Verification Methods
- `evmVerifyMessage()` - Verify EVM message signatures
- `evmVerifyTypedData()` - Verify typed data signatures

## Configuration Requirements

### Environment Variables
```javascript
// Required configuration
const FSL_CONFIG = {
  appKey: 'MiniGame', // Your FSL App Key
  domain: 'https://gm3.joysteps.io/',
  redirectUri: 'https://your-domain.com/callback',
  
  // Contract addresses (replace with real addresses)
  gmtTokenAddress: '0x7DdEFA1890f3d5B8c4C4C4C4C4C4C4C4C4C4C4C4',
  usdcTokenAddress: '0xA0b86a33E6441b8c4C4C4C4C4C4C4C4C4C4C4C4C4',
  merchantAddress: '0x1234567890123456789012345678901234567890',
  
  // RPC endpoints
  polygonRpc: 'https://polygon-rpc.com',
  solanaRpc: 'https://api.mainnet-beta.solana.com',
  
  // Chain IDs
  polygonChainId: 137,
  solanaChainId: 101
};
```

### Contract ABIs
```javascript
// ERC-20 Transfer ABI
const ERC20_TRANSFER_ABI = [
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
```

## Error Handling

### Common Error Types
```javascript
// Insufficient balance
if (balance.gmt < requiredAmount) {
  throw new Error('Insufficient GMT balance');
}

// User not initialized
if (!this.currentUser) {
  throw new Error('User not initialized. Please set user data first.');
}

// Transaction failed
if (!result.success) {
  throw new Error(result.error || 'Payment failed');
}
```

### Error Response Format
```javascript
{
  success: false,
  error: 'Error message',
  details: {
    code: 'ERROR_CODE',
    transactionHash: null,
    timestamp: '2024-01-01T00:00:00.000Z'
  }
}
```

## Security Considerations

### 1. Transaction Verification
```javascript
// Verify transaction signatures
const verification = await fslAuthService.verifyTransaction(signature, message);
if (!verification.isValid) {
  throw new Error('Invalid transaction signature');
}
```

### 2. Balance Checks
```javascript
// Always check balance before processing payment
const balance = await fslAuthService.getBalance();
if (balance.gmt < requiredAmount) {
  throw new Error('Insufficient balance');
}
```

### 3. User Authentication
```javascript
// Ensure user is properly authenticated
if (!this.currentUser || !this.currentUser.isConnected) {
  throw new Error('User not authenticated');
}
```

## Testing

### Mock Data for Development
```javascript
// Mock balance data for testing
const mockBalance = {
  gmt: 1000.0,
  sol: 10.0,
  usdc: 500.0
};

// Mock transaction result
const mockTransaction = {
  success: true,
  transactionHash: '0x1234567890abcdef...',
  amount: 100,
  currency: 'GMT',
  timestamp: new Date().toISOString()
};
```

### Testing Different Payment Methods
```javascript
// Test GMT payment
const gmtResult = await fslAuthService.processGMTPayment(purchaseData);

// Test Solana payment
const solResult = await fslAuthService.processSolanaPayment(purchaseData);

// Test USDC payment
const usdcResult = await fslAuthService.processUSDCPayment(purchaseData);
```

## Migration from URL-based Approach

### Before (URL-based)
```javascript
// ❌ Don't use this approach
const url = `https://gm3.joysteps.io/authorization/call-data?arguments=${JSON.stringify(args)}`;
const popup = window.open(url, 'fslAuthWindow', 'width=500,height=800');
```

### After (SDK-based)
```javascript
// ✅ Use proper SDK methods
const fslAuth = await FSLAuthorization.init(config);
const result = await fslAuth.callEvmContract(contractParams);
```

## Benefits of SDK Integration

1. **Security**: Proper signature verification and transaction handling
2. **Consistency**: Standardized API across all payment methods
3. **Maintainability**: Centralized error handling and logging
4. **Scalability**: Easy to add new payment methods
5. **Testing**: Better testability with proper mocking
6. **Documentation**: Clear API documentation and type definitions

## Troubleshooting

### Common Issues

1. **Initialization Failed**
   - Check appKey and domain configuration
   - Ensure proper network connectivity
   - Verify FSL SDK version compatibility

2. **Transaction Failed**
   - Check user balance
   - Verify contract addresses
   - Ensure proper gas limits
   - Check network congestion

3. **Signature Verification Failed**
   - Verify message format
   - Check signature encoding
   - Ensure proper domain configuration

### Debug Mode
```javascript
// Enable debug logging
console.log('FSL Auth initialized:', fslAuth);
console.log('User data:', this.currentUser);
console.log('Transaction params:', contractParams);
console.log('Transaction result:', result);
```

## Support

For issues with FSL Authorization SDK:
- Check the official documentation
- Review the SDK changelog
- Contact FSL support team
- Check GitHub issues for known problems

For GameHubPayment specific issues:
- Review this documentation
- Check console logs for error details
- Verify configuration settings
- Test with different payment methods 