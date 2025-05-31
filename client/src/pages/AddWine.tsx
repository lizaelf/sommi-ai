import React, { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";
import { DataSyncManager, type UnifiedWineData } from "@/utils/dataSync";
import placeholderImage from "@assets/Placeholder.png";

export default function AddWine() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [wine, setWine] = useState<UnifiedWineData>({
    id: 0, // Will be set when saving
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
    qrCode: "",
    qrLink: ""
  });

  const updateWine = (field: keyof UnifiedWineData, value: any) => {
    setWine(prev => ({ ...prev, [field]: value }));
  };

  const updateRating = (ratingType: keyof UnifiedWineData['ratings'], value: number) => {
    setWine(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [ratingType]: value }
    }));
  };

  const saveWine = () => {
    try {
      // Validate wine data
      if (!wine.name || wine.name.trim() === '') {
        throw new Error('Wine name is required');
      }

      // Generate new ID
      const existingWines = DataSyncManager.getUnifiedWineData();
      const newWineId = existingWines.length > 0 ? Math.max(...existingWines.map(w => w.id)) + 1 : 1;
      
      const newWine: UnifiedWineData = {
        ...wine,
        id: newWineId,
        qrCode: `QR_${newWineId.toString().padStart(3, '0')}`,
        qrLink: wine.qrLink || `${window.location.origin}/wine-details/${newWineId}`
      };

      // Save to unified data system
      DataSyncManager.addOrUpdateWine(newWine);

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
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-black/90 backdrop-blur-sm border-b border-white/10">
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
        <Button onClick={saveWine} disabled={!wine.name.trim()}>
          Save
        </Button>
      </div>

      {/* Content */}
      <div style={{ paddingTop: "88px", padding: "16px" }}>
        {/* Wine Image */}
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <div style={{
            width: "120px",
            height: "150px",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#191919",
            borderRadius: "8px"
          }}>
            <img
              src={wine.image && wine.image.trim() !== "" ? wine.image : placeholderImage}
              alt="Wine"
              style={{
                maxHeight: "140px",
                maxWidth: "110px",
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
            placeholder="Image URL (optional)"
            style={{
              ...typography.body1R,
              color: "white !important",
              height: "56px",
              width: "100%",
              fontSize: "16px",
              fontWeight: "400",
              padding: "0 16px",
              marginBottom: "8px"
            }}
          />
        </div>

        {/* Wine Name */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            ...typography.body1R,
            color: "rgba(255, 255, 255, 0.60)",
            display: "block",
            marginBottom: "8px",
          }}>
            Wine Name *
          </label>
          <input
            type="text"
            value={wine.name}
            onChange={(e) => updateWine("name", e.target.value)}
            className="contact-form-input"
            placeholder="Enter wine name"
            style={{
              ...typography.body1R,
              color: "white !important",
              height: "56px",
              width: "100%",
              fontSize: "16px",
              fontWeight: "400",
              padding: "0 16px",
            }}
            required
          />
        </div>

        {/* Year */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            ...typography.body1R,
            color: "rgba(255, 255, 255, 0.60)",
            display: "block",
            marginBottom: "8px",
          }}>
            Vintage Year
          </label>
          <input
            type="number"
            value={wine.year}
            onChange={(e) => updateWine("year", parseInt(e.target.value) || 0)}
            className="contact-form-input"
            placeholder="2021"
            min="1800"
            max={new Date().getFullYear()}
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

        {/* Bottles */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            ...typography.body1R,
            color: "rgba(255, 255, 255, 0.60)",
            display: "block",
            marginBottom: "8px",
          }}>
            Number of Bottles
          </label>
          <input
            type="number"
            value={wine.bottles}
            onChange={(e) => updateWine("bottles", parseInt(e.target.value) || 0)}
            className="contact-form-input"
            placeholder="0"
            min="0"
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

        {/* Ratings */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            ...typography.body1R,
            color: "rgba(255, 255, 255, 0.60)",
            display: "block",
            marginBottom: "16px",
          }}>
            Ratings
          </label>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", marginBottom: "4px", display: "block" }}>
                Vivino
              </label>
              <input
                type="number"
                value={wine.ratings.vn}
                onChange={(e) => updateRating("vn", parseFloat(e.target.value) || 0)}
                className="contact-form-input"
                placeholder="95"
                min="0"
                max="100"
                step="0.1"
                style={{
                  ...typography.body1R,
                  color: "white !important",
                  height: "48px",
                  width: "100%",
                  fontSize: "14px",
                  padding: "0 12px",
                }}
              />
            </div>
            
            <div>
              <label style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", marginBottom: "4px", display: "block" }}>
                James Dunnuck
              </label>
              <input
                type="number"
                value={wine.ratings.jd}
                onChange={(e) => updateRating("jd", parseFloat(e.target.value) || 0)}
                className="contact-form-input"
                placeholder="93"
                min="0"
                max="100"
                step="0.1"
                style={{
                  ...typography.body1R,
                  color: "white !important",
                  height: "48px",
                  width: "100%",
                  fontSize: "14px",
                  padding: "0 12px",
                }}
              />
            </div>
            
            <div>
              <label style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", marginBottom: "4px", display: "block" }}>
                Wine Spectator
              </label>
              <input
                type="number"
                value={wine.ratings.ws}
                onChange={(e) => updateRating("ws", parseFloat(e.target.value) || 0)}
                className="contact-form-input"
                placeholder="92"
                min="0"
                max="100"
                step="0.1"
                style={{
                  ...typography.body1R,
                  color: "white !important",
                  height: "48px",
                  width: "100%",
                  fontSize: "14px",
                  padding: "0 12px",
                }}
              />
            </div>
            
            <div>
              <label style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", marginBottom: "4px", display: "block" }}>
                ABV %
              </label>
              <input
                type="number"
                value={wine.ratings.abv}
                onChange={(e) => updateRating("abv", parseFloat(e.target.value) || 0)}
                className="contact-form-input"
                placeholder="14.8"
                min="0"
                max="20"
                step="0.1"
                style={{
                  ...typography.body1R,
                  color: "white !important",
                  height: "48px",
                  width: "100%",
                  fontSize: "14px",
                  padding: "0 12px",
                }}
              />
            </div>
          </div>
        </div>

        {/* Buy Again Link */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            ...typography.body1R,
            color: "rgba(255, 255, 255, 0.60)",
            display: "block",
            marginBottom: "8px",
          }}>
            Buy Again Link
          </label>
          <input
            type="url"
            value={wine.buyAgainLink}
            onChange={(e) => updateWine("buyAgainLink", e.target.value)}
            className="contact-form-input"
            placeholder="https://winery.com/wine"
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

        {/* QR Link */}
        <div style={{ marginBottom: "32px" }}>
          <label style={{
            ...typography.body1R,
            color: "rgba(255, 255, 255, 0.60)",
            display: "block",
            marginBottom: "8px",
          }}>
            Website Link (QR Code Destination)
          </label>
          <input
            type="url"
            value={wine.qrLink}
            onChange={(e) => updateWine("qrLink", e.target.value)}
            className="contact-form-input"
            placeholder={`${window.location.origin}/wine-details/[ID]`}
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
      </div>
    </div>
  );
}