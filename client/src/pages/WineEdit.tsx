import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";
import { SimpleQRCode } from "@/components/SimpleQRCode";
import { WINE_CONFIG } from "@shared/wineConfig";
import {
  getCurrentWineConfig,
  getEditableWineData,
  saveEditableWineData,
} from "@/utils/wineDataManager";
import wineBottlePath1 from "@assets/Product Image.png";
import wineBottlePath2 from "@assets/image-2.png";

interface WineCardData {
  id: number;
  name: string;
  year: number;
  bottles: number;
  image: string;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  buyAgainLink: string;
  qrCode: string;
  qrLink: string;
}

const defaultWines: WineCardData[] = [
  {
    id: 1,
    name: WINE_CONFIG.name
      .replace('Ridge "', "")
      .replace('" Dry Creek Zinfandel', ""),
    year: WINE_CONFIG.vintage,
    bottles: 6,
    image: wineBottlePath1,
    ratings: { vn: 95, jd: 93, ws: WINE_CONFIG.ratings.ws, abv: 14.8 },
    buyAgainLink: "https://ridgewine.com/wines/lytton-springs",
    qrCode: "QR_001",
    qrLink: "https://ridgewine.com/qr/001",
  },
  {
    id: 2,
    name: "Geyserville",
    year: 2020,
    bottles: 8,
    image: wineBottlePath2,
    ratings: { vn: 92, jd: 91, ws: 93, abv: 14.5 },
    buyAgainLink: "https://ridgewine.com/wines/geyserville",
    qrCode: "QR_002",
    qrLink: "https://ridgewine.com/qr/002",
  },
];

export default function WineEdit() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const wineId = parseInt(params.id || "1");
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Get wine data from localStorage or use default
  const getStoredWines = (): WineCardData[] => {
    try {
      const stored = localStorage.getItem("adminWineCards");
      return stored ? JSON.parse(stored) : defaultWines;
    } catch {
      return defaultWines;
    }
  };

  const [wine, setWine] = useState<WineCardData>(() => {
    // First try to get from wine data manager for real wine data
    const editableWine = getEditableWineData(wineId);
    console.log(
      "Loading wine data for ID:",
      wineId,
      "Editable wine:",
      editableWine,
    );
    if (editableWine) {
      return editableWine;
    }

    // Fallback to stored wines
    const wines = getStoredWines();
    const fallbackWine = wines.find((w) => w.id === wineId) || wines[0];
    console.log("Using fallback wine:", fallbackWine);
    return fallbackWine;
  });

  // Add scroll listener to detect when page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Clean up the listener when component unmounts
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".dropdown-container")) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showDropdown]);

  const updateWine = (field: keyof WineCardData, value: any) => {
    setWine((prev) => ({ ...prev, [field]: value }));
  };

  const updateWineRating = (ratingType: string, value: number) => {
    setWine((prev) => ({
      ...prev,
      ratings: { ...prev.ratings, [ratingType]: value },
    }));
  };

  const saveWine = () => {
    try {
      // Save to admin wine cards for display purposes
      const wines = getStoredWines();
      const updatedWines = wines.map((w) => (w.id === wine.id ? wine : w));
      localStorage.setItem("adminWineCards", JSON.stringify(updatedWines));

      // Update the actual wine configuration that affects all pages
      saveEditableWineData(wine);

      toast({
        title: "Wine Updated",
        description:
          "Wine details have been saved and will be reflected across all pages.",
      });

      setLocation("/admin-crm");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save wine details.",
      });
    }
  };

  const deleteWine = () => {
    try {
      const wines = getStoredWines();
      const updatedWines = wines.filter((w) => w.id !== wine.id);
      localStorage.setItem("adminWineCards", JSON.stringify(updatedWines));

      toast({
        title: "Wine Deleted",
        description: "Wine has been removed from your collection.",
      });

      setLocation("/admin-crm");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete wine.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Fixed Header with back button navigation */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 transition-all duration-300 ${
          scrolled
            ? "bg-black/90 backdrop-blur-sm border-b border-white/10"
            : "bg-transparent"
        }`}
      >
        <button
          onClick={() => setLocation("/admin-crm")}
          className="header-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-medium text-white text-center flex-1 truncate overflow-hidden whitespace-nowrap">
          Edit Wine
        </h1>
        <div className="relative dropdown-container">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="header-button"
            style={{ padding: "4px" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: "0",
                marginTop: "8px",
                background: "rgba(0, 0, 0, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                minWidth: "140px",
                zIndex: 1000,
              }}
            >
              <button
                onClick={() => {
                  deleteWine();
                  setShowDropdown(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  textAlign: "left",
                  ...typography.body1R,
                }}
                className="hover:bg-red-500/10 transition-colors"
              >
                Delete Wine
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 p-6">
        <div style={{ display: "flex", gap: "20px", marginBottom: "24px" }}>
          {/* Wine Image with Update Button */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              flex: 1,
            }}
          >
            <div
              style={{
                width: "120px",
                height: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
                flexShrink: 0,
              }}
            >
              <img
                src={wine.image}
                alt={wine.name}
                style={{
                  maxHeight: "150px",
                  maxWidth: "110px",
                  width: "auto",
                  height: "auto",
                }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      updateWine("image", event.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: "none" }}
                id="image-upload"
              />
            </div>
            <label
              htmlFor="image-upload"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                borderRadius: "24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...typography.bodyPlus1,
                color: "white",
                fontSize: "12px",
                fontWeight: "400",
                width: "100%",
                height: "40px",
              }}
              className="hover:bg-white/8 transition-colors"
            >
              Update
            </label>
          </div>

          {/* QR Code */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                height: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SimpleQRCode
                value={`${window.location.origin}/wine-scan?id=${wine.id}`}
                size={120}
              />
            </div>
            <div
              onClick={(e) => {
                try {
                  // Find the QR code SVG element specifically within the QR container
                  const clickedElement = e.currentTarget;
                  const qrContainer = clickedElement.parentElement;
                  const qrSvg = qrContainer?.querySelector('svg');
                  
                  if (qrSvg) {
                    // Create a canvas to convert SVG to PNG
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    
                    if (ctx) {
                      // Set canvas size (including padding for white background)
                      canvas.width = 136; // 120 + 16px padding
                      canvas.height = 136; // 120 + 16px padding
                      
                      // Set white background
                      ctx.fillStyle = 'white';
                      ctx.fillRect(0, 0, 136, 136);
                      
                      // Convert SVG to image
                      const svgData = new XMLSerializer().serializeToString(qrSvg);
                      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                      const url = URL.createObjectURL(svgBlob);
                      
                      const img = new Image();
                      img.onload = () => {
                        // Draw the QR code centered with padding
                        ctx.drawImage(img, 8, 8, 120, 120);
                        
                        // Create download link
                        const link = document.createElement("a");
                        link.download = `wine-${wine.id}-qr.png`;
                        link.href = canvas.toDataURL('image/png');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        // Clean up
                        URL.revokeObjectURL(url);
                      };
                      img.src = url;
                    }
                  } else {
                    console.error('QR code SVG not found');
                    alert('Unable to find QR code for download');
                  }
                } catch (error) {
                  console.error('Error downloading QR code:', error);
                  alert('Error downloading QR code');
                }
              }}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                borderRadius: "24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...typography.bodyPlus1,
                color: "white",
                fontSize: "12px",
                fontWeight: "400",
                width: "100%",
                height: "40px",
              }}
              className="hover:bg-white/8 transition-colors"
            >
              Download
            </div>
          </div>
        </div>

        {/* Basic Info - moved below image */}
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <label
              style={{
                ...typography.body1R,
                color: "rgba(255, 255, 255, 0.60)",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Wine Name
            </label>
            <input
              type="text"
              value={wine.name}
              onChange={(e) => updateWine("name", e.target.value)}
              className="contact-form-input"
              style={{
                ...typography.bodyPlus1,
                color: "white !important",
                height: "56px",
                width: "100%",
                fontSize: "16px",
                fontWeight: "400",
                padding: "0 16px",
              }}
              placeholder="Enter wine name"
            />
          </div>

          <div>
            <label
              style={{
                ...typography.body1R,
                color: "rgba(255, 255, 255, 0.60)",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Wine Year
            </label>
            <input
              type="number"
              value={wine.year}
              onChange={(e) => updateWine("year", parseInt(e.target.value))}
              className="contact-form-input"
              style={{
                ...typography.bodyPlus1,
                color: "white !important",
                height: "56px",
                width: "100%",
                fontSize: "16px",
                fontWeight: "400",
                padding: "0 16px",
              }}
              placeholder="Year"
            />
          </div>
        </div>

        {/* Ratings */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "16px",
            }}
          >
            <div>
              <label
                style={{
                  ...typography.body1R,
                  color: "rgba(255, 255, 255, 0.60)",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Vivino (VN)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={wine.ratings.vn}
                onChange={(e) =>
                  updateWineRating("vn", parseInt(e.target.value))
                }
                className="contact-form-input"
                style={{
                  ...typography.num,
                  color: "white !important",
                  height: "56px",
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: "400",
                  padding: "0 16px",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  ...typography.body1R,
                  color: "rgba(255, 255, 255, 0.60)",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                James Halliday (JD)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={wine.ratings.jd}
                onChange={(e) =>
                  updateWineRating("jd", parseInt(e.target.value))
                }
                className="contact-form-input"
                style={{
                  ...typography.num,
                  color: "white !important",
                  height: "56px",
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: "400",
                  padding: "0 16px",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  ...typography.body1R,
                  color: "rgba(255, 255, 255, 0.60)",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Wine Spectator (WS)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={wine.ratings.ws}
                onChange={(e) =>
                  updateWineRating("ws", parseInt(e.target.value))
                }
                className="contact-form-input"
                style={{
                  ...typography.num,
                  color: "white !important",
                  height: "56px",
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: "400",
                  padding: "0 16px",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  ...typography.body1R,
                  color: "rgba(255, 255, 255, 0.60)",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                ABV (%)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={wine.ratings.abv}
                onChange={(e) =>
                  updateWineRating("abv", parseFloat(e.target.value))
                }
                className="contact-form-input"
                style={{
                  ...typography.num,
                  color: "white !important",
                  height: "56px",
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: "400",
                  padding: "0 16px",
                }}
              />
            </div>
          </div>
        </div>

        {/* Buy Again */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              ...typography.body1R,
              color: "rgba(255, 255, 255, 0.60)",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Buy Again Link
          </label>
          <input
            type="url"
            value={wine.buyAgainLink}
            onChange={(e) => updateWine("buyAgainLink", e.target.value)}
            className="contact-form-input"
            style={{
              ...typography.body1R,
              color: "white !important",
              height: "56px",
              width: "100%",
              fontSize: "16px",
              fontWeight: "400",
              padding: "0 16px",
            }}
            placeholder="Enter buy again link"
          />
        </div>

        {/* Wine ID - moved to bottom */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              ...typography.body1R,
              color: "rgba(255, 255, 255, 0.60)",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Wine ID
          </label>
          <span style={{ ...typography.body1R, color: "white" }}>
            {wine.id}
          </span>
        </div>

        {/* Bottom padding to prevent content from being hidden behind fixed button */}
        <div style={{ height: "100px" }}></div>
      </div>

      {/* Fixed Save Button */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          background: "#0A0A0A",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "16px 20px",
          zIndex: 1000,
          boxSizing: "border-box"
        }}
      >
        <button
          onClick={saveWine}
          style={{
            width: "100%",
            height: "56px",
            background: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "32px",
            color: "white",
            ...typography.button,
            cursor: "pointer",
            boxSizing: "border-box",
            margin: 0,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center"
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
