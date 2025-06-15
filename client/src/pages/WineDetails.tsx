import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreHorizontal, Trash2 } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import QRScanModal from '@/components/QRScanModal';
import AppHeader, { HeaderSpacer } from '@/components/AppHeader';
import { DataSyncManager } from '@/utils/dataSync';
import WineBottleImage from '@/components/WineBottleImage';
import USFlagImage from '@/components/USFlagImage';
import WineRating from '@/components/WineRating';
import Button from '@/components/ui/Button';
import typography from '@/styles/typography';

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
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const isQRScan = new URLSearchParams(window.location.search).has('wine');
  const isScannedPage = location === '/scanned';

  // Helper functions for wine data
  const getWineHistory = () => {
    return (
      wine?.description ||
      "Lytton Springs is a renowned single-vineyard red wine produced by Ridge Vineyards, located in the Dry Creek Valley of Sonoma County, California. Celebrated for its rich heritage and distinctive field-blend style, Lytton Springs has become a benchmark for Zinfandel-based wines in the United States."
    );
  };

  const getFoodPairingContent = () => {
    return {
      dishes: wine?.foodPairing || [
        "Grilled lamb",
        "BBQ ribs",
        "Aged cheddar",
        "Dark chocolate desserts",
      ],
    };
  };

  const getCheesePairingContent = () => {
    return {
      cheeses: ["Aged Gouda", "Manchego", "Aged Cheddar", "Pecorino Romano"],
    };
  };

  const getVegetarianPairingContent = () => {
    return {
      dishes: [
        "Roasted eggplant",
        "Mushroom risotto",
        "Grilled portobello",
        "Vegetarian lasagna",
      ],
    };
  };

  const getAvoidPairingContent = () => {
    return {
      items: [
        "Delicate fish",
        "Light salads",
        "Citrus-based dishes",
        "Spicy Asian cuisine",
      ],
    };
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

      {/* Wine bottle image with fixed size and glow effect - fullscreen height from top */}
      <div
        className="w-full flex flex-col items-center justify-center py-8 relative"
        style={{
          minHeight: "100vh", // Make the div full screen height
        }}
      >
        {/* Wine bottle image - THIS CONTAINS THE BLURRED CIRCLE/GLOW EFFECT */}
        <WineBottleImage image={wine?.image} wineName={wine?.name} />

        {/* Wine name with typography styling */}
        <div
          style={{
            width: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            color: "white",
            wordWrap: "break-word",
            position: "relative",
            zIndex: 2,
            padding: "0 20px",
            marginBottom: "20px",
            ...typography.h1,
          }}
        >
          {wine ? `${wine.year ? wine.year + ' ' : '2021 '}${wine.name}` : `2021 Wine Name`}
        </div>

        {/* Wine region with typography styling and flag */}
        <div
          style={{
            textAlign: "left",
            justifyContent: "flex-start",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            color: "rgba(255, 255, 255, 0.60)",
            wordWrap: "break-word",
            position: "relative",
            zIndex: 2,
            padding: "0 20px",
            gap: "6px",
            marginBottom: "20px",
            ...typography.body1R,
          }}
        >
          <USFlagImage />
          <span>
            {wine?.location ||
              "Santa Cruz Mountains | California | United States"}
          </span>
        </div>

        {/* Wine ratings section */}
        <WineRating
          ratings={wine ? wine.ratings : { vn: 95, jd: 93, ws: 93, abv: 14.3 }}
          align="left"
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0 20px",
            marginBottom: "32px",
          }}
        />

        {/* Historic Heritage Section - Moved below ratings */}
        <div
          style={{
            width: "100%",
            padding: "0 20px",
            marginBottom: "32px",
          }}
        >
          <h1
            style={{
              ...typography.h1,
              color: "white",
              marginBottom: "16px",
              textAlign: "left",
            }}
          >
            History
          </h1>
          <p
            style={{
              color: "white",
              textAlign: "left",
              marginBottom: "16px",
              ...typography.body,
            }}
          >
            {getWineHistory()}
          </p>
        </div>

        {/* Food Pairing Section */}
        <div
          style={{
            width: "100%",
            padding: "0 20px",
            marginBottom: "20px",
          }}
        >
          <h1
            style={{
              ...typography.h1,
              color: "white",
              marginBottom: "24px",
              textAlign: "left",
            }}
          >
            Food pairing
          </h1>

          {/* Red Meat Pairing - Expandable */}
          <div
            onClick={() => {
              setExpandedItem(expandedItem === "redMeat" ? null : "redMeat");
            }}
            style={{
              backgroundColor: "#191919",
              borderRadius: "16px",
              padding: "0 20px",
              minHeight: "64px",
              marginBottom: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignSelf: "stretch",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {/* Header row - always visible */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                minHeight: "64px",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "24px" }}>🥩</span>
                <span
                  style={{
                    color: "white",
                    ...typography.body,
                  }}
                >
                  Red Meat
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    color: "black",
                    backgroundColor: "#e0e0e0",
                    padding: "6px 14px",
                    borderRadius: "999px",
                    ...typography.buttonPlus1,
                  }}
                >
                  Perfect match
                </span>
                {/* Rotating chevron icon for expanded state */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    transform:
                      expandedItem === "redMeat"
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <path
                    d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06"
                    fill="white"
                  />
                </svg>
              </div>
            </div>

            {/* Expanded content - only visible when expanded */}
            {expandedItem === "redMeat" && (
              <div
                style={{
                  padding: "0 0 20px 0",
                  color: "white",
                  ...typography.body,
                }}
              >
                <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                  {getFoodPairingContent().dishes.map(
                    (dish: string, index: number) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ ...typography.body }}>🥩</span>
                        <span style={{ ...typography.body }}>{dish}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cheese Pairings - Expandable */}
          <div
            onClick={() => {
              setExpandedItem(expandedItem === "cheese" ? null : "cheese");
            }}
            style={{
              backgroundColor: "#191919",
              borderRadius: "16px",
              padding: "0 20px",
              minHeight: "64px",
              marginBottom: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignSelf: "stretch",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                minHeight: "64px",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "24px" }}>🧀</span>
                <span style={{ color: "white", ...typography.body }}>
                  Cheese Pairings
                </span>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  transform:
                    expandedItem === "cheese"
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              >
                <path
                  d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06"
                  fill="white"
                />
              </svg>
            </div>

            {/* Expanded content */}
            {expandedItem === "cheese" && (
              <div
                style={{
                  padding: "0 0 20px 0",
                  color: "white",
                  ...typography.body,
                }}
              >
                <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                  {getCheesePairingContent().cheeses.map(
                    (cheese: string, index: number) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ ...typography.body }}>🧀</span>
                        <span style={{ ...typography.body }}>{cheese}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Vegetarian Options - Expandable */}
          <div
            onClick={() => {
              setExpandedItem(
                expandedItem === "vegetarian" ? null : "vegetarian",
              );
            }}
            style={{
              backgroundColor: "#191919",
              borderRadius: "16px",
              padding: "0 20px",
              minHeight: "64px",
              marginBottom: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignSelf: "stretch",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                minHeight: "64px",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "24px" }}>🥗</span>
                <span style={{ color: "white", ...typography.body }}>
                  Vegetarian Options
                </span>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  transform:
                    expandedItem === "vegetarian"
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              >
                <path
                  d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06"
                  fill="white"
                />
              </svg>
            </div>

            {/* Expanded content */}
            {expandedItem === "vegetarian" && (
              <div
                style={{
                  padding: "0 0 20px 0",
                  color: "white",
                  ...typography.body,
                }}
              >
                <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                  {getVegetarianPairingContent().dishes.map(
                    (dish: string, index: number) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ ...typography.body }}>🥗</span>
                        <span style={{ ...typography.body }}>{dish}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dishes to Avoid - Expandable */}
          <div
            onClick={() => {
              setExpandedItem(expandedItem === "avoid" ? null : "avoid");
            }}
            style={{
              backgroundColor: "#191919",
              borderRadius: "16px",
              padding: "0 20px",
              minHeight: "64px",
              marginBottom: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignSelf: "stretch",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                minHeight: "64px",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "24px" }}>❌</span>
                <span style={{ color: "white", ...typography.body }}>
                  Avoid
                </span>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  transform:
                    expandedItem === "avoid" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              >
                <path
                  d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06"
                  fill="white"
                />
              </svg>
            </div>

            {/* Expanded content */}
            {expandedItem === "avoid" && (
              <div
                style={{
                  padding: "0 0 20px 0",
                  color: "white",
                  ...typography.body,
                }}
              >
                <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                  {getAvoidPairingContent().items.map(
                    (item: string, index: number) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ ...typography.body }}>❌</span>
                        <span style={{ ...typography.body }}>{item}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Want more? Section */}
        <div
          style={{
            width: "100%",
            padding: "0 20px",
            marginBottom: "32px",
          }}
        >
          <h1
            style={{
              ...typography.h1,
              color: "white",
              marginBottom: "16px",
              textAlign: "left",
            }}
          >
            Want more?
          </h1>
          <Button
            onClick={() => {
              if (wine?.buyAgainLink) {
                window.open(wine.buyAgainLink, "_blank");
              }
            }}
            variant="primary"
            style={{
              backgroundColor: "white",
              color: "black",
              border: "none",
              padding: "16px 32px",
              borderRadius: "12px",
              width: "100%",
              ...typography.buttonPlus1,
            }}
          >
            Buy again
          </Button>
        </div>

        {/* We recommend section */}
        <div
          style={{
            width: "100%",
            padding: "0 20px",
            marginBottom: "32px",
          }}
        >
          <h1
            style={{
              ...typography.h1,
              color: "white",
              marginBottom: "24px",
              textAlign: "left",
            }}
          >
            We recommend
          </h1>

          {/* Wine Recommendation Cards - Horizontal Scroll */}
          <div
            className="wine-recommendations-container"
            style={{
              display: "flex",
              gap: "16px",
              overflowX: "auto",
              paddingBottom: "8px",
              paddingLeft: "4px",
              paddingRight: "4px",
              marginLeft: "-4px",
              marginRight: "-4px",
            }}
          >
            {(() => {
              const adminWines = JSON.parse(
                localStorage.getItem("admin-wines") || "[]",
              );
              const currentWineId = wine?.id;
              const filteredWines = adminWines.filter(
                (wine: any) => wine.id !== currentWineId,
              );

              if (filteredWines.length === 0) {
                return (
                  <div
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderRadius: "16px",
                      padding: "32px",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.8)",
                        marginBottom: "8px",
                        ...typography.body,
                      }}
                    >
                      No other wines available
                    </span>
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.6)",
                        ...typography.body1R,
                      }}
                    >
                      Add more wines in the admin panel to see recommendations
                    </span>
                  </div>
                );
              }

              return filteredWines.map((recommendedWine: any) => (
                <div
                  key={recommendedWine.id}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    padding: "16px 16px 24px 16px",
                    width: "208px",
                    minWidth: "208px",
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.08)";
                  }}
                  onClick={() => {
                    if (recommendedWine.id) {
                      // Navigate to the wine details page
                      window.location.href = `/wine-details/${recommendedWine.id}`;
                    }
                  }}
                >
                  {/* Wine Bottle Image */}
                  <div
                    style={{
                      width: "120px",
                      height: "200px",
                      backgroundImage: recommendedWine.image
                        ? `url('${recommendedWine.image}')`
                        : "none",
                      backgroundColor: "transparent",
                      backgroundSize: "contain",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      marginBottom: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {!recommendedWine.image && (
                      <span
                        style={{
                          color: "rgba(255, 255, 255, 0.6)",
                          textAlign: "center",
                          ...typography.body1M,
                        }}
                      >
                        No Image
                      </span>
                    )}
                  </div>

                  {/* Wine Name */}
                  <h2
                    style={{
                      ...typography.buttonPlus1,
                      color: "white",
                      textAlign: "center",
                      margin: "0 0 12px 0",
                      height: "50px",
                      width: "100%",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 3,
                      lineHeight: "1.2",
                    }}
                  >
                    {recommendedWine.year ? `${recommendedWine.year} ` : ""}
                    {recommendedWine.name}
                  </h2>

                  {/* Rating Badges */}
                  {recommendedWine.ratings && (
                    <WineRating
                      ratings={recommendedWine.ratings}
                      gap={15}
                      hideAbv={true}
                    />
                  )}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Enhanced Chat Interface */}
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