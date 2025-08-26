# Market User Data API Implementation

## Overview

This implementation adds support for the new `/app/marketUserData` API endpoint while maintaining backward compatibility with the existing GamingHub parameter parsing system.

## Architecture

```
App Load → Try New API First → Check Data Sufficiency → Show Warning if Needed → Fallback to GamingHub if API Fails
```

## New API Endpoint

**URL:** `/app/marketUserData`  
**Method:** GET  
**Parameters:** `token` (user authentication token)

**Response:**
```json
{
    "code": 0,
    "data": {
        "uid": 100,
        "ticket": 111,
        "starlet": 400,
        "fslId": 1925611,
        "icon": 0,
        "evmAddr": "0x171f08e438031d0ba4EC9c326dA97EC4332Ecd2a"
    }
}
```

## Data Sufficiency Check

The system checks if the API response contains sufficient data for the application to function properly.

### Required Fields (API must have these):
- `uid` - User ID
- `fslId` - FSL ID for authentication
- `evmAddr` - EVM wallet address

### Critical Missing Fields (will show warning):
- `solAddr` - Solana wallet address (needed for Solana payments)
- `level` - User level (used for UI display and game logic)
- `email` - User email (used for identification)

## Fallback Mechanism

1. **Primary:** Try to fetch data from `/app/marketUserData` API
2. **Fallback:** If API fails or data is insufficient, use GamingHub URL parameters
3. **User Warning:** Show popup if critical data is missing from API

## Implementation Details

### Files Modified/Created:

1. **`src/services/marketUserDataService.js`** - New service for API calls
2. **`src/contexts/AuthContext.js`** - Updated with fallback logic
3. **`src/components/InsufficientDataPopup.js`** - Warning popup component
4. **`src/components/InsufficientDataPopup.css`** - Popup styling
5. **`src/App.js`** - Integrated popup component

### Key Functions:

- `fetchMarketUserData(token)` - Calls the new API
- `isDataSufficient(apiData)` - Checks if data is sufficient
- `transformApiDataToUserProfile(apiData)` - Converts API data to expected format
- `checkIncomingData()` - Orchestrates the fallback logic

## Data Transformation

The API response is transformed to match the expected `userProfile` structure:

```javascript
// API Response → userProfile Structure
{
  fslId: apiData.fslId,
  evmAddr: apiData.evmAddr,
  solAddr: apiData.solAddr || null,
  level: apiData.level || 1,
  pictureIndex: apiData.icon || 0,
  email: apiData.email || null,
  uid: apiData.uid,
  UserToken: [
    { prop_id: 10010, num: apiData.ticket || 0 },  // Tickets
    { prop_id: 10020, num: apiData.starlet || 0 }  // Starlets
  ],
  flsPoint: apiData.flsPoint || 0
}
```

## User Experience

### When API Data is Sufficient:
- User is automatically logged in
- No popup is shown
- App functions normally

### When Critical Data is Missing:
- Warning popup appears listing missing fields
- User can choose to continue anyway
- App continues with available data
- Some features may be limited

### When API Fails:
- Falls back to GamingHub parameters
- No popup is shown
- App functions as before

## Configuration

The API endpoint is configured in `src/services/fslConfig.js`:

```javascript
export const API_CONFIG = {
  server_url: 'https://gm14.joysteps.io',
  // ... other config
};
```

## Testing

To test the implementation:

1. **With Valid Token:** App should fetch data from new API
2. **With Invalid Token:** Should fall back to GamingHub parameters
3. **With Missing Critical Data:** Should show warning popup
4. **Without Token:** Should only check GamingHub parameters

## Future Enhancements

1. **Custom Popup Component:** Replace browser alert with custom modal
2. **Data Validation:** Add more sophisticated data validation
3. **Retry Logic:** Add retry mechanism for failed API calls
4. **Caching:** Cache API responses to reduce calls
5. **Error Handling:** More granular error handling and user feedback

## Notes

- The existing GamingHub parameter parsing code is **NOT removed** as requested
- It serves as a fallback when the new API is unavailable
- The popup warns users about missing data but allows them to continue
- The system gracefully degrades when critical data is missing
