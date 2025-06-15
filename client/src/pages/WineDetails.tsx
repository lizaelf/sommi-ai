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
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="mb-4">Loading wine details...</div>
          <div className="text-sm text-gray-400">ID: {id}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Header with Actions */}
      <div className="relative">
        <AppHeader
          rightContent={
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <MoreHorizontal size={24} color="white" />
              </button>
              {showActions && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg min-w-[200px] z-50">
                  <button
                    onClick={() => {
                      // Handle delete account
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-3 text-left text-red-600 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete account
                  </button>
                </div>
              )}
            </div>
          }
        />
        <HeaderSpacer />
      </div>

      {/* Wine Image and Basic Info */}
      <div className="px-6 pt-4 pb-6">
        <div className="text-center mb-6">
          {/* Wine Image */}
          <div className="mx-auto mb-6 relative" style={{ width: '200px', height: '300px' }}>
            <img
              ref={imageRef}
              src={wine.image}
              alt={wine.name}
              onLoad={handleImageLoad}
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>

          {/* Wine Name */}
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Lora, serif" }}>
            {wine.name}
          </h1>

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

      {/* QR Modal */}
      <QRScanModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        onTextChoice={() => {
          setInteractionChoiceMade(true);
          setShowQRModal(false);
        }}
        onVoiceChoice={() => {
          setInteractionChoiceMade(true);
          setShowQRModal(false);
        }}
      />
    </div>
  );
}