# GamingHub ↔ GameHubPayment Integration Guide

## Overview

This guide explains how to integrate GamingHub with GameHubPayment for seamless cross-platform purchases using Solana-GMT payments.

## Architecture

```
GamingHub (Telegram) → GameHubPayment → Solana Blockchain → GamingHub (Sync Back)
```

## 1. Data Transfer from GamingHub

### URL Structure
When a user clicks "PAY WITH SOLANA-GMT" in GamingHub, the system constructs a URL with encoded data:

```
https://hoangdevgames.github.io/GameHubPayment/?userData=<base64_encoded_user_data>&purchaseData=<base64_encoded_purchase_data>&timestamp=<timestamp>&source=gaminghub
```

### Data Encoding
- **userData**: Base64 encoded JSON containing user information
- **purchaseData**: Base64 encoded JSON containing purchase details
- **timestamp**: Unix timestamp for security
- **source**: Identifies the source as "gaminghub"

### Example Data Structure

```javascript
// userData
{
  "fslId": "12345",
  "telegramUID": "67890",
  "telegramUsername": "user123",
  "telegramFirstName": "John",
  "telegramLastName": "Doe",
  "platform": "telegram",
  "userProfile": {
    "level": 15,
    "pictureIndex": 2,
    "email": "user@example.com"
  }
}

// purchaseData
{
  "amount": 100,
  "stars": 0,
  "optionId": "premium_pack",
  "productType": "starlets",
  "currency": "gmt"
}
```

## 2. FSL ID Verification

### Process
1. **Auto-login**: GameHubPayment automatically detects incoming data
2. **FSL Verification**: Uses FSL SDK to verify the FSL ID
3. **User Setup**: Creates user session with verified data

### Verification Code
```javascript
// In fslAuth.js
async verifyFSLID(fslId) {
  try {
    this.init();
    
    // Use FSL Authorization SDK
    const verificationResult = await this.fslAuth.verifyFSLID(fslId);
    
    return {
      success: true,
      verified: true,
      userInfo: verificationResult.userInfo
    };
  } catch (error) {
    return {
      success: false,
      verified: false,
      error: error.message
    };
  }
}
```

## 3. Payment Processing

### Payment Methods
1. **Solana-GMT**: Primary method for GamingHub purchases
2. **Credit Card**: Fallback option

### Solana-GMT Payment Flow
```javascript
const handleSolanaGMTPayment = async () => {
  // 1. Connect to Solana wallet
  // 2. Check GMT balance
  // 3. Execute transaction
  // 4. Verify transaction
  // 5. Sync back to GamingHub
};
```

## 4. Data Sync Back to GamingHub

### Sync Process
After successful payment, GameHubPayment syncs data back to GamingHub:

```javascript
const syncData = {
  fslId: userData.fslId,
  telegramUID: userData.telegramUID,
  platform: userData.platform,
  purchase: {
    amount: purchaseData.amount,
    productType: purchaseData.productType,
    currency: purchaseData.currency,
    transactionId: generateTransactionId(),
    timestamp: new Date().toISOString(),
    status: 'completed'
  }
};
```

### API Endpoint
```
POST https://emperor1412.github.io/GamingHub/api/sync-purchase
```

## 5. Implementation Steps

### GamingHub Side

1. **Add Redirect Function** (in Shared.js):
```javascript
redirectToGameHubPayment: (purchaseData) => {
  const userData = {
    fslId: shared.userProfile?.fslId,
    telegramUID: shared.telegramUserData?.id,
    // ... other user data
  };
  
  const params = new URLSearchParams({
    userData: btoa(JSON.stringify(userData)),
    purchaseData: btoa(JSON.stringify(purchaseData)),
    timestamp: Date.now().toString(),
    source: 'gaminghub'
  });
  
  const redirectUrl = `${PAYMENT_BASE_URL}/?${params.toString()}`;
  window.open(redirectUrl, '_blank');
}
```

2. **Update Buy Component** (in Buy.js):
```javascript
if (method === 'gmt') {
  if (shared.userProfile.fslId === 0) {
    showFSLIDScreen();
    return;
  }
  
  shared.redirectToGameHubPayment(selectedPurchase);
  return;
}
```

### GameHubPayment Side

1. **Auto-login Detection** (in AuthContext.js):
```javascript
const checkIncomingData = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const userDataParam = urlParams.get('userData');
  const purchaseDataParam = urlParams.get('purchaseData');
  const source = urlParams.get('source');
  
  if (source === 'gaminghub' && userDataParam && purchaseDataParam) {
    const userData = JSON.parse(atob(userDataParam));
    const purchaseInfo = JSON.parse(atob(purchaseDataParam));
    autoLoginWithGamingHubData(userData, purchaseInfo);
  }
};
```

2. **FSL ID Verification** (in fslAuth.js):
```javascript
async verifyFSLID(fslId) {
  // Use FSL SDK to verify
  const verificationResult = await this.fslAuth.verifyFSLID(fslId);
  return verificationResult;
}
```

## 6. Security Considerations

### Data Protection
- **Base64 Encoding**: Prevents URL injection
- **Timestamp Validation**: Prevents replay attacks
- **Source Verification**: Ensures data comes from GamingHub
- **FSL ID Verification**: Validates user identity

### Error Handling
- **Network Failures**: Graceful degradation
- **Invalid Data**: Clear error messages
- **Payment Failures**: Rollback mechanisms

## 7. Testing

### Test Scenarios
1. **Valid Purchase Flow**: Complete end-to-end test
2. **Invalid FSL ID**: Test error handling
3. **Network Issues**: Test offline scenarios
4. **Payment Failures**: Test rollback mechanisms

### Test Data
```javascript
// Test user data
const testUserData = {
  fslId: "test_12345",
  telegramUID: "test_67890",
  platform: "telegram"
};

// Test purchase data
const testPurchaseData = {
  amount: 50,
  productType: "starlets",
  currency: "gmt"
};
```

## 8. Deployment

### Environment Variables
```bash
# GameHubPayment
REACT_APP_GAMINGHUB_BASE_URL=https://emperor1412.github.io/GamingHub
REACT_APP_FSL_APP_KEY=your_fsl_app_key

# GamingHub
REACT_APP_PAYMENT_BASE_URL=https://hoangdevgames.github.io/GameHubPayment
```

### Build Process
1. **GamingHub**: Build and deploy to GitHub Pages
2. **GameHubPayment**: Build and deploy to GitHub Pages
3. **Test Integration**: Verify cross-platform functionality

## 9. Monitoring

### Key Metrics
- **Conversion Rate**: GamingHub → GameHubPayment
- **Payment Success Rate**: Successful transactions
- **Sync Success Rate**: Data sync back to GamingHub
- **Error Rates**: Failed verifications/payments

### Logging
```javascript
console.log('Redirecting to GameHubPayment:', redirectUrl);
console.log('Received data from GamingHub:', { userData, purchaseInfo });
console.log('Purchase synced successfully to GamingHub');
```

## 10. Troubleshooting

### Common Issues
1. **FSL ID Verification Fails**: Check FSL SDK configuration
2. **Data Sync Fails**: Verify API endpoints
3. **Payment Processing Errors**: Check Solana network status
4. **URL Encoding Issues**: Validate base64 encoding

### Debug Commands
```javascript
// Check incoming data
console.log('URL params:', window.location.search);

// Verify FSL ID
console.log('FSL verification result:', verificationResult);

// Test sync
console.log('Sync result:', syncResult);
```

## Conclusion

This integration provides a seamless cross-platform payment experience while maintaining security and data integrity. The modular design allows for easy extension and maintenance. 