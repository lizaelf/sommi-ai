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
import QRScanModal from '@/components/QRScanModal';

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
  const [showQRModal, setShowQRModal] = useState(false);
  const [interactionChoiceMade, setInteractionChoiceMade] = useState<boolean>(false);
  const [location] = useLocation();
  const params = useParams();
  const wineId = parseInt(params.id || "1");
  
  // Determine if this is a scanned page (only /scanned routes) or wine details page
  const isScannedPage = location === '/scanned' || location.includes('/scanned?');
  
  console.log('🔍 Route Debug:', { location, isScannedPage });
  
  // Initialize interaction choice state from localStorage
  useEffect(() => {
    const choiceMade = Boolean(localStorage.getItem('interaction_choice_made'));
    setInteractionChoiceMade(choiceMade);
  }, []);
  
  // Check if this is a fresh QR scan (show interaction choice) - now reactive to state changes
  const isQRScan = !interactionChoiceMade;
  

  

  
  // Handle interaction choice
  const handleInteractionChoice = (choice: 'text' | 'voice') => {
    localStorage.setItem('interaction_choice_made', choice);
    setInteractionChoiceMade(true);
    setShowQRModal(false);
    // Continue to the chat interface
  };
  
  // Set QR modal state based on interaction choice
  useEffect(() => {
    setShowQRModal(!interactionChoiceMade);
  }, [interactionChoiceMade]);

  // Listen for QR reset events from the header button
  useEffect(() => {
    const handleQRReset = (event: Event) => {
      setInteractionChoiceMade(false);
      setShowQRModal(true);
    };

    window.addEventListener('qrReset', handleQRReset);
    return () => window.removeEventListener('qrReset', handleQRReset);
  }, []);
  
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
    interactionChoiceMade,
    isQRScan,
    showQRModal,
    wine: wine ? 'loaded' : 'null',
    wineId
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
                onResetQR={async () => {
                  try {
                    console.log('Starting QR reset process...');
                    localStorage.removeItem('interaction_choice_made');
                    console.log('LocalStorage cleared successfully');
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    const resetEvent = new CustomEvent('qrReset', {
                      detail: {
                        timestamp: Date.now(),
                        source: 'profile-menu',
                        success: true
                      },
                      bubbles: true
                    });
                    window.dispatchEvent(resetEvent);
                    console.log('QR reset event dispatched successfully');
                  } catch (error) {
                    console.error('QR reset failed:', error);
                  }
                }}
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

        {/* Main Content Area */}
        <div>
          <EnhancedChatInterface showBuyButton={true} selectedWine={wine ? {
            id: wine.id,
            name: wine.name,
            image: wine.image,
            bottles: wine.bottles,
            ratings: wine.ratings
          } : null} />
        </div>
      </div>
      
      {/* QR Scan Modal - Only show on scanned pages */}
      {isScannedPage && (
        <QRScanModal
          isOpen={showQRModal}
          onClose={() => {
            console.log('🔄 QR Modal close triggered');
            setShowQRModal(false);
          }}
          onTextChoice={() => {
            console.log('🔄 QR Modal text choice selected');
            handleInteractionChoice('text');
          }}
          onVoiceChoice={() => {
            console.log('🔄 QR Modal voice choice selected');
            handleInteractionChoice('voice');
          }}
        />
      )}
    </div>
  );
}