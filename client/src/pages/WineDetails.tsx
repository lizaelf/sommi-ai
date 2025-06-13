import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, MoreHorizontal, Trash2 } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import QRScanModal from '@/components/QRScanModal';
import AppHeader, { HeaderSpacer } from '@/components/AppHeader';
import { DataSyncManager } from '@/utils/dataSync';
import { WineInfo } from '@/components/WineInfo';
import { FoodPairing } from '@/components/FoodPairing';
import { ChatSection } from '@/components/ChatSection';

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
      <AppHeader />
      <HeaderSpacer />

      {/* Split Component Architecture */}
      <div className="flex flex-col h-[100dvh]">
        <WineInfo wine={wine} />
        <FoodPairing wine={wine} />
        <ChatSection 
          wine={wine} 
          onReady={() => setChatInterfaceReady(true)}
        />
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