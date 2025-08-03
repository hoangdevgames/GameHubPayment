/**
 * Testing Helper Functions for GGUSD Payments
 * 
 * Console utilities for testing EVM payments khi FSL SDK không trả về EVM address
 */

import fslAuthService from '../services/fslAuth';

/**
 * Set EVM address manually for testing
 * Usage: window.setTestEvmAddress('0x2572421a30c0097357Cd081228D5F1C07ce96bee')
 */
window.setTestEvmAddress = function(evmAddress) {
  if (!evmAddress || !evmAddress.startsWith('0x')) {
    console.error('Invalid EVM address. Must start with 0x');
    return false;
  }
  
  try {
    fslAuthService.setEvmAddress(evmAddress);
    console.log('✅ EVM address set successfully:', evmAddress);
    console.log('Current user:', fslAuthService.getCurrentUser());
    return true;
  } catch (error) {
    console.error('Failed to set EVM address:', error);
    return false;
  }
};

/**
 * Get current EVM address
 * Usage: window.getCurrentEvmAddress()
 */
window.getCurrentEvmAddress = function() {
  const address = fslAuthService.getCurrentEvmAddress();
  console.log('Current EVM address:', address);
  return address;
};

/**
 * Test lấy wallet address từ FSL SDK
 * Usage: window.testWalletAddress()
 */
window.testWalletAddress = async function() {
  console.log('🔍 Testing wallet address retrieval from FSL SDK...');
  
  try {
    // Method 1: From userProfile
    const user = fslAuthService.getCurrentUser();
    console.log('Current user data:', user);
    
    if (user?.userProfile?.solAddr) {
      console.log('✅ Solana address from userProfile:', user.userProfile.solAddr);
    } else {
      console.log('❌ No Solana address in userProfile');
    }
    
    if (user?.evmAddress || user?.userProfile?.evmAddr) {
      console.log('✅ EVM address from userProfile:', user.evmAddress || user.userProfile.evmAddr);
    } else {
      console.log('❌ No EVM address in userProfile');
    }
    
    // Method 2: Try FSL SDK direct calls
    try {
      console.log('🔍 Trying FSL SDK wallet address retrieval...');
      const fslWalletAddress = await fslAuthService.getWalletAddressFromFSL();
      console.log('✅ FSL SDK wallet address:', fslWalletAddress);
    } catch (fslError) {
      console.log('❌ FSL SDK wallet retrieval failed:', fslError.message);
    }
    
    // Method 3: Try EVM address from FSL SDK
    try {
      console.log('🔍 Trying FSL SDK EVM address retrieval...');
      const evmAddress = await fslAuthService.getEvmAddressFromFSL();
      console.log('✅ FSL SDK EVM address:', evmAddress);
    } catch (evmError) {
      console.log('❌ FSL SDK EVM retrieval failed:', evmError.message);
    }
    
    return {
      userProfile: user?.userProfile,
      solanaFromProfile: user?.userProfile?.solAddr,
      evmFromProfile: user?.evmAddress || user?.userProfile?.evmAddr
    };
    
  } catch (error) {
    console.error('Wallet address test failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test real GMT balance
 * Usage: window.testGMTBalance()
 */
window.testGMTBalance = async function() {
  console.log('💰 Testing real GMT balance retrieval...');
  
  try {
    const balance = await fslAuthService.getBalance();
    console.log('Balance result:', balance);
    
    // Also try to see wallet address used
    const user = fslAuthService.getCurrentUser();
    const walletAddress = user?.userProfile?.solAddr || user?.walletAddress;
    
    if (walletAddress) {
      console.log('Wallet address used for balance:', walletAddress);
      
      // Test direct GMT balance call
      const directGMT = await fslAuthService.getSolanaGMTBalance(walletAddress);
      console.log('Direct GMT balance call result:', directGMT);
      
      const directSOL = await fslAuthService.getSolanaSOLBalance(walletAddress);
      console.log('Direct SOL balance call result:', directSOL);
    } else {
      console.log('No wallet address available for balance check');
    }
    
    return balance;
  } catch (error) {
    console.error('GMT balance test failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test EVM payment với mock data
 * Usage: window.testEvmPayment('polygon')
 */
window.testEvmPayment = async function(chain = 'polygon') {
  const testData = {
    amount: 10,
    quantity: 10,
    productName: 'Test Starlets',
    stars: 10,
    currency: 'ggusd'
  };
  
  console.log(`Testing ${chain} GGUSD payment...`);
  
  try {
    const chainIds = {
      'polygon': 80002,
      'bsc': 97,
      'ethereum': 11155111,
      'arbitrum': 421614
    };
    
    const result = await fslAuthService.processGGUSDPayment(testData, chainIds[chain]);
    console.log('Payment result:', result);
    return result;
  } catch (error) {
    console.error('Payment test failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check user login status and addresses
 * Usage: window.checkUserStatus()
 */
window.checkUserStatus = function() {
  const user = fslAuthService.getCurrentUser();
  const evmAddress = fslAuthService.getCurrentEvmAddress();
  
  console.log('=== User Status ===');
  console.log('User:', user);
  console.log('EVM Address:', evmAddress);
  console.log('Solana Address:', user?.walletAddress);
  console.log('=================');
  
  return {
    user,
    evmAddress,
    solanaAddress: user?.walletAddress
  };
};

/**
 * Set up complete test environment
 * Usage: window.setupTestEnvironment()
 */
window.setupTestEnvironment = function() {
  console.log('🧪 Setting up test environment...');
  
  // Set treasury address as user EVM address for testing
  const treasuryAddress = '0x2572421a30c0097357Cd081228D5F1C07ce96bee';
  
  const success = window.setTestEvmAddress(treasuryAddress);
  
  if (success) {
    console.log('✅ Test environment ready!');
    console.log('Available test functions:');
    console.log('=== WALLET & BALANCE TESTS ===');
    console.log('- window.testWalletAddress()        // Test FSL SDK wallet retrieval');
    console.log('- window.testGMTBalance()           // Test real GMT balance');
    console.log('- window.checkUserStatus()          // Check current user data');
    console.log('- window.getCurrentEvmAddress()     // Get current EVM address');
    console.log('');
    console.log('=== PAYMENT TESTS ===');
    console.log('- window.testEvmPayment("polygon")  // Test Polygon Amoy');
    console.log('- window.testEvmPayment("bsc")      // Test BSC Testnet');
    console.log('- window.testEvmPayment("ethereum") // Test Ethereum Sepolia');
    console.log('- window.testEvmPayment("arbitrum") // Test Arbitrum Sepolia');
    console.log('');
    console.log('🎯 RECOMMENDED TEST SEQUENCE:');
    console.log('1. window.testWalletAddress()  // Check wallet retrieval');
    console.log('2. window.testGMTBalance()     // Check real balance');
    console.log('3. window.testEvmPayment("polygon") // Test payment');
  }
  
  return success;
};

console.log('🔧 Testing helpers loaded. Use window.setupTestEnvironment() to start.');

export default {
  setTestEvmAddress: window.setTestEvmAddress,
  getCurrentEvmAddress: window.getCurrentEvmAddress,
  testWalletAddress: window.testWalletAddress,
  testGMTBalance: window.testGMTBalance,
  testEvmPayment: window.testEvmPayment,
  checkUserStatus: window.checkUserStatus,
  setupTestEnvironment: window.setupTestEnvironment
};