import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useParams, useRouter } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';
import typography from '@/styles/typography';
import { getWineDisplayName } from '../../../shared/wineConfig';
import { DataSyncManager } from '@/utils/dataSync';
import AppHeader from '@/components/AppHeader';
import { ButtonIcon } from '@/components/ButtonIcon';
import QRScanModal from '@/components/QRScanModal';
import { useConversation } from '@/hooks/UseConversation';

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
  const router = useRouter();
  
  // Get conversation management functions
  const { resetAllConversations } = useConversation(wineId);
  
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
                onResetQR={async () => {
                  try {
                    console.log('Starting complete account reset...');
                    
                    // Show confirmation dialog
                    const confirmed = confirm('Are you sure you want to delete your account? This will permanently delete all your conversations and data. This action cannot be undone.');
                    if (!confirmed) {
                      console.log('Account deletion cancelled by user');
                      return;
                    }
                    
                    // Reset conversation state first
                    try {
                      await resetAllConversations();
                      console.log('Conversation state reset successfully');
                    } catch (error) {
                      console.warn('Error resetting conversation state:', error);
                    }
                    
                    // Clear all localStorage data
                    localStorage.clear();
                    console.log('LocalStorage cleared completely');
                    
                    // Clear IndexedDB data using the service
                    try {
                      // Import IndexedDB service dynamically (default export)
                      const indexedDBServiceModule = await import('../lib/indexedDB');
                      const indexedDBService = indexedDBServiceModule.default;
                      await indexedDBService.clearAllData();
                      console.log('IndexedDB cleared via service');
                    } catch (error) {
                      console.warn('Error clearing IndexedDB via service, trying manual cleanup:', error);
                      
                      // Fallback to manual database deletion
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
                    
                    // Clear session storage
                    sessionStorage.clear();
                    console.log('SessionStorage cleared');
                    
                    // Try to clear server-side conversations with timeout
                    try {
                      const controller = new AbortController();
                      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                      
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
                      console.warn('Error clearing server-side data (proceeding with local cleanup):', error);
                    }
                    
                    // Dispatch reset event
                    const resetEvent = new CustomEvent('accountReset', {
                      detail: {
                        timestamp: Date.now(),
                        source: 'delete-account',
                        success: true
                      },
                      bubbles: true
                    });
                    window.dispatchEvent(resetEvent);
                    console.log('Account reset event dispatched');
                    
                    // Navigate to scanned page with QR modal instead of refreshing
                    console.log('Navigating to scanned page with QR modal...');
                    router.push(`/scanned?wine=${wineId}`);
                    
                    // Short delay to ensure navigation completes, then trigger QR modal
                    setTimeout(() => {
                      setShowQRModal(true);
                      setInteractionChoiceMade(false);
                      console.log('QR modal triggered after account deletion');
                    }, 100);
                    
                  } catch (error) {
                    console.error('Account deletion failed:', error);
                    alert('Failed to delete account. Please try again.');
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