/**
 * Example: Sử dụng FSL Authorization để lấy địa chỉ ví và GMT balance
 * 
 * File này demo cách sử dụng các methods mới trong fslAuthService
 */

import fslAuthService from '../services/fslAuth.js';

// Example 1: Lấy địa chỉ ví hiện tại cho từng chain
async function getWalletAddressExample() {
  try {
    console.log('=== Example 1: Lấy địa chỉ ví ===');
    
    // Lấy địa chỉ Solana wallet
    const solanaAddress = await fslAuthService.getCurrentWalletAddress('solana');
    console.log('Solana Address:', solanaAddress);
    
    // Lấy địa chỉ Polygon wallet
    const polygonAddress = await fslAuthService.getCurrentWalletAddress('polygon');
    console.log('Polygon Address:', polygonAddress);
    
    // Lấy địa chỉ Ethereum wallet
    const ethereumAddress = await fslAuthService.getCurrentWalletAddress('ethereum');
    console.log('Ethereum Address:', ethereumAddress);
    
  } catch (error) {
    console.error('Error getting wallet addresses:', error);
  }
}

// Example 2: Lấy GMT balance với địa chỉ ví tự động
async function getGMTBalanceExample() {
  try {
    console.log('=== Example 2: Lấy GMT Balance tự động ===');
    
    // Lấy Solana GMT balance (tự động lấy địa chỉ ví)
    const solanaInfo = await fslAuthService.getSolanaGMTBalanceWithAddress();
    console.log('Solana GMT Info:', {
      address: solanaInfo.walletAddress,
      balance: solanaInfo.balance + ' GMT',
      chain: solanaInfo.chain
    });
    
    // Lấy Polygon GMT balance (tự động lấy địa chỉ ví)
    const polygonInfo = await fslAuthService.getPolygonGMTBalanceWithAddress();
    console.log('Polygon GMT Info:', {
      address: polygonInfo.walletAddress,
      balance: polygonInfo.balance + ' GMT',
      chain: polygonInfo.chain,
      chainId: polygonInfo.chainId
    });
    
  } catch (error) {
    console.error('Error getting GMT balances:', error);
  }
}

// Example 3: Lấy tất cả thông tin wallet một lần
async function getAllWalletInfoExample() {
  try {
    console.log('=== Example 3: Lấy tất cả thông tin wallet ===');
    
    const allWalletInfo = await fslAuthService.getAllWalletInfo();
    
    console.log('Complete Wallet Info:', {
      user: allWalletInfo.user,
      wallets: {
        solana: allWalletInfo.wallets.solana,
        polygon: allWalletInfo.wallets.polygon,
        ethereum: allWalletInfo.wallets.ethereum
      },
      balances: {
        solanaGMT: allWalletInfo.balances.solanaGMT + ' GMT',
        polygonGMT: allWalletInfo.balances.polygonGMT + ' GMT'
      },
      timestamp: allWalletInfo.timestamp
    });
    
    return allWalletInfo;
    
  } catch (error) {
    console.error('Error getting all wallet info:', error);
  }
}

// Example 4: Sử dụng trực tiếp 2 hàm GMT balance cũ (với wallet address manual)
async function manualGMTBalanceExample() {
  try {
    console.log('=== Example 4: Manual GMT Balance Check ===');
    
    // Nếu bạn đã có wallet address
    const solanaWallet = 'YOUR_SOLANA_WALLET_ADDRESS';
    const polygonWallet = 'YOUR_POLYGON_WALLET_ADDRESS';
    
    // Sử dụng hàm cũ
    const solanaBalance = await fslAuthService.getSolanaGMTBalance(solanaWallet);
    console.log(`Solana GMT Balance for ${solanaWallet}:`, solanaBalance);
    
    const polygonBalance = await fslAuthService.getPolygonGMTBalance(polygonWallet);
    console.log(`Polygon GMT Balance for ${polygonWallet}:`, polygonBalance);
    
  } catch (error) {
    console.error('Error getting manual GMT balances:', error);
  }
}

// Main example function
export async function runWalletBalanceExamples() {
  console.log('🚀 Starting Wallet Balance Examples...');
  
  // Đảm bảo user đã login
  if (!fslAuthService.getCurrentUser()) {
    console.log('⚠️ User not logged in. Please login first.');
    return;
  }
  
  try {
    // Run all examples
    await getWalletAddressExample();
    console.log('\n');
    
    await getGMTBalanceExample(); 
    console.log('\n');
    
    const allInfo = await getAllWalletInfoExample();
    console.log('\n');
    
    // Uncomment below if you want to test manual method
    // await manualGMTBalanceExample();
    
    console.log('✅ All examples completed successfully!');
    return allInfo;
    
  } catch (error) {
    console.error('❌ Examples failed:', error);
  }
}

// Export individual functions for usage
export {
  getWalletAddressExample,
  getGMTBalanceExample, 
  getAllWalletInfoExample,
  manualGMTBalanceExample
};