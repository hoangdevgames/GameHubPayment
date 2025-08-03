import FSLAuthorization from 'fsl-authorization';
import { ethers } from 'ethers';

// Basic Configuration từ FSL Authorization Integration Guide
// Note: This returns a Promise, need to await in actual usage
const initializeFSLAuthorization = () => FSLAuthorization.init({
  responseType: 'code', // 'code' | 'token'
  appKey: process.env.REACT_APP_FSL_APP_KEY || 'YOUR_APP_KEY', // Get this from FSL team
  redirectUri: window.location.origin + '/callback',
  scope: 'wallet', // Need 'wallet' scope for payments, not 'basic'
  state: 'starlet_purchase',
  usePopup: true,
  isApp: false, // Set to false for web applications
});

// Export the initializer function instead of direct instance
export { initializeFSLAuthorization };

// GGUSD Token Contract ABI (standard ERC-20 methods)
export const GGUSD_ABI = [
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract addresses for different chains (replace with actual addresses)
export const GGUSD_CONTRACTS = {
  137: '0x...', // Polygon GGUSD contract address
  56: '0x...',  // BSC GGUSD contract address
  1: '0x...',   // Ethereum GGUSD contract address
};

export const TREASURY_ADDRESSES = {
  137: '0x...', // Your Polygon treasury wallet
  56: '0x...',  // Your BSC treasury wallet
  1: '0xd17A7196B9f55BD9cb6E3D412CF49a963EC94e9B',   // Your Ethereum mainnet treasury wallet
};

// Chain configuration
export const CHAIN_CONFIG = {
  137: {
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  },
  56: {
    name: 'BSC',
    symbol: 'BNB', 
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com'
  },
  1: {
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://ethereum-rpc.com',
    blockExplorer: 'https://etherscan.io'
  }
};

export default fSLAuthorization;

// Helper functions
export function getChainName(chainId) {
  const chainNames = {
    137: 'Polygon',
    56: 'BSC',
    1: 'Ethereum',
  };
  return chainNames[chainId] || 'Unknown';
}

export function getChainId(chain) {
  const chainIds = {
    'polygon': 137,
    'bsc': 56,
    'ethereum': 1,
  };
  return chainIds[chain];
}