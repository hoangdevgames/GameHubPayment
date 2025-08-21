import FSLAuthorization from 'fsl-authorization';
import { ethers } from 'ethers';

// API Configuration
export const API_CONFIG = {
  server_url: 'https://gm14.joysteps.io',
  endpoints: {
    chainProducts: '/api/app/chainProducts'
  }
};

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

// Contract addresses for different chains (updated with actual addresses)
export const GGUSD_CONTRACTS = {
  137: '0xFFFFFF9936BD58a008855b0812B44D2c8dFFE2aA', // Polygon GGUSD contract address
  56: '0xffffff9936bd58a008855b0812b44d2c8dffe2aa',  // BSC GGUSD contract address
  1: '0x...',   // Ethereum GGUSD contract address - NEED TO GET THIS
  80002: '0xfF39ac1e2aD4CbA1b86D77d972424fB8515242bd',
};

export const TREASURY_ADDRESSES = {
  137: '0x1a7dabEfb9D1fD8BF3197d61C0D6aa8ef3948fEb', // Your Polygon treasury wallet
  56: '0x1a7dabEfb9D1fD8BF3197d61C0D6aa8ef3948fEb',  // Your BSC treasury wallet
  1: '0x1a7dabEfb9D1fD8BF3197d61C0D6aa8ef3948fEb',   // Your Ethereum treasury wallet
  80002: '0x1a7dabEfb9D1fD8BF3197d61C0D6aa8ef3948fEb',
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
  },
  80002: {
    name: 'Amoy',
    symbol: 'AMY',
    rpcUrl: 'https://rpc-amoy.polygon.technology/',
    blockExplorer: 'https://amoy.polygonscan.com/'
  }
};

export default initializeFSLAuthorization;

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