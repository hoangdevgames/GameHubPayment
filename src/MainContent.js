import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import './MainContent.css';
import starlet from './images/starlet.png';
import avatar from './images/avatar.png';
import background from './images/background_2.png';
import ticketIcon from './images/ticket.svg';
import arrow_2 from './images/arrow_2.svg';
import fslLogo from './images/FSLID_Login_Logo.png';
import { API_CONFIG } from './services/fslConfig';
import fslAuthService from './services/fslAuth';

const MainContent = ({ activeTab }) => {
  const { user, apiToken, selectPackage, getIncomingUserData } = useAuth();
  const [tickets, setTickets] = useState(0);
  const [starlets, setStarlets] = useState(0);
  const [marketTab, setMarketTab] = useState('telegram'); // 'starlet' or 'telegram'
  const [buyOptions, setBuyOptions] = useState([]);
  const [chainProducts, setChainProducts] = useState([]);
  const [telegramReceiveAddress, setTelegramReceiveAddress] = useState('');
  const [lineReceiveAddress, setLineReceiveAddress] = useState('');
  const [isFreeItemClaimed, setIsFreeItemClaimed] = useState(false);
  const [nextClaimTime, setNextClaimTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get incoming user data for display when not logged in
  const incomingUserData = getIncomingUserData();
  
  // Use either logged in user or incoming data for display
  const displayUser = user || (incomingUserData ? {
    name: incomingUserData.source === 'gaminghub' 
      ? incomingUserData.userData?.telegramFirstName || 'User'
      : incomingUserData.userProfile?.email || 'User',
    telegramUsername: incomingUserData.source === 'gaminghub' 
      ? incomingUserData.userData?.telegramUsername 
      : null,
    fslId: incomingUserData.source === 'gaminghub' 
      ? incomingUserData.userData?.fslId 
      : incomingUserData.userProfile?.fslId
  } : null);
  
  // Category expansion states
  const [standardPackExpanded, setStandardPackExpanded] = useState(true);
  const [exclusiveOfferExpanded, setExclusiveOfferExpanded] = useState(true);
  const [monthlyOfferExpanded, setMonthlyOfferExpanded] = useState(true);
  const [weeklyOfferExpanded, setWeeklyOfferExpanded] = useState(true);

  // ✅ NEW: Add state to track FSL connection status
  const [isFSLConnected, setIsFSLConnected] = useState(false);
  const [fslUserInfo, setFslUserInfo] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0); // State to force re-render

  // Fetch chain products from API
  useEffect(() => {
    const fetchChainProducts = async () => {
      if (!apiToken) {
        console.log('No API token availabled, skipping chain products fetch');
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_CONFIG.server_url}${API_CONFIG.endpoints.chainProducts}?token=${apiToken}`);
        const data = await response.json();
        
        console.log('Chain Products Response:', data);
        
        if (data.code === 0 && data.data) {
          const { chainProducts, telegramReceiveAddress, lineReceiveAddress } = data.data;
          
          console.log('Chain Products Data:', {
            products: chainProducts,
            telegramReceiveAddress,
            lineReceiveAddress
          });
          
          setChainProducts(chainProducts || []);
          setTelegramReceiveAddress(telegramReceiveAddress || '');
          setLineReceiveAddress(lineReceiveAddress || '');
          
          // Update FSL Auth Service with the lineReceiveAddress (treasury address)
          if (lineReceiveAddress) {
            fslAuthService.updateTreasuryAddress(lineReceiveAddress);
          }
          
          // Convert chain products to buy options format for compatibility
          const convertedOptions = (chainProducts || []).map(product => ({
            id: product.id,
            state: product.state,
            type: 0, // All chain products are standard pack for now
            stars: product.price, // price is GGUSD amount to pay
            starlet: product.starlets,
            ticket: product.ticket,
            bonus: 0,
            bonusPercentage: 0,
            canBuy: product.state === 0
          }));
          
          setBuyOptions(convertedOptions);
          
        } else if (data.code === 102002 || data.code === 102001) {
          console.log('Token expired or invalid');
          setError('Session expired. Please return to the main app and try again.');
        } else {
          console.error('API returned error:', data);
          setError('Failed to load products. Please try again.');
        }
      } catch (error) {
        console.error('Failed to fetch chain products:', error);
        setError('Network error. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Simulate user data (keep this for now)
    setTickets(150);
    setStarlets(2500);
    
    // Fetch real data
    fetchChainProducts();
  }, [apiToken]);

  // ✅ NEW: Only set FSL ID from incoming data when available (no auto-init)
  useEffect(() => {
    if (incomingUserData && incomingUserData.source === 'gaminghub') {
      const userData = incomingUserData.userData;
      if (userData.fslId) {
        console.log('🔑 Setting FSL ID from GamingHub data:', userData.fslId);
        fslAuthService.setFSLIDFromAPI(userData.fslId);
        
        // Set user data vào FSL Auth Service
        fslAuthService.setUserFromGamingHub(userData);
        
        // Check if this FSL ID is already connected
        const storedFslUser = localStorage.getItem('fsl_user_info');
        if (storedFslUser) {
          try {
            const userInfo = JSON.parse(storedFslUser);
            if (userInfo.fslId === userData.fslId) {
              setIsFSLConnected(true);
              setFslUserInfo(userInfo);
              console.log('✅ FSL ID already connected:', userData.fslId);
            }
          } catch (error) {
            console.error('Failed to check stored FSL connection:', error);
          }
        }
      }
    }
  }, [incomingUserData]);

  // ✅ NEW: Check FSL connection status on component mount
  useEffect(() => {
    const checkFSLConnection = () => {
      // Check if FSL user info exists in localStorage
      const storedFslUser = localStorage.getItem('fsl_user_info');
      if (storedFslUser) {
        try {
          const userInfo = JSON.parse(storedFslUser);
          setFslUserInfo(userInfo);
          setIsFSLConnected(true);
          console.log('✅ FSL connection restored from localStorage:', userInfo);
        } catch (error) {
          console.error('Failed to parse stored FSL user info:', error);
          localStorage.removeItem('fsl_user_info');
        }
      }
    };

    checkFSLConnection();
  }, []);

  // ✅ NEW: Check FSL Auth Service initialization status
  useEffect(() => {
    const checkFSLInitStatus = () => {
      console.log('🔍 Checking FSL Auth Service initialization status...');
      console.log('  fslAuthService.isInitialized:', fslAuthService.isInitialized);
      console.log('  fslAuthService.fslAuth:', fslAuthService.fslAuth);
      
      // Force re-render when initialization status changes
      // This will show/hide the FSL connect section
      setForceUpdate(prev => prev + 1);
    };

    // Check immediately
    checkFSLInitStatus();
    
    // Also check when incoming data changes
    if (incomingUserData?.source === 'gaminghub') {
      checkFSLInitStatus();
    }
  }, [incomingUserData]);

  // ❌ REMOVED: OAuth callback handling should only be in AuthContext
  // This logic has been moved to AuthContext to ensure single source of truth

  // Add body class to prevent iOS overscrolling
  useEffect(() => {
    // Add class when component mounts
    document.body.classList.add('mk-market-open');
    
    // Remove class when component unmounts
    return () => {
      document.body.classList.remove('mk-market-open');
    };
  }, []);

  const handleStarletPurchase = async (amount, stars, price, optionId = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Purchase clicked:', { amount, stars, price, optionId });
      
      if (optionId === 'free') {
        // Handle free item claim
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsFreeItemClaimed(true);
        // Update user stats
        setTickets(prev => prev + 1);
        setStarlets(prev => prev + 50);
        
        // Show success message
        alert('Free item claimed successfully!');
      } else {
        // Find the selected product from chainProducts
        const selectedProduct = chainProducts.find(product => product.id === optionId);
        
        if (selectedProduct) {
          // Create package data for payment
          const packageData = {
            id: selectedProduct.id,
            name: `${selectedProduct.starlets} Starlets Package`,
            starlets: selectedProduct.starlets,
            tickets: selectedProduct.ticket,
            price: selectedProduct.price, // This is the GGUSD amount to pay
            currency: 'GGUSD',
            productType: 'starlets',
            // Add additional data for payment processing
            amount: selectedProduct.starlets, // Number of starlets
            ggusdAmount: selectedProduct.price, // GGUSD amount to pay
            stars: selectedProduct.price,    // For compatibility (actually GGUSD)
            optionId: selectedProduct.id
          };
          
          console.log('Selecting package for payment:', packageData);
          
          // Select package and trigger redirect to PaymentPage
          selectPackage(packageData);
        } else {
          throw new Error('Selected product not found');
        }
      }
    } catch (err) {
      setError('Purchase failed. Please try again.');
      console.error('Purchase error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectFSLID = () => {
    console.log('Connect FSL ID clicked');
    // Handle FSL ID connection
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
    // Handle profile click - could open profile view
  };

  const handleStatsClick = (type) => {
    console.log(`${type} stats clicked`);
    // Handle stats click - could show detailed stats
  };

  // Helper function to get category title and color based on type
  const getCategoryInfo = (type) => {
    switch (type) {
      case 0:
        return { title: 'STANDARD PACK', color: '#00FF00', bgColor: 'rgba(0, 255, 0, 0.1)' };
      case 10:
        return { title: 'LIMITED WEEKLY OFFER', color: '#FF69B4', bgColor: 'rgba(255, 105, 180, 0.1)' };
      case 20:
        return { title: 'LIMITED MONTHLY OFFER', color: '#9370DB', bgColor: 'rgba(147, 112, 219, 0.1)' };
      case 30:
        return { title: 'EXCLUSIVE ONE-TIME OFFER', color: '#FFA500', bgColor: 'rgba(255, 165, 0, 0.1)' };
      default:
        return { title: 'STANDARD PACK', color: '#00FF00', bgColor: 'rgba(0, 255, 0, 0.1)' };
    }
  };

  // Helper function to get expansion state based on type
  const getExpansionState = (type) => {
    switch (type) {
      case 0:
        return standardPackExpanded;
      case 10:
        return weeklyOfferExpanded;
      case 20:
        return monthlyOfferExpanded;
      case 30:
        return exclusiveOfferExpanded;
      default:
        return standardPackExpanded;
    }
  };

  // Helper function to set expansion state based on type
  const setExpansionState = (type, value) => {
    switch (type) {
      case 0:
        setStandardPackExpanded(value);
        break;
      case 10:
        setWeeklyOfferExpanded(value);
        break;
      case 20:
        setMonthlyOfferExpanded(value);
        break;
      case 30:
        setExclusiveOfferExpanded(value);
        break;
      default:
        setStandardPackExpanded(value);
    }
  };

  // Group buy options by type
  const groupedOptions = buyOptions.reduce((acc, option) => {
    if (!acc[option.type]) {
      acc[option.type] = [];
    }
    acc[option.type].push(option);
    return acc;
  }, {});

  // Ensure all category types exist
  [0, 10, 20, 30].forEach(type => {
    if (!groupedOptions[type]) {
      groupedOptions[type] = [];
    }
  });

  // Sort categories by type order: 0 (Standard), 30 (Exclusive), 20 (Monthly), 10 (Weekly)
  const categoryOrder = [0, 30, 20, 10];

  const renderHomeContent = () => (
    <>
      <div className="background-container">
        <img src={background} alt="background" />
      </div>
      
      {/* Market Top Bar - Copy from Market.js */}
      <div className="mk-market-top-bar">
        <div className="mk-user-greeting">
          <button className="mk-profile-pic-main" onClick={handleProfileClick}>
            <img src={avatar} alt="Profile" />
          </button>
          <div className="mk-greeting-text" onClick={handleProfileClick}>
            GM {displayUser?.name || displayUser?.telegramUsername || 'User'}!
          </div>
        </div>
      </div>

      <div className="mk-market-container">
        <div className="mk-market-content">
          <div className="mk-market-title-container">
          <div className="mk-market-title">MARKET</div>

          {/* FSL Connect Section - Only show when FSL Auth Service is not initialized */}
          {!fslAuthService.isInitialized && (
            <div className="mk-fsl-connect-section">
              <div className="mk-fsl-connect-content" onClick={handleConnectFSLID}>
                <div className="mk-lock-icon"><img src={fslLogo} alt="FSL Logo" /></div>
                <div className="mk-fsl-text">
                  <div className="mk-connect-title">
                    {isFSLConnected ? 'FSL ID CONNECTED' : 'CONNECT YOUR FSL ID'}
                  </div>
                  <div className="mk-connect-subtitle">
                    {isFSLConnected 
                      ? `Welcome back, ${fslUserInfo?.name || 'User'}!` 
                      : incomingUserData?.source === 'gaminghub' 
                        ? `Welcome ${incomingUserData.userData?.telegramFirstName || 'User'}! Connect your FSL ID to claim daily rewards.`
                        : 'STEPN OG SNEAKER HOLDERS CAN CLAIM 10 FREE STARLETS DAILY!'
                    }
                  </div>
                </div>
              </div>
              
                            {/* FSL Login Button - OAuth Version */}
              <button 
                className="mk-fsl-login-button"
                onClick={async (e) => {
                  e.stopPropagation(); // Prevent triggering handleConnectFSLID
                  try {
                    console.log('🔐 OAuth FSL Login clicked...');
                    setIsLoading(true);
                    
                    // ✅ NEW: Use OAuth instead of FSL SDK
                    // Import OAuth service
                    const { default: oauthFSLAuthService } = await import('./services/oauthFSLAuth');
                    const { default: fslAuthService } = await import('./services/fslAuth');

                    await fslAuthService.signIn();
                    
                    // Start OAuth flow
                    await oauthFSLAuthService.authenticateWithOAuth();
                    
                    // Note: User will be redirected to FSL OAuth, then back to this page
                    // The OAuth callback will be handled by the service
                    
                  } catch (error) {
                    console.error('❌ OAuth FSL login failed:', error);
                    setError('OAuth login failed. Please try again.');
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? 'CONNECTING...' : (isFSLConnected ? 'CONNECTED' : 'CONNECT FSL ID')}
              </button>
              
              {/* FSL Disconnect Button - Show if connected */}
              {isFSLConnected && (
                <button 
                  className="mk-fsl-disconnect-button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      console.log('🔓 Disconnecting FSL ID...');
                      
                      // Clear localStorage
                      localStorage.removeItem('fsl_user_info');
                      localStorage.removeItem('fsl_access_token');
                      localStorage.removeItem('fsl_oauth_timestamp');
                      localStorage.removeItem('fsl_oauth_state');
                      
                      // Clear state
                      setIsFSLConnected(false);
                      setFslUserInfo(null);
                      
                      // Sign out from FSL service (if initialized)
                      if (fslAuthService.isInitialized) {
                        await fslAuthService.signOut();
                      }
                      
                      console.log('✅ FSL ID disconnected successfully');
                      alert('FSL ID disconnected successfully!');
                      
                    } catch (error) {
                      console.error('❌ Failed to disconnect FSL ID:', error);
                      setError('Failed to disconnect FSL ID. Please try again.');
                    }
                  }}
                >
                  DISCONNECT FSL ID
                </button>
              )}
            </div>
          )}
          </div>
          
          <div className="mk-market-inner-content">
            <div className="mk-market-tab-container">
              {/* <div className="mk-tabs">
                <button
                  className={`mk-tab ${marketTab === 'telegram' ? 'active' : ''}`}
                  onClick={() => setMarketTab('telegram')}
                >
                  <div>TELEGRAM</div>
                  <div>PACKAGES</div>
                </button>
                <button
                  className={`mk-tab ${marketTab === 'starlet' ? 'active' : ''}`}
                  onClick={() => setMarketTab('starlet')}
                >
                  <div>STARLET</div>
                  <div>PACKAGES</div>
                </button>
              </div> */}
              
              <div className="mk-scrollable-market-content">
                {/* Show content based on active tab */}
                {marketTab === 'telegram' && (
                  <>
                    {error && (
                      <div className="error-message" style={{ 
                        color: '#ff6b6b', 
                        textAlign: 'center', 
                        padding: '10px', 
                        marginBottom: '10px',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 107, 107, 0.3)'
                      }}>
                        {error}
                      </div>
                    )}
                    
                    {/* Render each category in order */}
                    {categoryOrder.map((type) => {
                      const categoryInfo = getCategoryInfo(type);
                      const isExpanded = getExpansionState(type);
                      const options = groupedOptions[type] || [];
                      
                      // Skip empty sections except Standard Pack (type 0) which should always show for free item
                      if (options.length === 0 && type !== 0) {
                        return null;
                      }
                      
                      return (
                        <div key={type} className="mk-market-section">
                          <div 
                            className="mk-section-header"
                            onClick={() => setExpansionState(type, !isExpanded)}
                          >
                            {/* Corner borders */}
                            <div className="mk-corner mk-top-left"></div>
                            <div className="mk-corner mk-top-right"></div>
                            
                            <div 
                              className="mk-section-title-container"
                              style={{ backgroundColor: categoryInfo.color }}
                            >
                              <span className="mk-section-title">
                                {categoryInfo.title}
                              </span>
                              <img src={arrow_2} className={`mk-section-arrow ${isExpanded ? 'expanded' : ''}`} alt="arrow" />
                            </div>
                          </div>
                          <div className={`mk-section-content ${isExpanded ? 'expanded' : ''}`}>
                            {/* Corner borders for content */}
                            <div className="mk-corner mk-bottom-left"></div>
                            <div className="mk-corner mk-bottom-right"></div>
                            
                            <div className="mk-starlet-grid">
                              {/* Show free item only in Standard Pack (type 0) */}
                              {type === 0 && (
                                <button 
                                  className={`mk-market-ticket-button ${isFreeItemClaimed ? 'sold-out' : ''}`} 
                                  onClick={() => !isFreeItemClaimed && handleStarletPurchase(50, 0, 'FREE', 'free')}
                                  disabled={isFreeItemClaimed || isLoading}
                                >
                                  <div className="mk-market-ticket-button-image-container">
                                    <div className="mk-market-ticket-content">
                                      <div className="mk-market-ticket-icon">
                                        <img src={starlet} alt="Starlet" style={{ opacity: isFreeItemClaimed ? 0.5 : 1 }} />
                                      </div>
                                      <div className="mk-market-ticket-info">
                                        <div className="mk-market-ticket-text">
                                          <div className="mk-market-ticket-amount" style={{ opacity: isFreeItemClaimed ? 0.5 : 1 }}>50</div>
                                          <div className="mk-market-ticket-label" style={{ opacity: isFreeItemClaimed ? 0.5 : 1 }}>STARLETS</div>
                                        </div>
                                        <div className="mk-market-ticket-bonus">
                                          <span>X1</span>&nbsp;<span>TICKETS</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mk-market-ticket-price">
                                      {isLoading ? 'LOADING...' : (isFreeItemClaimed ? 'SOLD OUT' : 'FREE')}
                                    </div>
                                  </div>
                                </button>
                              )}
                              
                              {/* Show regular options */}
                              {options.map((option) => {
                                // Check if option is available (state 0 = available, 1 = unavailable)
                                const isAvailable = option.state === 0 && option.canBuy;
                                
                                // Calculate bonus for special offers using new API data
                                let bonusText = null;
                                if (option.bonus > 0) {
                                  if (option.bonusPercentage > 0) {
                                    bonusText = `BONUS: +${option.bonusPercentage}%`;
                                  } else {
                                    bonusText = `BONUS: +${option.bonus}`;
                                  }
                                }
                                
                                return (
                                  <button 
                                    key={option.id}
                                    className={`mk-market-ticket-button ${!isAvailable ? 'sold-out' : ''}`}
                                    onClick={() => isAvailable && handleStarletPurchase(option.starlet, option.stars, null, option.id)}
                                    disabled={!isAvailable || isLoading}
                                  >
                                    {/* Bonus box in top-left corner */}
                                    {option.bonus > 0 && type !== 0 && (
                                      <div className="mk-market-ticket-bonus-corner" style={{ opacity: isAvailable ? 1 : 0.5 }}>
                                        <div className="mk-market-ticket-bonus-corner-text">
                                          {type === 20 ? `${option.bonusPercentage}% VALUE` : `BONUS: ${option.bonus}`}
                                        </div>
                                      </div>
                                    )}
                                    <div className="mk-market-ticket-button-image-container">
                                      <div className="mk-market-ticket-content">
                                        <div className="mk-market-ticket-icon">
                                          <img src={starlet} alt="Starlet" style={{ opacity: isAvailable ? 1 : 0.5 }} />
                                        </div>
                                        <div className="mk-market-ticket-info">
                                          <div className="mk-market-ticket-text">
                                            <div className="mk-market-ticket-amount" style={{ opacity: isAvailable ? 1 : 0.5 }}>{option.starlet}</div>
                                            <div className="mk-market-ticket-label" style={{ opacity: isAvailable ? 1 : 0.5 }}>STARLETS</div>
                                          </div>
                                          <div className="mk-market-ticket-bonus" style={{ opacity: isAvailable ? 1 : 0.5 }}>
                                            <span>X{option.ticket}</span>&nbsp;<span>TICKETS</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="mk-market-ticket-price" style={{ opacity: isAvailable ? 1 : 0.5 }}>
                                        {isLoading ? 'LOADING...' : (!isAvailable ? 'SOLD OUT' : `${option.stars} GGUSD`)}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                
                {marketTab === 'starlet' && (
                  <div className="mk-starlet-packages-placeholder">
                    <div className="mk-placeholder-content">
                      <div className="mk-placeholder-text">STARLET PACKAGES</div>
                      <div className="mk-placeholder-subtext">Coming Soon</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderPaymentContent = () => (
    <div className="payment-content">
      <div className="payment-info">
        <h2 className="section-title">Payment Information</h2>
        <p className="payment-description">
          To make a payment, please use the "PAY WITH SOLANA-GMT" button from the main GameHub application.
        </p>
        
        <div className="payment-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Go to GameHub</h3>
              <p>Navigate to the main GameHub application</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Select Package</h3>
              <p>Choose your Starlet package</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Click Pay</h3>
              <p>Click "PAY WITH SOLANA-GMT" button</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Complete Payment</h3>
              <p>You'll be redirected here to complete payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="main-content">
      {activeTab === 'home' && renderHomeContent()}
      {activeTab === 'payment' && renderPaymentContent()}
    </main>
  );
};

export default MainContent; 