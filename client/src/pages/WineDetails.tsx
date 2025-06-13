import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, MoreHorizontal, Trash2 } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import EnhancedChatInterface from "@/components/EnhancedChatInterface";
import QRScanModal from "@/components/QRScanModal";
import AppHeader, { HeaderSpacer } from "@/components/AppHeader";
import { DataSyncManager } from "@/utils/dataSync";

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
  const [loadingState, setLoadingState] = useState<
    "loading" | "loaded" | "error"
  >("loading");
  const [chatInterfaceReady, setChatInterfaceReady] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Initialize DataSyncManager once on component mount
  useEffect(() => {
    DataSyncManager.initialize();
  }, []);

  // Load wine data when ID changes
  useEffect(() => {
    let mounted = true;
    setLoadingState("loading");
    setChatInterfaceReady(false); // Reset chat interface ready state

    const loadWineData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const wineIdFromQuery = urlParams.get("wine");
      const wineId = id || wineIdFromQuery || "1";

      if (wineId && mounted) {
        const wineData = DataSyncManager.getWineById(parseInt(wineId));
        if (wineData) {
          console.log(
            "WineDetails: Loading wine ID",
            wineId,
            "found:",
            wineData,
          );
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
            conversationHistory: wineData.conversationHistory || [],
          };
          setWine(transformedWine);
          setLoadingState("loaded");
          console.log(
            "WineDetails: Wine loaded successfully:",
            transformedWine.name,
          );
        } else if (mounted) {
          console.log("WineDetails: Wine not found for ID:", wineId);
          setLoadingState("error");
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
    if (detail?.action === "voice") {
      console.log("🎤 Voice interaction selected");
      setInteractionChoiceMade(true);
      setShowQRModal(false);
    } else if (detail?.action === "text") {
      console.log("💬 Text interaction selected");
      setInteractionChoiceMade(true);
      setShowQRModal(false);
    }
  };

  useEffect(() => {
    window.addEventListener("qr-reset", handleQRReset);
    return () => {
      window.removeEventListener("qr-reset", handleQRReset);
    };
  }, []);

  const handleImageLoad = () => {
    setImageLoaded(true);
    console.log("Wine image loaded successfully:", wine?.image);
  };

  const handleChatInterfaceReady = () => {
    setChatInterfaceReady(true);
    console.log("Chat interface ready");
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
        <p className="text-gray-400 mb-6">
          The requested wine could not be located in our collection.
        </p>
        <Link
          href="/home-global"
          className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          Return to Collection
        </Link>
      </div>
    </div>
  );

  // Handle loading states
  if (loadingState === "loading" || !wine) {
    return <LoadingComponent />;
  }

  if (loadingState === "error") {
    return <ErrorComponent />;
  }

  return (
    <div className="bg-black text-white" style={{ minHeight: '100vh', overflowY: 'visible', overflowX: 'hidden' }}>
      <AppHeader />
      <HeaderSpacer />

      {/* Main Content Container - No height constraints */}
      <div className="w-full" style={{ height: 'auto', overflow: 'visible' }}>
        {/* Wine Hero Section */}
        <div className="px-6 pt-8 pb-8">
          {/* Wine Image - Large and Centered */}
          <div className="text-center mb-8">
            <img
              ref={imageRef}
              src={wine.image}
              alt={wine.name}
              className="h-80 w-auto mx-auto object-contain"
              onLoad={handleImageLoad}
              style={{
                filter: imageLoaded ? "none" : "blur(10px)",
                transition: "filter 0.3s ease",
              }}
            />
          </div>

          {/* Wine Name and Year */}
          <h1 className="text-3xl font-bold text-white text-center mb-4" style={{ fontFamily: "Lora, serif" }}>
            2021 {wine.name}
          </h1>

          {/* Location with Flag */}
          {wine.location && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-2xl">🇺🇸</span>
              <p className="text-gray-400 text-center">
                {wine.location}
              </p>
            </div>
          )}

          {/* Wine Ratings - Horizontal Layout */}
          <div className="flex justify-center gap-8 text-center mb-8">
            <div>
              <div className="text-xl font-bold text-white">{wine.ratings.vn}</div>
              <div className="text-sm text-gray-400">VN</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">{wine.ratings.jd}</div>
              <div className="text-sm text-gray-400">JD</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">{wine.ratings.ws}</div>
              <div className="text-sm text-gray-400">WS</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">{wine.ratings.abv}%</div>
              <div className="text-sm text-gray-400">ABV</div>
            </div>
          </div>
        </div>

        {/* Wine Description */}
        <div className="px-6 pb-8">
          {wine.description && (
            <p className="text-gray-300 leading-relaxed text-base">
              {wine.description}
            </p>
          )}
        </div>

        {/* Food Pairing Section */}
        {wine.foodPairing && wine.foodPairing.length > 0 && (
          <div className="px-6 pb-8">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Lora, serif" }}>
              Food pairing
            </h2>
            <div className="flex flex-wrap gap-2">
              {wine.foodPairing.map((pairing, index) => (
                <span
                  key={index}
                  className="bg-white/10 px-4 py-2 rounded-full text-sm text-white"
                >
                  {pairing}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="mt-0 pb-10">
          <EnhancedChatInterface
            showBuyButton={true}
            selectedWine={{
              id: wine.id,
              name: wine.name,
              image: wine.image,
              bottles: wine.bottles,
              ratings: wine.ratings,
            }}
            onReady={handleChatInterfaceReady}
          />
        </div>
      </div>

      {/* QR Scan Modal */}
      <QRScanModal
        isOpen={showQRModal}
        onClose={() => {
          console.log("🔄 QR Modal close triggered");
          setShowQRModal(false);
          setInteractionChoiceMade(true);
        }}
        onTextChoice={() => {
          console.log("💬 Text interaction selected");
          setInteractionChoiceMade(true);
          setShowQRModal(false);
        }}
        onVoiceChoice={() => {
          console.log("🎤 Voice interaction selected");
          setInteractionChoiceMade(true);
          setShowQRModal(false);
        }}
      />
    </div>
  );
}
