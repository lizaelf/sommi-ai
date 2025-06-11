import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';
import typography from '@/styles/typography';
import { getWineDisplayName } from '../../../shared/wineConfig';
import { DataSyncManager } from '@/utils/dataSync';
import AppHeader from '@/components/AppHeader';
import { ButtonIcon } from '@/components/ButtonIcon';

interface SelectedWine {
  id: number;
  name: string;
  image: string;
  bottles: number;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  location?: string;
  description?: string;
  foodPairing?: string[];
}

export default function WineDetails() {
  const [scrolled, setScrolled] = useState(false);
  const [selectedWine, setSelectedWine] = useState<SelectedWine | null>(null);
  const [showInteractionChoice, setShowInteractionChoice] = useState(false);
  const [location] = useLocation();
  const params = useParams();
  const wineId = parseInt(params.id || "1");
  
  // Determine if this is a scanned page (root/scanned routes) or wine details page
  const isScannedPage = location === '/' || location === '/scanned' || location.includes('/scanned?');
  
  // Check if this is a fresh QR scan (show interaction choice)
  // Show QR scan state if: 1) it's a scanned page route, or 2) interaction choice was cleared (reset)
  const isQRScan = !localStorage.getItem('interaction_choice_made');
  

  

  
  // Handle interaction choice
  const handleInteractionChoice = (choice: 'text' | 'voice') => {
    localStorage.setItem('interaction_choice_made', choice);
    setShowInteractionChoice(false);
    // Continue to the chat interface
  };
  
  // Set interaction choice state when component mounts or when isQRScan changes
  useEffect(() => {
    setShowInteractionChoice(isQRScan);
  }, [isQRScan]);
  
  // Load selected wine data from URL parameter or localStorage
  const loadSelectedWine = () => {
    try {
      // For scanned page, check URL parameters first
      if (isScannedPage) {
        const urlParams = new URLSearchParams(window.location.search);
        const wineId = urlParams.get('wine');
        
        if (wineId) {
          console.log(`Scanned page: Loading wine data for ID ${wineId}`);
          const wine = DataSyncManager.getWineById(parseInt(wineId));
          if (wine) {
            console.log(`Scanned page: Found wine:`, wine);
            return wine;
          }
        } else {
          console.log('No wine ID found in URL parameters');
          // For QR scan state, use default wine (first wine from DataSyncManager)
          const wines = DataSyncManager.getUnifiedWineData();
          if (wines.length > 0) {
            console.log('Using default wine for QR scan state:', wines[0]);
            return wines[0];
          }
          return null;
        }
      } else {
        // For wine details page, use the route parameter
        const wine = DataSyncManager.getWineById(wineId);
        if (wine) {
          console.log(`WineDetails: Found wine:`, wine);
          return wine;
        } else {
          console.log(`Wine ID ${wineId} not found in DataSyncManager`);
        }
      }
      
      // Fallback to localStorage for backwards compatibility
      const storedWine = localStorage.getItem('selectedWine');
      if (storedWine) {
        const wine = JSON.parse(storedWine);
        // Clear the stored data after use
        localStorage.removeItem('selectedWine');
        return wine;
      }
      return null;
    } catch (error) {
      console.error('Error loading selected wine:', error);
      return null;
    }
  };
  
  const wine = loadSelectedWine();
  
  console.log('🔍 QR Debug:', {
    location,
    isScannedPage,
    interactionChoiceMade: localStorage.getItem('interaction_choice_made'),
    isQRScan,
    showInteractionChoice,
    wine: wine ? 'loaded' : 'null',
    wineId,
    renderCondition: showInteractionChoice && wine
  });
  
  // Add scroll listener to detect when page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Clean up the listener when component unmounts
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-background mobile-fullscreen">
      <div className="relative w-full">
        
        {/* AppHeader - Different behavior for scanned vs wine details */}
        <AppHeader 
          title={isScannedPage ? undefined : (wine ? `${wine.year} ${wine.name}` : getWineDisplayName())}
          showBackButton={!isScannedPage}
          onBack={!isScannedPage ? () => window.history.back() : undefined}
          rightContent={
            <>
              {isScannedPage && (
                <Link to="/cellar">
                  <button className="secondary-button react-button">
                    My cellar
                  </button>
                </Link>
              )}
              <ButtonIcon 
                onEditContact={() => console.log('Edit contact clicked')}
                onManageNotifications={() => console.log('Manage notifications clicked')}
                onDeleteAccount={() => console.log('Delete account clicked')}
              />
            </>
          }
        />

        {/* Wine Image Section */}
        <div className="pt-[75px] pb-4">
          <div className="flex justify-center items-center px-4">
            {wine ? (
              <img
                src={wine.image}
                alt={wine.name}
                style={{
                  height: "170px",
                  width: "auto",
                }}
                onLoad={() => console.log("Wine image loaded successfully:", wine.image)}
                onError={() => console.log("Wine image failed to load:", wine.image)}
              />
            ) : (
              <div style={{ height: "170px", width: "auto" }}>Loading...</div>
            )}
          </div>
        </div>

        {/* Wine Details Section */}
        {wine && (
          <div className="px-6 pb-6 space-y-4">
            {/* Location */}
            {wine.location && (
              <div>
                <h3 style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#CECECE",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  LOCATION
                </h3>
                <p style={{
                  fontFamily: "Lora, serif",
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "white",
                  margin: 0
                }}>
                  {wine.location}
                </p>
              </div>
            )}

            {/* Description */}
            {wine.description && (
              <div>
                <h3 style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#CECECE",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  DESCRIPTION
                </h3>
                <p style={{
                  fontFamily: "Lora, serif",
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "white",
                  margin: 0
                }}>
                  {wine.description}
                </p>
              </div>
            )}

            {/* Food Pairing */}
            {wine.foodPairing && wine.foodPairing.length > 0 && (
              <div>
                <h3 style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#CECECE",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  FOOD PAIRING
                </h3>
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px"
                }}>
                  {wine.foodPairing.map((food: string, index: number) => (
                    <span
                      key={index}
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "14px",
                        padding: "6px 12px",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "16px",
                        color: "white",
                        border: "1px solid rgba(255, 255, 255, 0.2)"
                      }}
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* QR Scan Interaction Choice or Main Content Area */}
        {showInteractionChoice && wine ? (
          <div className="px-6 pb-6 space-y-6">
            {/* Wine Title */}
            <div className="text-center">
              <h1 style={{
                fontFamily: "Lora, serif",
                fontSize: "28px",
                lineHeight: "36px",
                fontWeight: 500,
                color: "white",
                marginBottom: "8px"
              }}>
                {wine.year} {wine.name}
              </h1>
              
              {/* Location with flag */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <span style={{
                  fontSize: "18px"
                }}>🇺🇸</span>
                <span style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  color: "#CECECE"
                }}>
                  {wine.location || "San Luis Obispo County, United States"}
                </span>
              </div>
              
              {/* Wine Ratings */}
              <div className="flex justify-center gap-3 mb-8">
                <div style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "4px"
                }}>
                  <span style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "white"
                  }}>
                    {wine.ratings.vn}
                  </span>
                  <span style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    color: "#CECECE"
                  }}>
                    VN
                  </span>
                </div>
                
                <div style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "4px"
                }}>
                  <span style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "white"
                  }}>
                    {wine.ratings.jd}
                  </span>
                  <span style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    color: "#CECECE"
                  }}>
                    JD
                  </span>
                </div>
                
                <div style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "4px"
                }}>
                  <span style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "white"
                  }}>
                    {wine.ratings.ws}
                  </span>
                  <span style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    color: "#CECECE"
                  }}>
                    WS
                  </span>
                </div>
                
                <div style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "4px"
                }}>
                  <span style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "white"
                  }}>
                    {wine.ratings.abv}%
                  </span>
                  <span style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    color: "#CECECE"
                  }}>
                    ABV
                  </span>
                </div>
              </div>
            </div>
            
            {/* Interaction Choice */}
            <div className="text-center space-y-6">
              <p style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "18px",
                lineHeight: "28px",
                color: "white",
                marginBottom: "32px"
              }}>
                Would you like to<br />
                learn more about wine by
              </p>
              
              {/* Choice Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleInteractionChoice('text')}
                  style={{
                    flex: 1,
                    height: "56px",
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "28px",
                    color: "white",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "16px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                  }}
                >
                  Text
                </button>
                
                <button
                  onClick={() => handleInteractionChoice('voice')}
                  style={{
                    flex: 1,
                    height: "56px",
                    background: "white",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "28px",
                    color: "black",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "16px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                  }}
                >
                  Voice
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EnhancedChatInterface showBuyButton={true} selectedWine={wine ? {
              id: wine.id,
              name: wine.name,
              image: wine.image,
              bottles: wine.bottles,
              ratings: wine.ratings
            } : null} />
          </div>
        )}
      </div>
    </div>
  );
}