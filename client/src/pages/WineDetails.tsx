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
  const [allComponentsReady, setAllComponentsReady] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const isQRScan = urlParams.has('wine');
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
    setLoadingState('loading'); // Reset loading state when wine ID changes
    
    const loadWineData = async () => {
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
  }, [id, urlParams]); // Depend on id and urlParams

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

  // Track when all components are ready
  useEffect(() => {
    if (wine && loadingState === 'loaded') {
      // Add a small delay to ensure all components are initialized
      const timer = setTimeout(() => {
        setAllComponentsReady(true);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [wine, loadingState]);

  // Track when chat interface is ready
  useEffect(() => {
    if (wine) {
      // Simulate chat interface initialization
      setChatReady(true);
    }
  }, [wine]);

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
  if (loadingState !== 'loaded' || !wine || !chatReady || !allComponentsReady) {
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
      <AppHeader />
      <HeaderSpacer />

      {/* Main Content Container - No height constraints */}
      <div className="w-full" style={{ height: 'auto', overflow: 'visible' }}>
        {/* Wine Hero Section */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <ArrowLeft className="w-6 h-6 text-white cursor-pointer" />
            </Link>
            <div className="relative">
              <MoreHorizontal 
                className="w-6 h-6 text-white cursor-pointer" 
                onClick={() => setShowActions(!showActions)}
              />
              {showActions && (
                <div className="absolute right-0 top-8 bg-gray-800 rounded-lg shadow-lg p-2 min-w-[120px] z-10">
                  <button 
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-red-400 hover:bg-gray-700 rounded"
                    onClick={() => {
                      // Handle delete action
                      setShowActions(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Wine Image */}
          <div className="text-center mb-6">
            <div className="relative inline-block bg-gray-800 rounded-lg p-4">
              <img
                ref={imageRef}
                src={wine.image}
                alt={wine.name}
                className="max-h-48 w-auto mx-auto object-contain"
                onLoad={handleImageLoad}
                style={{
                  filter: imageLoaded ? 'none' : 'blur(5px)', // Reduced blur
                  transition: 'filter 0.2s ease', // Faster transition
                  opacity: imageLoaded ? 1 : 0.7 // Add opacity change
                }}
              />
            </div>
          </div>

          {/* Wine Name and Year */}
          <h1 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: "Lora, serif" }}>
            2021 {wine.name}
          </h1>

          {/* Bottle Count */}
          <div className="text-center text-gray-300 mb-6">
            {wine.bottles} bottles
          </div>

          {/* Wine Ratings */}
          <div className="flex justify-between text-center mb-6">
            <div>
              <div className="text-lg font-bold text-yellow-400">{wine.ratings.vn}</div>
              <div className="text-xs text-gray-400">VN</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">{wine.ratings.jd}</div>
              <div className="text-xs text-gray-400">JD</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">{wine.ratings.ws}</div>
              <div className="text-xs text-gray-400">WS</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">{wine.ratings.abv}%</div>
              <div className="text-xs text-gray-400">ABV</div>
            </div>
          </div>
        </div>

        {/* Wine Details Section */}
        <div className="px-6 pb-6 space-y-6">
          {/* Location */}
          {wine.location && (
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "Lora, serif" }}>
                Origin
              </h3>
              <p className="text-gray-300">
                {wine.location}
              </p>
            </div>
          )}

          {/* Description */}
          {wine.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "Lora, serif" }}>
                Tasting Notes
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {wine.description}
              </p>
            </div>
          )}

          {/* Food Pairing */}
          {wine.foodPairing && wine.foodPairing.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: "Lora, serif" }}>
                Perfect Pairings
              </h3>
              <div className="flex flex-wrap gap-2">
                {wine.foodPairing.map((pairing, index) => (
                  <span 
                    key={index}
                    className="bg-white/10 px-3 py-1 rounded-full text-sm"
                  >
                    {pairing}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div className="mt-0 pb-10">
          <EnhancedChatInterface 
            showBuyButton={true} 
            selectedWine={wine ? {
              id: wine.id,
              name: wine.name,
              image: wine.image,
              bottles: wine.bottles,
              ratings: wine.ratings
            } : null} 
          />
        </div>
      </div>



      {/* QR Scan Modal */}
      <QRScanModal
        isOpen={showQRModal}
        onClose={() => {
          console.log('🔄 QR Modal close triggered');
          setShowQRModal(false);
          setInteractionChoiceMade(true);
        }}
        onTextChoice={() => {
          console.log('💬 Text interaction selected');
          setInteractionChoiceMade(true);
          setShowQRModal(false);
        }}
        onVoiceChoice={() => {
          console.log('🎤 Voice interaction selected');
          setInteractionChoiceMade(true);
          setShowQRModal(false);
        }}
      />
    </div>
  );
}