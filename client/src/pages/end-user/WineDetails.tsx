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
  const [showActions, setShowActions] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [interactionChoiceMade, setInteractionChoiceMade] = useState(false);

  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const isQRScan = new URLSearchParams(window.location.search).has("wine");
  const isScannedPage = location === "/scanned";



  useEffect(() => {
    // Initialize data sync manager
    DataSyncManager.initialize();

    // Get wine ID from URL params (either route param or query param)
    const urlParams = new URLSearchParams(window.location.search);
    const wineIdFromQuery = urlParams.get("wine");
    const wineId = id || wineIdFromQuery || "1"; // Default to wine ID 1 if none provided

    console.log("WineDetails: Checking for wine ID:", {
      id,
      wineIdFromQuery,
      wineId,
      location,
    });

    if (wineId && !wine) {
      const wineData = DataSyncManager.getWineById(parseInt(wineId));
      if (wineData) {
        console.log(
          "WineDetails: Looking for wine ID",
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
        console.log(
          "WineDetails: Wine loaded successfully:",
          transformedWine.name,
        );
      } else {
        console.log("WineDetails: Wine not found for ID:", wineId);
      }
    }
  }, [id, wine, location]);

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

  if (!wine) {
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
