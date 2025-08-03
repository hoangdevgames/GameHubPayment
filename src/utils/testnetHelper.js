/**
 * Testnet Helper Utilities
 * 
 * Helper functions and resources for testnet development
 * Treasury Address: 0x2572421a30c0097357Cd081228D5F1C07ce96bee
 */

// Testnet Chain Information based on https://docs.metamask.io/services/how-to/get-testnet-tokens/
export const TESTNET_CHAINS = {
  80002: {
    name: 'Polygon Amoy Testnet',
    shortName: 'Polygon Amoy',
    currency: 'MATIC',
    rpcUrl: 'https://rpc-amoy.polygon.technology/',
    blockExplorer: 'https://amoy.polygonscan.com/',
    faucet: 'https://faucet.polygon.technology/',
    chainId: 80002,
    hex: '0x13882'
  },
  97: {
    name: 'BSC Testnet',
    shortName: 'BSC Testnet',
    currency: 'tBNB',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    blockExplorer: 'https://testnet.bscscan.com/',
    faucet: 'https://www.bnbchain.org/en/testnet-faucet',
    chainId: 97,
    hex: '0x61'
  },
  11155111: {
    name: 'Ethereum Sepolia',
    shortName: 'Sepolia',
    currency: 'ETH',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io/',
    faucet: 'https://faucet.quicknode.com/ethereum/sepolia',
    chainId: 11155111,
    hex: '0xaa36a7'
  },
  421614: {
    name: 'Arbitrum Sepolia',
    shortName: 'Arbitrum Sepolia',
    currency: 'ETH',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io/',
    faucet: 'https://faucet.quicknode.com/arbitrum/sepolia',
    chainId: 421614,
    hex: '0x66eee'
  },
  84532: {
    name: 'Base Sepolia',
    shortName: 'Base Sepolia', 
    currency: 'ETH',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org/',
    faucet: 'https://faucet.quicknode.com/base/sepolia',
    chainId: 84532,
    hex: '0x14a34'
  }
};

// Treasury wallet address for all testnets
export const TREASURY_ADDRESS = '0x2572421a30c0097357Cd081228D5F1C07ce96bee';

// GameHub testnet environment
export const GAMEHUB_TESTNET = 'https://gm3.joysteps.io/';

/**
 * Get testnet chain information
 */
export function getTestnetChain(chainId) {
  return TESTNET_CHAINS[chainId] || null;
}

/**
 * Get all supported testnet chains
 */
export function getAllTestnetChains() {
  return Object.values(TESTNET_CHAINS);
}

/**
 * Format chain info for MetaMask wallet connection
 */
export function getMetaMaskChainConfig(chainId) {
  const chain = TESTNET_CHAINS[chainId];
  if (!chain) return null;

  return {
    chainId: chain.hex,
    chainName: chain.name,
    nativeCurrency: {
      name: chain.currency,
      symbol: chain.currency,
      decimals: 18
    },
    rpcUrls: [chain.rpcUrl],
    blockExplorerUrls: [chain.blockExplorer]
  };
}

/**
 * Get faucet URLs for getting testnet tokens
 * Based on https://docs.metamask.io/services/how-to/get-testnet-tokens/
 */
export function getFaucetInfo() {
  return {
    'Polygon Amoy': {
      url: 'https://faucet.polygon.technology/',
      tokens: ['MATIC', 'Test tokens'],
      description: 'Official Polygon faucet for Amoy testnet'
    },
    'BSC Testnet': {
      url: 'https://www.bnbchain.org/en/testnet-faucet',
      tokens: ['tBNB', 'Test tokens'],
      description: 'Official Binance testnet faucet'
    },
    'Ethereum Sepolia': {
      url: 'https://faucet.quicknode.com/ethereum/sepolia',
      tokens: ['ETH'],
      description: 'QuickNode Sepolia faucet'
    },
    'Arbitrum Sepolia': {
      url: 'https://faucet.quicknode.com/arbitrum/sepolia',
      tokens: ['ETH'],
      description: 'QuickNode Arbitrum Sepolia faucet'
    },
    'Base Sepolia': {
      url: 'https://faucet.quicknode.com/base/sepolia',
      tokens: ['ETH'],
      description: 'QuickNode Base Sepolia faucet'
    }
  };
}

/**
 * Generate testnet deployment guide
 */
export function getTestnetGuide() {
  return {
    steps: [
      {
        title: 'Add testnet to MetaMask',
        description: 'Add the testnet chain to your MetaMask wallet',
        action: 'Use getMetaMaskChainConfig() to get chain parameters'
      },
      {
        title: 'Get testnet tokens',
        description: 'Get test tokens from faucets',
        action: 'Visit faucet URLs from getFaucetInfo()'
      },
      {
        title: 'Deploy GGUSD testnet contract',
        description: 'Deploy GGUSD token contract on testnet',
        action: 'Update GGUSD_CONTRACTS in fslAuth.js with deployed addresses'
      },
      {
        title: 'Test payment flow',
        description: 'Test the complete payment flow',
        action: 'Use treasury address: ' + TREASURY_ADDRESS
      }
    ],
    notes: [
      'Treasury address is set to: ' + TREASURY_ADDRESS,
      'GameHub testnet environment: ' + GAMEHUB_TESTNET,
      'All chains point to the same treasury for testing',
      'Make sure to deploy GGUSD contracts on each testnet'
    ]
  };
}

/**
 * Validate if address is the correct treasury
 */
export function validateTreasuryAddress(address) {
  return address.toLowerCase() === TREASURY_ADDRESS.toLowerCase();
}

/**
 * Get block explorer URL for transaction
 */
export function getExplorerUrl(chainId, txHash) {
  const chain = TESTNET_CHAINS[chainId];
  if (!chain) return null;
  
  return `${chain.blockExplorer}tx/${txHash}`;
}

/**
 * Get testnet token deployment checklist
 */
export function getDeploymentChecklist() {
  return {
    requirements: [
      'MetaMask wallet connected to testnet',
      'Testnet ETH/MATIC/BNB for gas fees',
      'GGUSD token contract deployed',
      'Treasury wallet configured: ' + TREASURY_ADDRESS
    ],
    contracts: {
      GGUSD: 'Deploy ERC-20 GGUSD token on each testnet',
      Treasury: 'Configure treasury to receive payments: ' + TREASURY_ADDRESS
    },
    testing: [
      'Test wallet connection',
      'Test token approval',
      'Test payment transaction',
      'Test transaction verification'
    ]
  };
}

export default {
  TESTNET_CHAINS,
  TREASURY_ADDRESS,
  GAMEHUB_TESTNET,
  getTestnetChain,
  getAllTestnetChains,
  getMetaMaskChainConfig,
  getFaucetInfo,
  getTestnetGuide,
  validateTreasuryAddress,
  getExplorerUrl,
  getDeploymentChecklist
};