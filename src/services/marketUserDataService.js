import { API_CONFIG } from './fslConfig';

class MarketUserDataService {
  constructor() {
    this.serverUrl = API_CONFIG.server_url;
  }

  /**
   * Fetch market user data from the new API endpoint
   * @param {string} token - User's authentication token
   * @returns {Promise<Object>} User data from API
   */
  async fetchMarketUserData(token) {
    try {
      const response = await fetch(`${this.serverUrl}/api/app/marketUserData?token=${token}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`API error! code: ${data.code}`);
      }
      
      console.log('✅ MarketUserData API response:', data.data);
      return data.data;
    } catch (error) {
      console.error('❌ Failed to fetch market user data:', error);
      throw error;
    }
  }

  /**
   * Check if the API response has sufficient data for the application
   * @param {Object} apiData - Data from marketUserData API
   * @returns {boolean} True if data is sufficient, false otherwise
   */
  isDataSufficient(apiData) {
    if (!apiData) return false;
    
    // Check for required fields
    const requiredFields = ['uid', 'fslId', 'evmAddr'];
    const hasRequiredFields = requiredFields.every(field => apiData[field] !== undefined && apiData[field] !== null);
    
    if (!hasRequiredFields) {
      console.warn('❌ Missing required fields:', requiredFields.filter(field => apiData[field] === undefined || apiData[field] === null));
      return false;
    }
    
    // Check for critical missing fields that are used throughout the app
    const criticalMissingFields = [];
    
    if (!apiData.solAddr) {
      criticalMissingFields.push('solAddr (needed for Solana payments)');
    }
    
    if (apiData.level === undefined || apiData.level === null) {
      criticalMissingFields.push('level (used for UI display and game logic)');
    }
    
    if (!apiData.email) {
      criticalMissingFields.push('email (used for user identification)');
    }
    
    if (criticalMissingFields.length > 0) {
      console.warn('⚠️ Critical missing fields that may affect functionality:', criticalMissingFields);
      // Still return true if we have the minimum required fields, but log the warning
    }
    
    return true;
  }

  /**
   * Transform API data to match the expected userProfile structure
   * @param {Object} apiData - Data from marketUserData API
   * @returns {Object} Transformed userProfile data
   */
  transformApiDataToUserProfile(apiData) {
    return {
      fslId: apiData.fslId,
      evmAddr: apiData.evmAddr,
      solAddr: apiData.solAddr || null, // Will be null if missing
      level: apiData.level || 1, // Default to level 1 if missing
      pictureIndex: apiData.icon || 0, // Map icon to pictureIndex
      email: apiData.email || null, // Will be null if missing
      uid: apiData.uid,
      // Transform ticket and starlet to UserToken structure
      UserToken: [
        {
          prop_id: 10010, // Ticket prop_id
          num: apiData.ticket || 0
        },
        {
          prop_id: 10020, // Starlet prop_id  
          num: apiData.starlet || 0
        }
      ],
      flsPoint: apiData.flsPoint || 0 // Default to 0 if missing
    };
  }

  /**
   * Show popup to user about insufficient data
   * @param {Array} missingFields - List of missing critical fields
   */
  showInsufficientDataPopup(missingFields) {
    const message = `Some user data is incomplete. The following information is missing:\n\n${missingFields.join('\n')}\n\nThis may affect some features. The app will continue with available data.`;
    
    // Use browser alert for now, can be replaced with a custom popup component later
    alert(message);
  }
}

export default new MarketUserDataService();
