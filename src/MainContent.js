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

  // Fetch chain products from API
  useEffect(() => {
    const fetchChainProducts = async () => {
      if (!apiToken) {
        console.log('No API token available, skipping chain products fetch');
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

          {!displayUser?.fslId && (
            <div className="mk-fsl-connect-section" onClick={handleConnectFSLID}>
              <div className="mk-fsl-connect-content">
                <div className="mk-lock-icon"><img src={fslLogo} alt="FSL Logo" /></div>
                <div className="mk-fsl-text">
                  <div className="mk-connect-title">CONNECT YOUR FSL ID</div>
                  <div className="mk-connect-subtitle">STEPN OG SNEAKER HOLDERS CAN CLAIM 10 FREE STARLETS DAILY!</div>
                </div>
              </div>
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