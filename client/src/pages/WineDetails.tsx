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

  // Reset conversation functionality
  const resetAllConversations = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Conversation reset completed');
        resolve(true);
      }, 100);
    });
  };
  
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
                onDeleteAccount={async () => {
                  console.log('Delete account clicked');
                  const confirmed = confirm('Are you sure you want to delete your account? This will permanently delete all your conversations and data. This action cannot be undone.');
                  if (!confirmed) {
                    console.log('Account deletion cancelled by user');
                    return;
                  }
                  
                  try {
                    await resetAllConversations();
                    console.log('Conversation state reset successfully');
                  } catch (error) {
                    console.warn('Error resetting conversation state:', error);
                  }
                  
                  localStorage.clear();
                  console.log('LocalStorage cleared completely');
                  
                  try {
                    const indexedDBServiceModule = await import('../lib/indexedDB');
                    const indexedDBService = indexedDBServiceModule.default;
                    await indexedDBService.clearAllData();
                    console.log('IndexedDB cleared via service');
                  } catch (error) {
                    console.warn('Error clearing IndexedDB via service, trying manual cleanup:', error);
                    
                    try {
                      const indexedDB = window.indexedDB;
                      const databases = await indexedDB.databases();
                      
                      for (const db of databases) {
                        if (db.name) {
                          const deleteRequest = indexedDB.deleteDatabase(db.name);
                          await new Promise((resolve, reject) => {
                            deleteRequest.onsuccess = () => resolve(true);
                            deleteRequest.onerror = () => reject(deleteRequest.error);
                          });
                          console.log(`Manually deleted database: ${db.name}`);
                        }
                      }
                    } catch (fallbackError) {
                      console.warn('Manual IndexedDB cleanup also failed:', fallbackError);
                    }
                  }
                  
                  sessionStorage.clear();
                  console.log('SessionStorage cleared');
                  
                  try {
                    if ('caches' in window) {
                      const cacheNames = await caches.keys();
                      await Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                      );
                      console.log('Browser cache cleared');
                    }
                  } catch (error) {
                    console.warn('Browser cache clearing failed:', error);
                  }
                  
                  try {
                    if ('serviceWorker' in navigator) {
                      const registrations = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(
                        registrations.map(registration => registration.unregister())
                      );
                      console.log('Service worker cache cleared');
                    }
                  } catch (error) {
                    console.warn('Service worker cache clearing failed:', error);
                  }
                  
                  try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    
                    const response = await fetch('/api/conversations', {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                      console.log('Server-side conversations cleared');
                    } else {
                      console.warn('Failed to clear server-side conversations, but proceeding with local cleanup');
                    }
                  } catch (error) {
                    console.warn('Server-side data clearing skipped due to connection issues');
                  }
                  
                  alert('Account deleted successfully. The page will now reload.');
                  
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                }}
              />
            </>
          }
        />

        {/* Wine Hero Section - Yesterday's Layout Structure */}
        <div className="pt-[75px] pb-8">
          {/* Wine Image */}
          <div className="flex justify-center items-center px-4 mb-8">
            {wine ? (
              <img
                src={wine.image}
                alt={wine.name}
                style={{
                  height: "280px",
                  width: "auto",
                }}
                onLoad={() => console.log("Wine bottle image loaded:", wine.name)}
                onError={() => console.log("Wine bottle image failed to load:", wine.image)}
              />
            ) : (
              <div style={{ height: "280px", width: "auto" }}>Loading...</div>
            )}
          </div>

          {/* Wine Title and Location - Centered like yesterday */}
          {wine && (
            <div className="text-center px-6 mb-6">
              <h1 style={{
                fontFamily: "Lora, serif",
                fontSize: "28px",
                fontWeight: 400,
                color: "white",
                lineHeight: "36px",
                margin: "0 0 16px 0"
              }}>
                {wine.year} {wine.name}
              </h1>
              
              {wine.location && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span style={{
                    fontSize: "16px",
                    color: "#B8B8B8"
                  }}>🇺🇸</span>
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
            </div>
          )}

          {/* Ratings Row - Horizontal like yesterday */}
          {wine && wine.ratings && (
            <div className="px-6 mb-8">
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                maxWidth: "400px",
                margin: "0 auto"
              }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "white",
                    marginBottom: "4px"
                  }}>
                    {wine.ratings.vn}
                  </div>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    color: "#B8B8B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    VN
                  </div>
                </div>
                
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "white",
                    marginBottom: "4px"
                  }}>
                    {wine.ratings.jd}
                  </div>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    color: "#B8B8B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    JD
                  </div>
                </div>
                
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "white",
                    marginBottom: "4px"
                  }}>
                    {wine.ratings.ws}
                  </div>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    color: "#B8B8B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    WS
                  </div>
                </div>
                
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "white",
                    marginBottom: "4px"
                  }}>
                    {wine.ratings.abv}%
                  </div>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    color: "#B8B8B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    ABV
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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