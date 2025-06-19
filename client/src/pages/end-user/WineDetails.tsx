import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, MoreHorizontal, Trash2 } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import QRScanModal from "@/components/qr/QRScanModal";
import AppHeader, { HeaderSpacer } from "@/components/layout/AppHeader";
import { DataSyncManager } from "@/utils/dataSync";
import typography from "@/styles/typography";
import {
  WineDetailsHero,
  WineHistorySection,
  FoodPairingSection,
  BuyAgainSection,
  WineRecommendationsSection
} from "@/components/wine-details";
import { WineChatSection } from "@/components/chat";

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
  qrCode?: string;
  qrLink?: string;
  conversationHistory?: any[];
}

export default function WineDetails() {
  const [location] = useLocation();
  const { id } = useParams();
  const [wine, setWine] = useState<SelectedWine | null>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error' | 'notfound'>('loading');
  const [showActions, setShowActions] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [interactionChoiceMade, setInteractionChoiceMade] = useState(false);

  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const isQRScan = new URLSearchParams(window.location.search).has("wine");
  const isScannedPage = location === "/scanned";

  useEffect(() => {
    const loadWineData = async () => {
      setLoadingState('loading');
      const urlParams = new URLSearchParams(window.location.search);
      const wineIdFromQuery = urlParams.get("wine");
      const wineId = id || wineIdFromQuery || "1";
      if (!wineId) {
        setLoadingState('notfound');
        setWine(null);
        return;
      }
      try {
        const response = await fetch(`/api/wines/${wineId}`);
        if (response.ok) {
          const wineData = await response.json();
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
          setLoadingState('loaded');
        } else if (response.status === 404) {
          setWine(null);
          setLoadingState('notfound');
        } else {
          setWine(null);
          setLoadingState('error');
        }
      } catch (error) {
        setWine(null);
        setLoadingState('error');
      }
    };
    loadWineData();
  }, [id, location]);

  // Detect QR code access and show interaction choice
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isQRAccess =
      urlParams.get("qr") === "true" ||
      urlParams.get("source") === "qr" ||
      document.referrer === "" ||
      !document.referrer.includes(window.location.hostname);

    // Check if user hasn't made interaction choice yet and this appears to be QR access
    if (isQRAccess && !interactionChoiceMade && wine) {
      // Small delay to ensure page is fully loaded before showing modal
      setTimeout(() => {
        setShowQRModal(true);
      }, 500);
    }
  }, [wine, interactionChoiceMade]);

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

  // Optimized scrolling initialization
  useEffect(() => {
    // Streamlined scroll setup
    window.scrollTo(0, 0);
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }, []);

  if (loadingState === 'loading') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p
            style={{
              marginTop: "16px",
              color: "#999999",
              ...typography.body,
            }}
          >
            Loading wine details...
          </p>
        </div>
      </div>
    );
  }
  if (loadingState === 'notfound') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <h2 style={{ color: "#FF6B6B", marginBottom: "16px", ...typography.h1 }}>Wine Not Found</h2>
          <p style={{ ...typography.body, color: "#CECECE" }}>
            The wine you're trying to view doesn't exist or couldn't be loaded.
          </p>
        </div>
      </div>
    );
  }
  if (loadingState === 'error') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <h2 style={{ color: "#FF6B6B", marginBottom: "16px", ...typography.h1 }}>Error</h2>
          <p style={{ ...typography.body, color: "#CECECE" }}>
            Failed to load wine details. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-black text-white"
      style={{ minHeight: "100vh", overflowY: "auto", overflowX: "hidden" }}
    >
      {/* Header - Same as HomeGlobal */}
      <AppHeader />
      <HeaderSpacer />

      {/* Wine Details Hero Section */}
      <WineDetailsHero wine={wine} />

      {/* Tasting Notes */}
      <WineHistorySection description={wine?.description} />

      {/* Food Pairing Section */}
      <FoodPairingSection
        foodPairing={wine?.foodPairing}
        wineId={wine?.id}
        wineName={wine?.name}
      />

      {/* Buy Again Section */}
      <BuyAgainSection buyAgainLink={wine?.buyAgainLink} />

      {/* Wine Recommendations Section */}
      <WineRecommendationsSection currentWineId={wine?.id || 1} />

      {/* Wine Chat Section */}
      <WineChatSection 
        wineId={wine?.id?.toString() || "1"}
        isScannedPage={isScannedPage}
      />

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
