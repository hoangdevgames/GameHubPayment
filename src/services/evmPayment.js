import { ethers } from 'ethers';
import FSLAuthorization from 'fsl-authorization';
import { initializeFSLAuthorization, GGUSD_ABI, GGUSD_CONTRACTS, TREASURY_ADDRESSES, getChainName } from './fslConfig';

// 1. Message Signing for Verification (từ FSL Authorization Integration Guide)
export async function signEvmVerificationMessage(userAddress, chainId = 137) {
  const timestamp = Date.now();
  const message = `Verify wallet ownership for Starlet purchase\nAddress: ${userAddress}\nTimestamp: ${timestamp}\nChain: ${chainId}`;
  
  try {
    const fSLAuthorization = await initializeFSLAuthorization();
    const signature = await fSLAuthorization.callEvmSign({
      chainId: chainId,
      msg: message,
      chain: getChainName(chainId), // 'Polygon', 'BSC', etc.
    });
    
    // Verify the signature
    const recoveredAddress = FSLAuthorization.evmVerifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() === userAddress.toLowerCase()) {
      console.log('Wallet verification successful');
      return { signature, message, timestamp };
    } else {
      throw new Error('Signature verification failed');
    }
  } catch (error) {
    console.error('Message signing failed:', error);
    throw error;
  }
}

// 2. ERC-20 Token Transfer (GGUSD Payment) - từ FSL Authorization Integration Guide
export async function purchaseStarletsWithGGUSD(chainId, starletAmount, ggusdAmount, decimals = 18) {
  const contractAddress = GGUSD_CONTRACTS[chainId];
  const treasuryAddress = TREASURY_ADDRESSES[chainId];
  
  if (!contractAddress || !treasuryAddress) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  
  // Convert GGUSD amount to proper decimals
  const amountInWei = ethers.parseUnits(ggusdAmount.toString(), decimals);
  
  try {
    const fSLAuthorization = await initializeFSLAuthorization();
    const txHash = await fSLAuthorization.callEvmContract({
      contractAddress: contractAddress,
      methodName: 'transfer',
      params: [treasuryAddress, amountInWei],
      abi: GGUSD_ABI,
      gasLimit: '150000', // String type, increased for safety
      chainId: chainId,
    });
    
    console.log('Payment transaction successful:', txHash);
    
    // Call your backend to verify transaction and mint Starlets
    await verifyAndMintStarlets(starletAmount, txHash, chainId);
    
    return txHash;
  } catch (error) {
    console.error('Payment failed:', error);
    throw error;
  }
}

// Chain-specific purchase functions (từ FSL Authorization Integration Guide)
export async function buyStarletsPolygon(starletAmount, ggusdAmount) {
  return await purchaseStarletsWithGGUSD(137, starletAmount, ggusdAmount);
}

export async function buyStarletsBSC(starletAmount, ggusdAmount) {
  return await purchaseStarletsWithGGUSD(56, starletAmount, ggusdAmount);
}

export async function buyStarletsEthereum(starletAmount, ggusdAmount) {
  return await purchaseStarletsWithGGUSD(1, starletAmount, ggusdAmount);
}

// 3. Alternative: Using Popup Window for Contract Calls (từ FSL Authorization Integration Guide)
export async function purchaseWithPopup(chainId, contractAddress, treasuryAddress, ggusdAmount, appKey) {
  const amountInWei = ethers.parseUnits(ggusdAmount.toString(), 18);
  
  const contractParams = {
    contractAddress: contractAddress,
    methodName: 'transfer',
    params: [treasuryAddress, amountInWei],
    abi: GGUSD_ABI,
    gasLimit: '150000',
    chainId: chainId,
  };
  
  const url = `https://id.fsl.com/authorization/sign?arguments=${JSON.stringify({
    ...contractParams,
    appKey: appKey,
  })}`;
  
  return new Promise((resolve, reject) => {
    const popup = window.open(
      url,
      'contractCallWindow',
      `left=${window.screen.width / 2 - 250},top=${window.screen.height / 2 - 400},width=500,height=800,popup=1`
    );
    
    const handleMessage = (e) => {
      if (e.data.type === 'fsl_auth') {
        window.removeEventListener('message', handleMessage);
        popup.close();
        
        if (e.data.data.error) {
          reject(new Error(e.data.data.error));
        } else {
          resolve(e.data.data);
        }
      }
    };
    
    window.addEventListener('message', handleMessage, false);
    
    // Handle popup being closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        reject(new Error('User closed the popup'));
      }
    }, 1000);
  });
}

// 4. EIP-712 Typed Data Signing (for order verification) - từ FSL Authorization Integration Guide
export async function signPurchaseOrder(orderData, chainId) {
  const domain = {
    name: 'StarletStore',
    version: '1',
    chainId: chainId,
    verifyingContract: '0x...', // Your contract address
  };

  const types = {
    PurchaseOrder: [
      { name: 'buyer', type: 'address' },
      { name: 'starletAmount', type: 'uint256' },
      { name: 'ggusdAmount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  try {
    const fSLAuthorization = await initializeFSLAuthorization();
    const signature = await fSLAuthorization.signTypedData({
      domain,
      types,
      message: orderData,
      chainId: chainId, // Corrected parameter name
    });

    // Verify signature
    const recoveredAddress = FSLAuthorization.evmVerifyTypedData(
      domain,
      types,
      orderData,
      signature
    );

    console.log('Order signed by:', recoveredAddress);
    return { signature, recoveredAddress };
  } catch (error) {
    console.error('Order signing failed:', error);
    throw error;
  }
}

// 5. Transaction Signing (without execution) - từ FSL Authorization Integration Guide
export async function signTransactionOnly(contractParams) {
  try {
    const fSLAuthorization = await initializeFSLAuthorization();
    const signedTx = await fSLAuthorization.signTransaction({
      contractAddress: contractParams.contractAddress,
      methodName: contractParams.methodName,
      params: contractParams.params,
      abi: contractParams.abi,
      gasLimit: contractParams.gasLimit,
      chainId: contractParams.chainId,
    });
    
    console.log('Transaction signed:', signedTx);
    return signedTx;
  } catch (error) {
    console.error('Transaction signing failed:', error);
    throw error;
  }
}

// Backend verification function - placeholder
export async function verifyAndMintStarlets(starletAmount, txHash, chainId) {
  try {
    const response = await fetch('/api/verify-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        starletAmount, 
        txHash, 
        chainId 
      }),
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Verification failed');
    }
    
    console.log('Starlets minted successfully:', data);
    return data;
  } catch (error) {
    console.error('Backend verification failed:', error);
    throw error;
  }
}