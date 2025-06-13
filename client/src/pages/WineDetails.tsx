import React, { useState, useEffect, useRef } from 'react';
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
  const [location] = useLocation();
  const { id } = useParams();
  const [wine, setWine] = useState<SelectedWine | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [interactionChoiceMade, setInteractionChoiceMade] = useState(false);
  const isQRScan = new URLSearchParams(window.location.search).has('wine');
  const isScannedPage = location === '/scanned';
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Initialize data sync manager
    DataSyncManager.initialize();
    
    // Get wine ID from URL params (either route param or query param)
    const urlParams = new URLSearchParams(window.location.search);
    const wineIdFromQuery = urlParams.get('wine');
    const wineId = id || wineIdFromQuery || '1'; // Default to wine ID 1 if none provided
    
    console.log('WineDetails: Checking for wine ID:', { id, wineIdFromQuery, wineId, location });
    
    if (wineId && !wine) {
      const wineData = DataSyncManager.getWineById(parseInt(wineId));
      console.log(`WineDetails: Looking for wine ID ${wineId}, found:`, wineData);
      if (wineData) {
        setWine(wineData);
        console.log('WineDetails: Wine loaded successfully:', wineData.name);
      }
    }
  }, [id, wine, location]);

  useEffect(() => {
    console.log('🔍 QR Debug:', {
      location,
      isScannedPage,
      interactionChoiceMade,
      isQRScan,
      showQRModal,
      wine: wine ? 'loaded' : 'not loaded',
      wineId: wine?.id,
      urlParams: new URLSearchParams(window.location.search).get('wine')
    });

    if (isScannedPage && !interactionChoiceMade) {
      setShowQRModal(true);
    }
  }, [location, isScannedPage, interactionChoiceMade, isQRScan, wine]);

  const handleQRReset = (event: Event) => {
    console.log('🔄 QR Reset triggered');
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

  if (!wine) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Wine not found</h2>
          <Link href="/">
            <button className="bg-white text-black px-6 py-2 rounded-full">
              Return Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto">
      <AppHeader />
      <HeaderSpacer />
      
      {/* Main Content Container - Fixed the overflow issue */}
      <div className="w-full overflow-y-visible">
        {/* Wine Hero Section */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft size={24} />
              </button>
            </Link>
            
            <div className="relative">
              <button 
                onClick={() => setShowActions(!showActions)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <MoreHorizontal size={24} />
              </button>
              
              {showActions && (
                <div className="absolute right-0 top-full mt-2 bg-white/10 backdrop-blur-sm rounded-lg p-2 min-w-[120px] z-10">
                  <button 
                    onClick={async () => {
                      console.log('Clear chat history action');
                      setShowActions(false);
                      
                      try {
                        // Clear chat history for this wine
                        const response = await fetch('/api/conversations', {
                          method: 'DELETE',
                          headers: {
                            'Content-Type': 'application/json',
                          }
                        });
                        
                        if (response.ok) {
                          console.log('Chat history cleared successfully');
                          // Trigger a refresh of the chat interface
                          window.dispatchEvent(new CustomEvent('chat-history-cleared'));
                        } else {
                          console.error('Failed to clear chat history');
                        }
                      } catch (error) {
                        console.error('Error clearing chat history:', error);
                      }
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/10 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                    Clear Chat
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="relative mx-auto mb-6" style={{ width: "280px", height: "400px" }}>
              <img
                ref={imageRef}
                src={wine.image}
                alt={wine.name}
                onLoad={handleImageLoad}
                className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{ 
                  filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
                  objectPosition: 'center'
                }}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Lora, serif" }}>
              {wine.name}
            </h1>
            
            <p className="text-lg text-gray-300 mb-4">
              {wine.bottles} bottles remaining
            </p>
            
            <div className="flex justify-center gap-3 mb-6">
              <span className="bg-white/10 px-3 py-1 rounded-full text-sm">
                {wine.ratings.vn} VN
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-sm">
                {wine.ratings.jd} JD
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-sm">
                {wine.ratings.ws} WS
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-sm">
                {wine.ratings.abv}% ABV
              </span>
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

        {/* Want more? Section */}
        <div className="px-6 pb-6 mt-8 bg-red-500 border-4 border-yellow-400 relative z-50" style={{ minHeight: '200px' }}>
          <h2 className="text-3xl font-normal mb-6 text-white bg-black p-4" style={{ fontFamily: "Lora, serif" }}>
            Want more? SECTION IS HERE
          </h2>
          
          {wine?.buyAgainLink ? (
            <a 
              href={wine.buyAgainLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <button className="w-full bg-white text-black border-none rounded-full py-4 px-6 text-base font-medium cursor-pointer transition-colors hover:bg-gray-100">
                Buy again
              </button>
            </a>
          ) : (
            <div className="w-full bg-white/15 text-white border border-white/30 rounded-full py-4 px-6 text-base font-medium text-center">
              Explore our collection
            </div>
          )}
        </div>

        {/* We recommend Section */}
        <div className="px-6 pb-6 mt-8 bg-blue-500 border-4 border-green-400 relative z-50" style={{ minHeight: '300px' }}>
          <h2 className="text-3xl font-normal mb-6 text-white bg-black p-4" style={{ fontFamily: "Lora, serif" }}>
            We recommend SECTION IS HERE
          </h2>
          
          <div className="flex gap-4 overflow-x-auto pb-4">
            {/* Wine Recommendation 1 - Estate Chardonnay */}
            <div className="flex-none w-56 bg-white/8 border border-white/12 rounded-2xl p-4">
              <div 
                className="w-full h-44 bg-white/5 rounded-xl mb-4 flex items-center justify-center bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: "url('/@assets/wine-1-ridge-lytton-springs-dry-creek-zinfandel-1748949884152.jpeg')"
                }}
              />
              <h3 className="text-lg font-semibold text-white mb-4 text-center leading-tight">
                2022 Estate Chardonnay
              </h3>
              <div className="flex gap-2 justify-center flex-wrap">
                <span className="bg-white/15 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                  95 <span className="opacity-70">VN</span>
                </span>
                <span className="bg-white/15 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                  93 <span className="opacity-70">JD</span>
                </span>
                <span className="bg-white/15 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                  93 <span className="opacity-70">WS</span>
                </span>
              </div>
            </div>

            {/* Wine Recommendation 2 - Monte Bello */}
            <div className="flex-none w-56 bg-white/8 border border-white/12 rounded-2xl p-4">
              <div 
                className="w-full h-44 bg-white/5 rounded-xl mb-4 flex items-center justify-center bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: "url('/@assets/wine-2-monte-bello-cabernet-sauvignon-1749210160812.png')"
                }}
              />
              <h3 className="text-lg font-semibold text-white mb-4 text-center leading-tight">
                2021 Monte Bello Cabernet Sauvignon
              </h3>
              <div className="flex gap-2 justify-center flex-wrap">
                <span className="bg-white/15 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                  95 <span className="opacity-70">VN</span>
                </span>
                <span className="bg-white/15 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                  93 <span className="opacity-70">JD</span>
                </span>
                <span className="bg-white/15 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                  93 <span className="opacity-70">WS</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="mt-10 pb-10">
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