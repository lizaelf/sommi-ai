import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreHorizontal, Trash2 } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import QRScanModal from '@/components/QRScanModal';
import AppHeader from '@/components/AppHeader';
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
    <div 
      className="min-h-screen bg-black text-white relative"
      style={{ overflowX: 'hidden', overflowY: 'auto' }}
    >
      <AppHeader />
      
      <div className="relative">
        {/* Wine Hero Section */}
        <div className="px-6 pt-20 pb-6">
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
                <div className="absolute right-0 top-full mt-2 bg-white/10 backdrop-blur-sm rounded-lg p-2 min-w-[120px]">
                  <button 
                    onClick={() => {
                      console.log('Delete wine action');
                      setShowActions(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/10 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete
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
        {wine && (
          <div className="px-6 pb-6 space-y-4">
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
        )}

        {/* Want more? Section */}
        <div style={{ 
          marginTop: "48px",
          paddingLeft: "24px", 
          paddingRight: "24px"
        }}>
          <h2 style={{
            fontFamily: "Lora, serif",
            fontSize: "32px",
            fontWeight: 400,
            color: "white",
            marginBottom: "24px"
          }}>
            Want more?
          </h2>
          
          {wine?.buyAgainLink ? (
            <a 
              href={wine.buyAgainLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <button style={{
                width: "100%",
                backgroundColor: "white",
                color: "black",
                border: "none",
                borderRadius: "32px",
                padding: "16px 24px",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
              }}
              >
                Buy again
              </button>
            </a>
          ) : (
            <div style={{
              width: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "32px",
              padding: "16px 24px",
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              textAlign: "center"
            }}>
              Explore our collection
            </div>
          )}
        </div>

        {/* We recommend Section */}
        <div style={{ 
          marginTop: "48px",
          marginBottom: "120px", 
          paddingLeft: "24px", 
          paddingRight: "24px"
        }}>
          <h2 style={{
            fontFamily: "Lora, serif",
            fontSize: "32px",
            fontWeight: 400,
            color: "white",
            marginBottom: "24px"
          }}>
            We recommend
          </h2>
          
          <div 
            className="wine-recommendations-container"
            style={{
              display: "flex",
              gap: "16px",
              overflowX: "auto",
              paddingBottom: "16px"
            }}>
            {/* Wine Recommendation 1 - Estate Chardonnay */}
            <div style={{
              flex: "0 0 auto",
              width: "220px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "16px",
              border: "1px solid rgba(255, 255, 255, 0.12)"
            }}>
              <div style={{
                width: "100%",
                height: "180px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "12px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundImage: "url('/@assets/wine-1-ridge-lytton-springs-dry-creek-zinfandel-1748949884152.jpeg')",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center"
              }}>
              </div>
              <h3 style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "18px",
                fontWeight: 600,
                color: "white",
                marginBottom: "16px",
                lineHeight: "1.3",
                textAlign: "center"
              }}>
                2022 Estate Chardonnay
              </h3>
              <div style={{
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                flexWrap: "wrap"
              }}>
                <span style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "16px",
                  fontSize: "14px",
                  fontWeight: 600
                }}>
                  95 <span style={{ opacity: 0.7 }}>VN</span>
                </span>
                <span style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "16px",
                  fontSize: "14px",
                  fontWeight: 600
                }}>
                  93 <span style={{ opacity: 0.7 }}>JD</span>
                </span>
                <span style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "16px",
                  fontSize: "14px",
                  fontWeight: 600
                }}>
                  93 <span style={{ opacity: 0.7 }}>WS</span>
                </span>
              </div>
            </div>

            {/* Wine Recommendation 2 - Monte Bello */}
            <div style={{
              flex: "0 0 auto",
              width: "220px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "16px",
              border: "1px solid rgba(255, 255, 255, 0.12)"
            }}>
              <div style={{
                width: "100%",
                height: "180px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "12px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundImage: "url('/@assets/wine-2-monte-bello-cabernet-sauvignon-1749210160812.png')",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center"
              }}>
              </div>
              <h3 style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "18px",
                fontWeight: 600,
                color: "white",
                marginBottom: "16px",
                lineHeight: "1.3",
                textAlign: "center"
              }}>
                2021 Monte Bello Cabernet Sauvignon
              </h3>
              <div style={{
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                flexWrap: "wrap"
              }}>
                <span style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "16px",
                  fontSize: "14px",
                  fontWeight: 600
                }}>
                  95 <span style={{ opacity: 0.7 }}>VN</span>
                </span>
                <span style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "16px",
                  fontSize: "14px",
                  fontWeight: 600
                }}>
                  93 <span style={{ opacity: 0.7 }}>JD</span>
                </span>
                <span style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "16px",
                  fontSize: "14px",
                  fontWeight: 600
                }}>
                  93 <span style={{ opacity: 0.7 }}>WS</span>
                </span>
              </div>
            </div>


          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ marginTop: "80px", paddingBottom: "40px" }}>
          <EnhancedChatInterface showBuyButton={true} selectedWine={wine ? {
            id: wine.id,
            name: wine.name,
            image: wine.image,
            bottles: wine.bottles,
            ratings: wine.ratings
          } : null} />
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