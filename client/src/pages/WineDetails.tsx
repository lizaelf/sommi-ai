import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, MoreHorizontal, Trash2 } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import QRScanModal from '@/components/QRScanModal';
import AppHeader, { HeaderSpacer } from '@/components/AppHeader';
import { DataSyncManager } from '@/utils/dataSync';

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
  buyAgainLink?: string;
}

export default function WineDetails() {
  console.log('🍷 WineDetails rendering at:', new Date().toISOString());
  
  const [location] = useLocation();
  const { id } = useParams();
  const [wine, setWine] = useState<SelectedWine | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [interactionChoiceMade, setInteractionChoiceMade] = useState(false);
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [chatInterfaceReady, setChatInterfaceReady] = useState(false);
  const isScannedPage = location === '/scanned';
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Initialize DataSyncManager once on component mount
  useEffect(() => {
    DataSyncManager.initialize();
  }, []);

  // Debug component lifecycle and routing
  useEffect(() => {
    console.log('WineDetails mounted with wine:', wine?.id);
    console.log('Current location:', location);
    console.log('Route params:', { id });
    
    return () => {
      console.log('WineDetails unmounting');
    };
  }, [wine?.id, location, id]);

  // Load wine data when ID changes
  useEffect(() => {
    let mounted = true;
    setLoadingState('loading');
    
    const loadWineData = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const wineIdFromQuery = urlParams.get('wine');
      const wineId = id || wineIdFromQuery || '1';
      
      if (wineId && mounted) {
        const wineData = DataSyncManager.getWineById(parseInt(wineId));
        if (wineData) {
          console.log('WineDetails: Looking for wine ID', wineId, 'found:', wineData);
          const transformedWine = {
            id: wineData.id,
            name: wineData.name,
            year: wineData.year,
            bottles: wineData.bottles,
            image: wineData.image,
            ratings: wineData.ratings,
            buyAgainLink: wineData.buyAgainLink,
            qrCode: wineData.qrCode,
            qrLink: wineData.qrLink,
            location: wineData.location,
            description: wineData.description,
            foodPairing: wineData.foodPairing,
            conversationHistory: wineData.conversationHistory || []
          };
          setWine(transformedWine);
          setLoadingState('loaded');
          console.log('WineDetails: Wine loaded successfully:', transformedWine.name);
        } else if (mounted) {
          console.log('WineDetails: Wine not found for ID:', wineId);
          setLoadingState('error');
        }
      }
    };
    
    loadWineData();
    
    return () => {
      mounted = false;
    };
  }, [id]); // Only depend on id

  const handleQRReset = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail?.action === 'voice') {
      console.log('🎤 Voice interaction selected');
      setInteractionChoiceMade(true);
      setShowQRModal(false);
    } else if (detail?.action === 'text') {
      console.log('💬 Text interaction selected');
      setInteractionChoiceMade(true);
      setShowQRModal(false);
    }
  };

  useEffect(() => {
    window.addEventListener('qr-reset', handleQRReset);
    return () => {
      window.removeEventListener('qr-reset', handleQRReset);
    };
  }, []);



  const handleImageLoad = () => {
    setImageLoaded(true);
    console.log('Wine image loaded successfully:', wine?.image);
  };



  // Loading component
  const LoadingComponent = () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Loading Wine Details</h2>
        <p className="text-gray-400">Fetching wine information...</p>
      </div>
    </div>
  );

  // Error component
  const ErrorComponent = () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 text-6xl mb-4">⚠</div>
        <h2 className="text-2xl font-bold mb-2">Wine Not Found</h2>
        <p className="text-gray-400 mb-6">The requested wine could not be located in our collection.</p>
        <Link href="/home-global" className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
          Return to Collection
        </Link>
      </div>
    </div>
  );

  // Handle loading states
  if (loadingState === 'error') {
    return <ErrorComponent />;
  }

  // Component readiness loading condition
  if (loadingState !== 'loaded' || !wine) {
    return <LoadingComponent />;
  }

  // Debug styling to identify component mounting issues
  const debugStyle = {
    minHeight: '100vh',
    overflowY: 'visible' as const,
    overflowX: 'hidden' as const,
    border: '3px solid red', // TEMP: to identify this component
    animationDelay: '100ms'
  };

  return (
    <div 
      key={wine.id} 
      className="bg-black text-white opacity-0 animate-fade-in" 
      style={debugStyle}>
      <AppHeader 
        title={wine?.name || "Wine Details"} 
        onBack={() => window.history.back()} 
        rightContent={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>
            {showActions && (
              <div className="absolute top-12 right-4 bg-gray-800 rounded-lg shadow-lg p-2 z-50">
                <button
                  onClick={() => {
                    if (wine?.id) {
                      // DataSyncManager.deleteWine(wine.id);
                      window.history.back();
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-md transition-colors w-full"
                >
                  <Trash2 size={16} />
                  Delete Wine
                </button>
              </div>
            )}
          </div>
        }
      />
      <HeaderSpacer />

      {/* Wine Display Content */}
      <div className="flex flex-col">
        {/* Wine Image and Basic Info */}
        <div className="relative">
          <div className="flex flex-col items-center px-6 pt-6 pb-4">
            <div className="w-48 h-64 mb-4 relative">
              {wine?.image && (
                <img
                  ref={imageRef}
                  src={wine.image}
                  alt={wine.name}
                  className={`w-full h-full object-contain transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => {
                    setImageLoaded(true);
                    console.log('Wine bottle image loaded:', wine.name);
                  }}
                  onError={() => {
                    console.log('Wine bottle image failed to load');
                    setImageLoaded(true);
                  }}
                />
              )}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-800 rounded-lg animate-pulse" />
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              {wine?.name}
            </h1>
            
            {wine?.location && (
              <p className="text-gray-400 text-center mb-4">
                {wine.location}
              </p>
            )}
            
            {wine?.description && (
              <p className="text-gray-300 text-center text-sm leading-relaxed max-w-md">
                {wine.description}
              </p>
            )}
          </div>
        </div>

        {/* Wine Ratings */}
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold text-white mb-3">Ratings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{wine?.ratings?.vn || 95}</div>
              <div className="text-sm text-gray-400">Vivino</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{wine?.ratings?.jd || 93}</div>
              <div className="text-sm text-gray-400">James Dean</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{wine?.ratings?.ws || 92}</div>
              <div className="text-sm text-gray-400">Wine Spectator</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{wine?.ratings?.abv || 14.8}%</div>
              <div className="text-sm text-gray-400">ABV</div>
            </div>
          </div>
        </div>

        {/* Food Pairing */}
        {wine?.foodPairing && wine.foodPairing.length > 0 && (
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-white mb-3">Food Pairing</h2>
            <div className="flex flex-wrap gap-2">
              {wine.foodPairing.map((food, index) => (
                <span
                  key={index}
                  className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm"
                >
                  {food}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="mt-6">
          <EnhancedChatInterface
            showBuyButton={true}
            selectedWine={wine}
            onReady={() => setChatInterfaceReady(true)}
          />
        </div>
      </div>

      {/* QR Scan Modal */}
      {showQRModal && (
        <QRScanModal
          isOpen={showQRModal}
          onClose={() => {
            console.log('QR Modal close triggered');
            setShowQRModal(false);
            setInteractionChoiceMade(true);
          }}
          onTextChoice={() => {
            console.log('Text interaction selected');
            setInteractionChoiceMade(true);
            setShowQRModal(false);
          }}
          onVoiceChoice={() => {
            console.log('Voice interaction selected');
            setInteractionChoiceMade(true);
            setShowQRModal(false);
          }}
        />
      )}
    </div>
  );
}