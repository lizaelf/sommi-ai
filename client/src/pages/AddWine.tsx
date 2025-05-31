import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";
import { SimpleQRCode } from "@/components/SimpleQRCode";
import { DataSyncManager, type UnifiedWineData } from "@/utils/dataSync";
import placeholderImage from "@assets/Placeholder.png";

// Use unified wine data interface
type WineCardData = UnifiedWineData;

export default function AddWine() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [wine, setWine] = useState<WineCardData>(() => {
    // Generate new ID for new wine
    const existingWines = DataSyncManager.getUnifiedWineData();
    const newWineId = existingWines.length > 0 ? Math.max(...existingWines.map(w => w.id)) + 1 : 1;
    
    return {
      id: newWineId,
      name: "",
      year: new Date().getFullYear(),
      bottles: 0,
      image: "",
      ratings: {
        vn: 0,
        jd: 0,
        ws: 0,
        abv: 0
      },
      buyAgainLink: "",
      qrCode: `QR_${newWineId.toString().padStart(3, '0')}`,
      qrLink: `${window.location.origin}/wine-details/${newWineId}`
    };
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const updateWine = (field: keyof WineCardData, value: any) => {
    setWine(prev => ({ ...prev, [field]: value }));
  };

  const updateRating = (ratingType: keyof WineCardData['ratings'], value: number) => {
    setWine(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [ratingType]: value }
    }));
  };

  const saveWine = () => {
    try {
      console.log('Starting wine save process for:', wine);
      
      // Validate wine data
      if (!wine.name || wine.name.trim() === '') {
        throw new Error('Wine name is required');
      }
      
      if (!wine.id || isNaN(wine.id)) {
        throw new Error('Invalid wine ID');
      }
      
      // Save to unified data system
      DataSyncManager.addOrUpdateWine(wine);
      console.log('Successfully saved to unified data system');

      toast({
        description: (
          <span
            style={{
              ...typography.body1R,
              color: "black",
              fontSize: "14px",
              fontWeight: "400",
            }}
          >
            Wine added successfully
          </span>
        ),
        duration: 2000,
        className: "bg-white text-black border-none",
        style: {
          position: "fixed",
          top: "74px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "auto",
          maxWidth: "none",
          padding: "8px 24px",
          borderRadius: "32px",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
          zIndex: 9999,
        },
      });

      // Navigate back to AdminCRM
      setLocation("/admin-crm");

    } catch (error) {
      console.error('Error saving wine:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "An error occurred while saving the wine.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
        style={{
          backgroundColor: scrolled ? "rgba(0, 0, 0, 0.8)" : "transparent",
          backdropFilter: scrolled ? "blur(10px)" : "none",
          transition: "all 0.3s ease",
          padding: "16px",
          borderBottom: scrolled
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "none",
        }}
      >
        <button
          onClick={() => setLocation("/admin-crm")}
          style={{
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "400",
          }}
        >
          ← Back
        </button>
        <h1 className="text-lg font-medium text-white">Add New Wine</h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={saveWine}
            style={{
              backgroundColor: "#007AFF",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "14px",
              fontWeight: "500",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingTop: "88px", padding: "16px" }}>
        {/* Wine Image Upload */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              ...typography.body1R,
              color: "rgba(255, 255, 255, 0.60)",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Wine Image
          </label>
          <div
            style={{
              width: "100%",
              height: "200px",
              border: "2px dashed rgba(255, 255, 255, 0.3)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#191919",
              marginBottom: "8px",
            }}
          >
            <img
              src={wine.image && wine.image.trim() !== "" ? wine.image : placeholderImage}
              alt="Wine"
              style={{
                maxHeight: "180px",
                maxWidth: "150px",
                width: "auto",
                height: "auto",
              }}
            />
          </div>
          <input
            type="url"
            value={wine.image}
            onChange={(e) => updateWine("image", e.target.value)}
            className="contact-form-input"
            placeholder="Image URL"
            style={{
              ...typography.body1R,
              color: "white !important",
              height: "56px",
              width: "100%",
              fontSize: "16px",
              fontWeight: "400",
              padding: "0 16px",
            }}
          />
        </div>

        {/* Wine Name */}
        <div style={{ marginBottom: "24px" }}>
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
              ...typography.body1R,
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

        {/* Year */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              ...typography.body1R,
              color: "rgba(255, 255, 255, 0.60)",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Year
          </label>
          <input
            type="number"
            value={wine.year}
            onChange={(e) => updateWine("year", parseInt(e.target.value) || 0)}
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
            placeholder="2021"
          />
        </div>

        {/* Bottles */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              ...typography.body1R,
              color: "rgba(255, 255, 255, 0.60)",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Bottles
          </label>
          <input
            type="number"
            value={wine.bottles}
            onChange={(e) => updateWine("bottles", parseInt(e.target.value) || 0)}
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
            placeholder="Number of bottles"
          />
        </div>

        {/* Ratings Section */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              ...typography.body1R,
              color: "rgba(255, 255, 255, 0.60)",
              display: "block",
              marginBottom: "16px",
            }}
          >
            Ratings
          </label>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* VN Rating */}
            <div>
              <label
                style={{
                  ...typography.body1R,
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "14px",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                VN
              </label>
              <input
                type="number"
                value={wine.ratings.vn}
                onChange={(e) => updateRating("vn", parseFloat(e.target.value) || 0)}
                className="contact-form-input"
                style={{
                  ...typography.body1R,
                  color: "white !important",
                  height: "48px",
                  width: "100%",
                  fontSize: "14px",
                  fontWeight: "400",
                  padding: "0 12px",
                }}
                placeholder="95"
              />
            </div>

            {/* JD Rating */}
            <div>
              <label
                style={{
                  ...typography.body1R,
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "14px",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                JD
              </label>
              <input
                type="number"
                value={wine.ratings.jd}
                onChange={(e) => updateRating("jd", parseFloat(e.target.value) || 0)}
                className="contact-form-input"
                style={{
                  ...typography.body1R,
                  color: "white !important",
                  height: "48px",
                  width: "100%",
                  fontSize: "14px",
                  fontWeight: "400",
                  padding: "0 12px",
                }}
                placeholder="93"
              />
            </div>

            {/* WS Rating */}
            <div>
              <label
                style={{
                  ...typography.body1R,
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "14px",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                WS
              </label>
              <input
                type="number"
                value={wine.ratings.ws}
                onChange={(e) => updateRating("ws", parseFloat(e.target.value) || 0)}
                className="contact-form-input"
                style={{
                  ...typography.body1R,
                  color: "white !important",
                  height: "48px",
                  width: "100%",
                  fontSize: "14px",
                  fontWeight: "400",
                  padding: "0 12px",
                }}
                placeholder="92"
              />
            </div>

            {/* ABV Rating */}
            <div>
              <label
                style={{
                  ...typography.body1R,
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "14px",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                ABV
              </label>
              <input
                type="number"
                value={wine.ratings.abv}
                onChange={(e) => updateRating("abv", parseFloat(e.target.value) || 0)}
                className="contact-form-input"
                style={{
                  ...typography.body1R,
                  color: "white !important",
                  height: "48px",
                  width: "100%",
                  fontSize: "14px",
                  fontWeight: "400",
                  padding: "0 12px",
                }}
                placeholder="14.8"
              />
            </div>
          </div>
        </div>

        {/* Buy Again Link */}
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
            placeholder="https://winery.com/wine"
          />
        </div>

        {/* Website Link (QR Code Destination) */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              ...typography.body1R,
              color: "rgba(255, 255, 255, 0.60)",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Website Link (QR Code Goes Here)
          </label>
          <input
            type="url"
            value={wine.qrLink && wine.qrLink.includes('/wine-details/') ? wine.qrLink : `${window.location.origin}/wine-details/${wine.id}`}
            onChange={(e) => updateWine("qrLink", e.target.value)}
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
            placeholder={`${window.location.origin}/wine-details/${wine.id}`}
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

        {/* QR Code Display */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              ...typography.body1R,
              color: "rgba(255, 255, 255, 0.60)",
              display: "block",
              marginBottom: "8px",
            }}
          >
            QR Code Preview
          </label>
          <div
            style={{
              padding: "16px",
              backgroundColor: "#191919",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <SimpleQRCode 
              value={wine.qrLink || `${window.location.origin}/wine-details/${wine.id}`} 
              size={120} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}