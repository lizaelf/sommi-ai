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
  year?: number;
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
  const [interactionChoiceMade, setInteractionChoiceMade] = useState(false);
  const [location] = useLocation();
  const params = useParams();
  const wineId = parseInt(params.id || "1");
  
  const isScannedPage = location === '/' || location === '/scanned' || location.includes('/scanned?');
  
  // Initialize interaction choice state from localStorage
  useEffect(() => {
    const choiceMade = localStorage.getItem('interaction_choice_made');
    const hasChoice = !!choiceMade;
    console.log('🏁 Initial state check:', { choiceMade, hasChoice });
    setInteractionChoiceMade(hasChoice);
  }, []);

  const isQRScan = !interactionChoiceMade;
  
  const handleInteractionChoice = (choice: 'text' | 'voice') => {
    console.log('🎯 Interaction choice made:', choice);
    localStorage.setItem('interaction_choice_made', choice);
    setInteractionChoiceMade(true);
    setShowQRModal(false);
  };
  
  useEffect(() => {
    console.log('🔄 QR scan state changed:', { isQRScan, interactionChoiceMade });
    setShowQRModal(isQRScan);
  }, [isQRScan]);

  // Listen for QR reset events from the header button
  useEffect(() => {
    const handleQRReset = (event: Event) => {
      console.log('🔄 QR Reset event received:', event);
      
      try {
        localStorage.removeItem('interaction_choice_made');
        console.log('✅ LocalStorage cleared successfully');
        
        setInteractionChoiceMade(prev => {
          console.log('🔄 State update: prev =', prev, ', new = false');
          return false;
        });
        
        setTimeout(() => {
          setShowQRModal(true);
          console.log('🔄 Modal forced to show via timeout');
        }, 100);
        
        console.log('✅ QR reset completed successfully');
      } catch (error) {
        console.error('❌ Error during QR reset:', error);
      }
    };

    window.addEventListener('qrReset', handleQRReset, { passive: true });
    document.addEventListener('qrReset', handleQRReset, { passive: true });
    
    console.log('🎧 QR reset event listeners registered');
    
    return () => {
      window.removeEventListener('qrReset', handleQRReset);
      document.removeEventListener('qrReset', handleQRReset);
      console.log('🧹 QR reset event listeners cleaned up');
    };
  }, []);

  // Additional safeguard: Watch for localStorage changes
  useEffect(() => {
    const checkLocalStorage = () => {
      const currentChoice = localStorage.getItem('interaction_choice_made');
      const hasChoice = !!currentChoice;
      
      if (hasChoice !== interactionChoiceMade) {
        console.log('🔄 LocalStorage mismatch detected, syncing state:', { 
          localStorage: hasChoice, 
          state: interactionChoiceMade 
        });
        setInteractionChoiceMade(hasChoice);
      }
    };

    const interval = setInterval(checkLocalStorage, 1000);
    
    return () => clearInterval(interval);
  }, [interactionChoiceMade]);
  
  // Load selected wine data from URL parameter or localStorage
  const loadSelectedWine = () => {
    try {
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
          const wines = DataSyncManager.getUnifiedWineData();
          if (wines.length > 0) {
            console.log('Using default wine for QR scan state:', wines[0]);
            return wines[0];
          }
          return null;
        }
      } else {
        const wine = DataSyncManager.getWineById(wineId);
        if (wine) {
          console.log(`WineDetails: Found wine:`, wine);
          return wine;
        } else {
          console.log(`Wine ID ${wineId} not found in DataSyncManager`);
        }
      }
      
      const storedWine = localStorage.getItem('selectedWine');
      if (storedWine) {
        const wine = JSON.parse(storedWine);
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
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  
  return (
    <div className="min-h-screen bg-background mobile-fullscreen">
      <div className="relative w-full">
        
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
                onResetQR={() => console.log('Reset QR clicked')}
              />
            </>
          }
        />

        {/* Wine Section - Simple layout like yesterday */}
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

        {/* Wine Info Below Image */}
        {wine && (
          <div className="text-center px-6 pb-8">
            <h1 style={{
              fontFamily: "Lora, serif",
              fontSize: "24px",
              fontWeight: 400,
              color: "white",
              lineHeight: "32px",
              margin: "0 0 12px 0"
            }}>
              {wine.year} {wine.name}
            </h1>
            
            {wine.location && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <span>🇺🇸</span>
                <p style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  color: "#B8B8B8",
                  margin: 0
                }}>
                  {wine.location}
                </p>
              </div>
            )}

            {/* Ratings - Simplified */}
            {wine.ratings && (
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                maxWidth: "320px",
                margin: "0 auto"
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "white"
                  }}>
                    {wine.ratings.vn}
                  </div>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    color: "#999",
                    textTransform: "uppercase"
                  }}>
                    VN
                  </div>
                </div>
                
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "white"
                  }}>
                    {wine.ratings.jd}
                  </div>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    color: "#999",
                    textTransform: "uppercase"
                  }}>
                    JD
                  </div>
                </div>
                
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "white"
                  }}>
                    {wine.ratings.ws}
                  </div>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    color: "#999",
                    textTransform: "uppercase"
                  }}>
                    WS
                  </div>
                </div>
                
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "white"
                  }}>
                    {wine.ratings.abv}%
                  </div>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    color: "#999",
                    textTransform: "uppercase"
                  }}>
                    ABV
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Content Area - Enhanced Chat Interface */}
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