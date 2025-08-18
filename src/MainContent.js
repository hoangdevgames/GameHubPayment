import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import './MainContent.css';
import starlet from './images/starlet.png';
import avatar from './images/avatar.png';
import background from './images/background_2.png';
import ticketIcon from './images/ticket.svg';
import arrow_2 from './images/arrow_2.svg';

const MainContent = ({ activeTab }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState(0);
  const [starlets, setStarlets] = useState(0);
  const [marketTab, setMarketTab] = useState('telegram'); // 'starlet' or 'telegram'
  const [buyOptions, setBuyOptions] = useState([]);
  const [isFreeItemClaimed, setIsFreeItemClaimed] = useState(false);
  const [nextClaimTime, setNextClaimTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Category expansion states
  const [standardPackExpanded, setStandardPackExpanded] = useState(true);
  const [exclusiveOfferExpanded, setExclusiveOfferExpanded] = useState(true);
  const [monthlyOfferExpanded, setMonthlyOfferExpanded] = useState(true);
  const [weeklyOfferExpanded, setWeeklyOfferExpanded] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate user data
    setTickets(150);
    setStarlets(2500);
    
    // Mock buy options with proper categorization
    setBuyOptions([
      {
        "id": 2001,
        "state": 0,
        "type": 20,
        "stars": 250,
        "starlet": 1950,
        "ticket": 0,
        "bonus": 750,
        "bonusPercentage": 50,
        "canBuy": true
      },
      {
        "id": 2002,
        "state": 0,
        "type": 20,
        "stars": 500,
        "starlet": 5400,
        "ticket": 0,
        "bonus": 2700,
        "bonusPercentage": 100,
        "canBuy": true
      },
      {
        "id": 4,
        "state": 0,
        "type": 0,
        "stars": 100,
        "starlet": 500,
        "ticket": 1,
        "bonus": 0,
        "bonusPercentage": 0,
        "canBuy": true
      },
      {
        "id": 5,
        "state": 0,
        "type": 0,
        "stars": 250,
        "starlet": 1300,
        "ticket": 5,
        "bonus": 0,
        "bonusPercentage": 0,
        "canBuy": true
      },
      {
        "id": 6,
        "state": 0,
        "type": 0,
        "stars": 500,
        "starlet": 2700,
        "ticket": 10,
        "bonus": 0,
        "bonusPercentage": 0,
        "canBuy": true
      },
      {
        "id": 1001,
        "state": 0,
        "type": 10,
        "stars": 100,
        "starlet": 525,
        "ticket": 0,
        "bonus": 25,
        "bonusPercentage": 5,
        "canBuy": true
      },
      {
        "id": 1002,
        "state": 0,
        "type": 10,
        "stars": 250,
        "starlet": 1495,
        "ticket": 0,
        "bonus": 195,
        "bonusPercentage": 15,
        "canBuy": true
      },
      {
        "id": 1003,
        "state": 0,
        "type": 10,
        "stars": 500,
        "starlet": 3375,
        "ticket": 0,
        "bonus": 675,
        "bonusPercentage": 25,
        "canBuy": true
      },
      {
        "id": 3001,
        "state": 0,
        "type": 30,
        "stars": 100,
        "starlet": 550,
        "ticket": 0,
        "bonus": 50,
        "bonusPercentage": 10,
        "canBuy": true
      },
      {
        "id": 3002,
        "state": 0,
        "type": 30,
        "stars": 250,
        "starlet": 1625,
        "ticket": 0,
        "bonus": 325,
        "bonusPercentage": 25,
        "canBuy": true
      },
      {
        "id": 3003,
        "state": 0,
        "type": 30,
        "stars": 500,
        "starlet": 4050,
        "ticket": 0,
        "bonus": 1350,
        "bonusPercentage": 50,
        "canBuy": true
      }
    ]);
  }, []);

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
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsFreeItemClaimed(true);
        // Update user stats
        setTickets(prev => prev + 1);
        setStarlets(prev => prev + 50);
      } else {
        // Handle paid purchase
        console.log('Processing paid purchase:', { amount, stars, price, optionId });
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
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
            GM {user?.name || user?.telegramUsername || 'User'}!
          </div>
        </div>
      </div>

      <div className="mk-market-container">
        <div className="mk-market-content">
          <div className="mk-market-title-container">
          <div className="mk-market-title">MARKET</div>

          {!user?.fslId && (
            <div className="mk-fsl-connect-section" onClick={handleConnectFSLID}>
              <div className="mk-fsl-connect-content">
                <div className="mk-lock-icon">🔒</div>
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
                                    <div className="mk-market-ticket-button-image-container">
                                      <div className="mk-market-ticket-content">
                                        <div className="mk-market-ticket-icon">
                                          <img src={starlet} alt="Starlet" style={{ opacity: isAvailable ? 1 : 0.5 }} />
                                        </div>
                                        <div className="mk-market-ticket-info">
                                          {bonusText && (
                                            <div className="mk-market-ticket-bonus-text" style={{ opacity: isAvailable ? 1 : 0.5 }}>
                                              {bonusText}
                                              {option.bonus > 0 && option.bonusPercentage === 0 && (
                                                <span className="bonus-details"> (+{option.bonus} Starlets)</span>
                                              )}
                                            </div>
                                          )}
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
                                        {isLoading ? 'LOADING...' : (!isAvailable ? 'SOLD OUT' : `${option.stars} TELEGRAM STARS`)}
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