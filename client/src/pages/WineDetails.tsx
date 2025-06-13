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
        console.log('WineDetails: Wine loaded successfully:', transformedWine.name);
      } else {
        console.log('WineDetails: Wine not found for ID:', wineId);
      }
    }
  }, [id, wine, location]);

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
    <div className="bg-black text-white" style={{ minHeight: '100vh', overflowY: 'visible', overflowX: 'hidden' }}>
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
            <div className="relative inline-block">
              <img
                ref={imageRef}
                src={wine.image}
                alt={wine.name}
                className="h-48 w-auto mx-auto object-contain"
                onLoad={handleImageLoad}
                style={{
                  filter: imageLoaded ? 'none' : 'blur(10px)',
                  transition: 'filter 0.3s ease'
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