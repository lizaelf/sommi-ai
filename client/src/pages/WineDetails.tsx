import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreHorizontal, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import QRScanModal from '@/components/QRScanModal';
import AppHeader, { HeaderSpacer } from '@/components/AppHeader';
import WineRating from '@/components/WineRating';
import { DataSyncManager } from '@/utils/dataSync';
import typography from '@/styles/typography';
import wineCircleImage from '@assets/wine-circle.png';

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
  
  // Food pairing section states
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

      {/* Enhanced Wine Display */}
      <div className="px-6 pt-4 pb-6">
        <div className="text-center mb-6">
          {/* Wine Image with Circle Glow */}
          <div 
            className="mx-auto mb-6 relative flex items-center justify-center"
            style={{ 
              width: '240px', 
              height: '240px',
              background: `radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)`,
              borderRadius: '50%'
            }}
          >
            <img
              ref={imageRef}
              src={wine.image}
              alt={wine.name}
              onLoad={handleImageLoad}
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ maxWidth: '180px', maxHeight: '220px' }}
            />
          </div>

          {/* Wine Name with Year */}
          <h1 className="text-2xl font-bold mb-4" style={typography.h1}>
            {wine.year ? `${wine.year} ${wine.name}` : wine.name}
          </h1>

          {/* Wine Ratings using WineRating Component */}
          <div className="mb-6">
            <WineRating 
              ratings={wine.ratings} 
              variant="default"
              align="center"
            />
          </div>

          {/* Location with Flag */}
          <div className="flex items-center justify-center gap-2 mb-6" style={typography.body}>
            <img 
              src="/us-flag.png" 
              alt="US Flag" 
              className="w-5 h-4"
            />
            <span className="text-gray-300">
              {wine.location || "Santa Cruz Mountains | California | United States"}
            </span>
          </div>
        </div>

        {/* Enhanced Wine Details Section */}
        <div className="space-y-8">
          {/* History Section */}
          {wine.description && (
            <div>
              <h1 className="text-left mb-4" style={typography.h1}>
                History
              </h1>
              <p className="text-gray-300 text-left" style={typography.body}>
                {wine.description}
              </p>
            </div>
          )}

          {/* Food Pairing Section */}
          <div>
            <h1 className="text-left mb-2" style={typography.h1}>
              Food Pairing
            </h1>
            <div className="space-y-2">
              {/* Red Meat Section */}
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('redMeat')}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span style={typography.buttonPlus1}>Red Meat</span>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                      Perfect match
                    </span>
                  </div>
                  {expandedSections.redMeat ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </button>
                {expandedSections.redMeat && (
                  <div className="px-4 pb-3 space-y-2">
                    <p className="text-gray-300" style={typography.body}>
                      Grilled lamb, BBQ ribs, beef steaks with bold flavors
                    </p>
                  </div>
                )}
              </div>

              {/* Cheese Pairings */}
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('cheese')}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
                >
                  <span style={typography.buttonPlus1}>Cheese Pairings</span>
                  {expandedSections.cheese ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </button>
                {expandedSections.cheese && (
                  <div className="px-4 pb-3 space-y-2">
                    <p className="text-gray-300" style={typography.body}>
                      Aged cheddar, Gouda, Blue cheese, Manchego
                    </p>
                  </div>
                )}
              </div>

              {/* Vegetarian Options */}
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('vegetarian')}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
                >
                  <span style={typography.buttonPlus1}>Vegetarian Options</span>
                  {expandedSections.vegetarian ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </button>
                {expandedSections.vegetarian && (
                  <div className="px-4 pb-3 space-y-2">
                    <p className="text-gray-300" style={typography.body}>
                      Grilled portobello mushrooms, roasted eggplant, hearty legume dishes
                    </p>
                  </div>
                )}
              </div>

              {/* Avoid Section */}
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('avoid')}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
                >
                  <span style={typography.buttonPlus1}>Avoid</span>
                  {expandedSections.avoid ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </button>
                {expandedSections.avoid && (
                  <div className="px-4 pb-3 space-y-2">
                    <p className="text-gray-300" style={typography.body}>
                      Delicate fish, light salads, very spicy cuisines
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

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

          {/* Want more? Section */}
          {wine.buyAgainLink && (
            <div>
              <h1 className="text-left mb-4" style={typography.h1}>
                Want more?
              </h1>
              <a
                href={wine.buyAgainLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                style={typography.buttonPlus1}
              >
                Buy again
              </a>
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