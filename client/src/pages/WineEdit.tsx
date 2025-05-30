import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import Button from '@/components/ui/Button';
import typography from '@/styles/typography';
import { SimpleQRCode } from '@/components/SimpleQRCode';
import { WINE_CONFIG } from '@shared/wineConfig';
import { getCurrentWineConfig, getEditableWineData, saveEditableWineData } from '@/utils/wineDataManager';
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
    name: WINE_CONFIG.name.replace('Ridge "', '').replace('" Dry Creek Zinfandel', ''),
    year: WINE_CONFIG.vintage,
    bottles: 6,
    image: wineBottlePath1,
    ratings: { vn: 95, jd: 93, ws: WINE_CONFIG.ratings.ws, abv: 14.8 },
    buyAgainLink: "https://ridgewine.com/wines/lytton-springs",
    qrCode: "QR_001",
    qrLink: "https://ridgewine.com/qr/001"
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
    qrLink: "https://ridgewine.com/qr/002"
  }
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
      const stored = localStorage.getItem('adminWineCards');
      return stored ? JSON.parse(stored) : defaultWines;
    } catch {
      return defaultWines;
    }
  };

  const [wine, setWine] = useState<WineCardData>(() => {
    // First try to get from wine data manager for real wine data
    const editableWine = getEditableWineData(wineId);
    console.log('Loading wine data for ID:', wineId, 'Editable wine:', editableWine);
    if (editableWine) {
      return editableWine;
    }
    
    // Fallback to stored wines
    const wines = getStoredWines();
    const fallbackWine = wines.find(w => w.id === wineId) || wines[0];
    console.log('Using fallback wine:', fallbackWine);
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
    
    window.addEventListener('scroll', handleScroll);
    
    // Clean up the listener when component unmounts
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  const updateWine = (field: keyof WineCardData, value: any) => {
    setWine(prev => ({ ...prev, [field]: value }));
  };

  const updateWineRating = (ratingType: string, value: number) => {
    setWine(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [ratingType]: value }
    }));
  };

  const saveWine = () => {
    try {
      // Save to admin wine cards for display purposes
      const wines = getStoredWines();
      const updatedWines = wines.map(w => w.id === wine.id ? wine : w);
      localStorage.setItem('adminWineCards', JSON.stringify(updatedWines));
      
      // Update the actual wine configuration that affects all pages
      saveEditableWineData(wine);
      
      toast({
        title: "Wine Updated",
        description: "Wine details have been saved and will be reflected across all pages.",
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
      const updatedWines = wines.filter(w => w.id !== wine.id);
      localStorage.setItem('adminWineCards', JSON.stringify(updatedWines));
      
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
          style={{
            background: "none",
            border: "none",
            padding: "0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
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
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1 className="text-lg font-medium text-white text-left flex-1 truncate overflow-hidden whitespace-nowrap">Edit Wine</h1>
        <div className="relative dropdown-container">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              background: "none",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
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
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
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
                zIndex: 1000
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
                  ...typography.body1R
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
        <div className="max-w-2xl mx-auto">
          <div style={{ display: "flex", gap: "20px", marginBottom: "24px" }}>
            {/* Wine Image */}
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
                position: "relative",
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
                      updateWine('image', event.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: "none" }}
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                style={{
                  position: "absolute",
                  bottom: "4px",
                  right: "4px",
                  background: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "4px",
                  padding: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                className="hover:bg-white transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="black">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                </svg>
              </label>
            </div>

            {/* Basic Info */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <span style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", display: "block", marginBottom: "8px" }}>
                  Wine ID: {wine.id}
                </span>
              </div>
              
              <div>
                <label style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", display: "block", marginBottom: "8px" }}>
                  Wine Name
                </label>
                <input
                  type="text"
                  value={wine.name}
                  onChange={(e) => updateWine('name', e.target.value)}
                  className="contact-form-input"
                  style={{ 
                    ...typography.bodyPlus1, 
                    color: "white !important", 
                    height: "56px",
                    width: "100%",
                    fontSize: "16px",
                    fontWeight: "400",
                    padding: "0 16px"
                  }}
                  placeholder="Enter wine name"
                />
              </div>

              <div>
                <label style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", display: "block", marginBottom: "8px" }}>
                  Wine Year
                </label>
                <input
                  type="number"
                  value={wine.year}
                  onChange={(e) => updateWine('year', parseInt(e.target.value))}
                  className="contact-form-input"
                  style={{ 
                    ...typography.bodyPlus1, 
                    color: "white !important", 
                    height: "56px",
                    width: "120px",
                    fontSize: "16px",
                    fontWeight: "400",
                    padding: "0 16px"
                  }}
                  placeholder="Year"
                />
              </div>
            </div>
          </div>

          {/* Ratings */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ ...typography.h1, color: "white", marginBottom: "16px" }}>Ratings</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
              <div>
                <label style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", display: "block", marginBottom: "8px" }}>
                  Vivino (VN)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={wine.ratings.vn}
                  onChange={(e) => updateWineRating('vn', parseInt(e.target.value))}
                  className="contact-form-input"
                  style={{ 
                    ...typography.num, 
                    color: "white !important", 
                    height: "56px",
                    width: "100%",
                    fontSize: "16px",
                    fontWeight: "400",
                    padding: "0 16px"
                  }}
                />
              </div>
              <div>
                <label style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", display: "block", marginBottom: "8px" }}>
                  James Halliday (JD)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={wine.ratings.jd}
                  onChange={(e) => updateWineRating('jd', parseInt(e.target.value))}
                  className="contact-form-input"
                  style={{ 
                    ...typography.num, 
                    color: "white !important", 
                    height: "56px",
                    width: "100%",
                    fontSize: "16px",
                    fontWeight: "400",
                    padding: "0 16px"
                  }}
                />
              </div>
              <div>
                <label style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", display: "block", marginBottom: "8px" }}>
                  Wine Spectator (WS)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={wine.ratings.ws}
                  onChange={(e) => updateWineRating('ws', parseInt(e.target.value))}
                  className="contact-form-input"
                  style={{ 
                    ...typography.num, 
                    color: "white !important", 
                    height: "56px",
                    width: "100%",
                    fontSize: "16px",
                    fontWeight: "400",
                    padding: "0 16px"
                  }}
                />
              </div>
              <div>
                <label style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", display: "block", marginBottom: "8px" }}>
                  ABV (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={wine.ratings.abv}
                  onChange={(e) => updateWineRating('abv', parseFloat(e.target.value))}
                  className="contact-form-input"
                  style={{ 
                    ...typography.num, 
                    color: "white !important", 
                    height: "56px",
                    width: "100%",
                    fontSize: "16px",
                    fontWeight: "400",
                    padding: "0 16px"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Buy Again */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ ...typography.h1, color: "white", marginBottom: "16px" }}>Buy again</h3>
            <label style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", display: "block", marginBottom: "8px" }}>
              Buy Again Link
            </label>
            <input
              type="url"
              value={wine.buyAgainLink}
              onChange={(e) => updateWine('buyAgainLink', e.target.value)}
              className="contact-form-input"
              style={{ 
                ...typography.body1R, 
                color: "white !important", 
                height: "56px",
                width: "100%",
                fontSize: "16px",
                fontWeight: "400",
                padding: "0 16px"
              }}
              placeholder="Enter buy again link"
            />
          </div>

          {/* QR Code */}
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ ...typography.h1, color: "white", marginBottom: "16px" }}>QR Code</h3>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <SimpleQRCode 
                value={`${window.location.origin}/wine-scan?id=${wine.id}`}
                size={120}
              />
              <div>
                <div style={{ 
                  ...typography.body1R, 
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "12px",
                  wordBreak: "break-all",
                  maxWidth: "300px"
                }}>
                  {`${window.location.origin}/wine-scan?id=${wine.id}`}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "16px" }}>
            <Button onClick={saveWine} style={{ flex: 1 }}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}