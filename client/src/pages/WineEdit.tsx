import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";
import { SimpleQRCode } from "@/components/SimpleQRCode";
import { WINE_CONFIG } from "@shared/wineConfig";
import { DataSyncManager, type UnifiedWineData } from "@/utils/dataSync";
import { getCurrentWineConfig } from "@/utils/wineDataManager";
import { 
  wineImageDeduplication, 
  validateImageFile, 
  generateUniqueFilename 
} from "@/utils/imageDeduplication";
// Default images removed - only authentic uploaded images will be displayed
import placeholderImage from "@assets/Placeholder.png";

// Use unified wine data interface
type WineCardData = UnifiedWineData;

const getCRMWines = (): WineCardData[] => {
  return DataSyncManager.getUnifiedWineData();
};

export default function WineEdit() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const wineId = parseInt(params.id || "1");
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Check if this is a new wine being added
  const isNewWine = new URLSearchParams(window.location.search).get('new') === 'true';

  // Get wine data from CRM storage
  const getStoredWines = (): WineCardData[] => {
    try {
      return getCRMWines();
    } catch {
      return [];
    }
  };

  const [wine, setWine] = useState<WineCardData>(() => {
    // If this is a new wine, create empty wine data
    if (isNewWine) {
      return {
        id: wineId,
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
        qrCode: `QR_${wineId.toString().padStart(3, '0')}`,
        qrLink: `${window.location.origin}/wine-details/${wineId}`
      };
    }
    
    // Get wine from unified data system
    const editableWine = DataSyncManager.getWineById(wineId);
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
    
    // If no wine found, create a default one to prevent errors
    if (!fallbackWine) {
      return {
        id: wineId,
        name: "",
        year: new Date().getFullYear(),
        bottles: 0,
        image: "",
        ratings: { vn: 0, jd: 0, ws: 0, abv: 0 },
        buyAgainLink: "",
        qrCode: `QR_${String(wineId).padStart(3, '0')}`,
        qrLink: ""
      };
    }
    
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

  const updateWine = (field: string, value: any) => {
    const updatedWine = { ...wine, [field]: value };
    setWine(updatedWine);
    
    // Auto-save to unified system when image is updated to ensure sync
    if (field === 'image') {
      console.log('Auto-saving wine image to unified system:', updatedWine.id);
      DataSyncManager.addOrUpdateWine(updatedWine);
    }
  };

  const updateWineRating = (ratingType: string, value: number) => {
    setWine((prev) => ({
      ...prev,
      ratings: { ...prev.ratings, [ratingType]: value },
    }));
  };

  const saveWine = async () => {
    try {
      console.log('Starting wine save process for:', wine);
      
      // Validate wine data
      if (!wine.name || wine.name.trim() === '') {
        throw new Error('Wine name is required');
      }
      
      if (!wine.id || isNaN(wine.id)) {
        throw new Error('Invalid wine ID');
      }
      
      let wineToSave = { ...wine };
      
      // Auto-generate description for new wines if description is empty or default
      if (isNewWine && (!wine.description || wine.description.trim() === '' || wine.description === 'Description will be added here')) {
        try {
          console.log(`Generating AI description for new wine: ${wine.name} ${wine.year || ''}`);
          const response = await fetch('/api/generate-wine-description', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              wineName: wine.name,
              year: wine.year
            })
          });

          if (response.ok) {
            const result = await response.json();
            wineToSave.description = result.description;
            setWine(wineToSave);
            console.log('Generated description:', result.description);
          } else {
            console.warn('Failed to generate wine description, keeping existing');
          }
        } catch (error) {
          console.warn('Error generating wine description:', error);
        }
      }
      
      // Save to unified data system
      DataSyncManager.addOrUpdateWine(wineToSave);
      console.log('Successfully saved to unified data system');

      toast({
        description: (
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {isNewWine ? "Wine added" : "Wine updated"}
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

      setLocation("/admin-crm");
    } catch (error) {
      console.error('Wine save failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        description: (
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {errorMessage}
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
    }
  };

  const deleteWine = async () => {
    try {
      console.log("Deleting wine with ID:", wine.id);
      
      // Delete associated image file if it exists and is a static file
      if (wine.image && wine.image.startsWith('/@assets/')) {
        try {
          const response = await fetch('/api/delete-image', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imagePath: wine.image
            })
          });
          
          if (response.ok) {
            console.log("Associated wine image deleted from assets folder");
          } else {
            console.warn("Failed to delete wine image file:", wine.image);
          }
        } catch (imageError) {
          console.warn("Error deleting wine image:", imageError);
        }
      }
      
      // Use DataSyncManager to remove wine from unified system
      DataSyncManager.removeWine(wine.id);
      
      // Clean up any legacy storage entries
      try {
        const wineDataKey = `editableWineData_${wine.id}`;
        localStorage.removeItem(wineDataKey);
        console.log("Removed individual wine data:", wineDataKey);
      } catch (e) {
        console.log("No individual wine data to remove:", e);
      }

      toast({
        description: (
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Wine deleted
          </span>
        ),
        duration: 5000,
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

      setLocation("/admin-crm");
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        description: (
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Failed to delete wine
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
          onClick={() => window.history.back()}
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
          {isNewWine ? "Add wine" : "Edit wine"}
        </h1>
        {!isNewWine && (
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
        )}
        {isNewWine && <div style={{ width: "32px" }}></div>}
      </div>

      {/* Content */}
      <div className="pt-20 p-6">
        <div style={{ display: "flex", gap: "20px", marginBottom: "24px" }}>
          {/* Wine Image Upload */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <label
              htmlFor="image-upload"
              style={{
                width: "100%",
                height: "150px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
                cursor: "pointer",
                ...typography.body,
                color: "white",
                fontSize: "16px",
                fontWeight: "400",
                border: wine.image ? "none" : "2px dashed rgba(255, 255, 255, 0.3)",
                backgroundImage: wine.image ? `url(${wine.image})` : "none",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
              className="hover:bg-white/8 transition-colors"
            >
              {!wine.image && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <img 
                    src={placeholderImage} 
                    alt="Wine placeholder" 
                    style={{ 
                      width: "60px", 
                      height: "60px", 
                      opacity: 0.3 
                    }} 
                  />
                  <span>Upload</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log(`Processing image upload: ${file.name} (${Math.round(file.size / 1024)}KB)`);
                    
                    // Validate image file
                    const validation = validateImageFile(file);
                    if (!validation.valid) {
                      toast({
                        description: validation.error,
                        duration: 3000,
                        className: "bg-red-500 text-white border-none"
                      });
                      return;
                    }
                    
                    // Check for duplicates
                    const duplicateCheck = await wineImageDeduplication.checkDuplicate(wineId, file);
                    if (duplicateCheck.isDuplicate) {
                      toast({
                        description: "This image already exists for this wine",
                        duration: 3000,
                        className: "bg-yellow-500 text-white border-none"
                      });
                      return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      const result = event.target?.result as string;
                      
                      // Check image size and compress if needed
                      const img = new Image();
                      img.onload = async () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Set maximum dimensions
                        const maxWidth = 800;
                        const maxHeight = 800;
                        let { width, height } = img;
                        
                        // Calculate new dimensions
                        if (width > height) {
                          if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                          }
                        } else {
                          if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                          }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Draw and compress
                        ctx?.drawImage(img, 0, 0, width, height);
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        
                        console.log(`Image compressed: ${Math.round(compressedDataUrl.length / 1024)}KB`);
                        
                        // Delete old image file if it exists and is a static file
                        if (wine.image && wine.image.startsWith('/@assets/')) {
                          try {
                            await fetch('/api/delete-image', {
                              method: 'DELETE',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                imagePath: wine.image
                              })
                            });
                            console.log("Previous wine image deleted from assets folder");
                          } catch (deleteError) {
                            console.warn("Failed to delete previous wine image:", deleteError);
                          }
                        }

                        // Upload new image to server and save as static file
                        try {
                          const response = await fetch('/api/upload-image', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              imageData: compressedDataUrl,
                              wineId: wine.id,
                              wineName: wine.name
                            })
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            console.log(`Image saved as static file: ${result.fileName} (${Math.round(result.size / 1024)}KB)`);
                            
                            // Add image to deduplication tracking
                            const uniqueFilename = generateUniqueFilename(file.name, wineId);
                            await wineImageDeduplication.addImageHash(wineId, file, uniqueFilename);
                            
                            // Update wine with the file path instead of base64
                            updateWine("image", result.imagePath);
                          } else {
                            console.error('Failed to upload image to server');
                            // Fallback to base64 if server upload fails
                            updateWine("image", compressedDataUrl);
                          }
                        } catch (error) {
                          console.error('Image upload error:', error);
                          // Fallback to base64 if server upload fails
                          updateWine("image", compressedDataUrl);
                        }
                      };
                      img.src = result;
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: "none" }}
                id="image-upload"
              />
            </label>
            
            {/* Replace button - only show when image exists */}
            {wine.image && (
              <div
                onClick={() => document.getElementById('image-upload')?.click()}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  borderRadius: "24px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...typography.body,
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "400",
                  width: "100%",
                  height: "40px",
                  marginTop: "8px"
                }}
                className="hover:bg-white/8 transition-colors"
              >
                Replace
              </div>
            )}
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
                value={wine.qrLink && wine.qrLink.includes('/wine-details/') ? wine.qrLink : `${window.location.origin}/wine-details/${wine.id}`}
                size={120}
                wineId={wine.id}
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
                ...typography.body,
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
                ...typography.body,
                color: "white !important",
                height: "56px",
                width: "100%",
                fontSize: "16px",
                fontWeight: "400",
                padding: "0 16px",
              }}
              placeholder="Set"
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
              Vintage Year
            </label>
            <input
              type="number"
              value={wine.year === new Date().getFullYear() && isNewWine ? "" : wine.year || ""}
              onChange={(e) => updateWine("year", parseInt(e.target.value) || new Date().getFullYear())}
              className="contact-form-input"
              style={{
                ...typography.body,
                color: "white !important",
                height: "56px",
                width: "100%",
                fontSize: "16px",
                fontWeight: "400",
                padding: "0 16px",
              }}
              placeholder="Set"
            />
          </div>
        </div>

        {/* Ratings - moved after Vintage Year */}
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
                value={wine.ratings.vn || ""}
                onChange={(e) =>
                  updateWineRating("vn", parseInt(e.target.value) || 0)
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
                placeholder="Set"
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
                value={wine.ratings.jd || ""}
                onChange={(e) =>
                  updateWineRating("jd", parseInt(e.target.value) || 0)
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
                placeholder="Set"
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
                value={wine.ratings.ws || ""}
                onChange={(e) =>
                  updateWineRating("ws", parseInt(e.target.value) || 0)
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
                placeholder="Set"
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
                value={wine.ratings.abv || ""}
                onChange={(e) =>
                  updateWineRating("abv", parseFloat(e.target.value) || 0)
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
                placeholder="Set"
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <div>
            <label
              style={{
                ...typography.body1R,
                color: "rgba(255, 255, 255, 0.60)",
                display: "block",
                marginBottom: "8px",
              }}
            >
              SKU
            </label>
            <input
              type="text"
              value={wine.sku || ""}
              onChange={(e) => updateWine("sku", e.target.value)}
              className="contact-form-input"
              style={{
                ...typography.body,
                color: "white !important",
                height: "56px",
                width: "100%",
                fontSize: "16px",
                fontWeight: "400",
                padding: "0 16px",
              }}
              placeholder="Set"
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
              Varietal / Blend
            </label>
            <input
              type="text"
              value={wine.varietal || ""}
              onChange={(e) => updateWine("varietal", e.target.value)}
              className="contact-form-input"
              style={{
                ...typography.body,
                color: "white !important",
                height: "56px",
                width: "100%",
                fontSize: "16px",
                fontWeight: "400",
                padding: "0 16px",
              }}
              placeholder="Set"
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
              Tasting Notes
            </label>
            <textarea
              value={wine.tastingNotes || ""}
              onChange={(e) => updateWine("tastingNotes", e.target.value)}
              className="contact-form-input"
              style={{
                ...typography.body,
                color: "white !important",
                minHeight: "96px",
                width: "100%",
                fontSize: "16px",
                fontWeight: "400",
                padding: "16px",
                resize: "vertical",
              }}
              placeholder="Set"
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
              Food Pairings
            </label>
            <textarea
              value={Array.isArray(wine.foodPairing) ? wine.foodPairing.join(", ") : wine.foodPairing || ""}
              onChange={(e) => {
                const pairings = e.target.value.split(",").map(p => p.trim()).filter(p => p);
                updateWine("foodPairing", pairings);
              }}
              className="contact-form-input"
              style={{
                ...typography.body,
                color: "white !important",
                minHeight: "96px",
                width: "100%",
                fontSize: "16px",
                fontWeight: "400",
                padding: "16px",
                resize: "vertical",
              }}
              placeholder="Separate multiple pairings with commas"
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
              Production Notes
            </label>
            <textarea
              value={wine.productionNotes || ""}
              onChange={(e) => updateWine("productionNotes", e.target.value)}
              className="contact-form-input"
              style={{
                ...typography.body,
                color: "white !important",
                minHeight: "96px",
                width: "100%",
                fontSize: "16px",
                fontWeight: "400",
                padding: "16px",
                resize: "vertical",
              }}
              placeholder="Set"
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
              Wine Critic Reviews
            </label>
            <textarea
              value={wine.criticReviews || ""}
              onChange={(e) => updateWine("criticReviews", e.target.value)}
              className="contact-form-input"
              style={{
                ...typography.body,
                color: "white !important",
                minHeight: "96px",
                width: "100%",
                fontSize: "16px",
                fontWeight: "400",
                padding: "16px",
                resize: "vertical",
              }}
              placeholder="Set"
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
              Release Date
            </label>
            <input
              type="date"
              value={wine.releaseDate || ""}
              onChange={(e) => updateWine("releaseDate", e.target.value)}
              className="contact-form-input"
              lang="en-US"
              style={{
                ...typography.body,
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
              Price
            </label>
            <input
              type="number"
              step="0.01"
              value={wine.price || ""}
              onChange={(e) => updateWine("price", parseFloat(e.target.value) || 0)}
              className="contact-form-input"
              style={{
                ...typography.body,
                color: "white !important",
                height: "56px",
                width: "100%",
                fontSize: "16px",
                fontWeight: "400",
                padding: "0 16px",
              }}
              placeholder="Set"
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
              Inventory Count (Optional)
            </label>
            <input
              type="number"
              value={wine.bottles === 0 && isNewWine ? "" : wine.bottles || ""}
              onChange={(e) => updateWine("bottles", parseInt(e.target.value) || 0)}
              className="contact-form-input"
              style={{
                ...typography.body,
                color: "white !important",
                height: "56px",
                width: "100%",
                fontSize: "16px",
                fontWeight: "400",
                padding: "0 16px",
              }}
              placeholder="Set"
            />
          </div>
        </div>

        {/* Wine Club Info Section */}
        <div style={{ marginBottom: "24px" }}>
          <h3
            style={{
              ...typography.body1R,
              color: "white",
              fontSize: "18px",
              fontWeight: "500",
              marginBottom: "16px",
            }}
          >
            Wine Club Info
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                style={{
                  ...typography.body1R,
                  color: "rgba(255, 255, 255, 0.60)",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Club Name
              </label>
              <input
                type="text"
                value={wine.clubName || ""}
                onChange={(e) => updateWine("clubName", e.target.value)}
                className="contact-form-input"
                style={{
                  ...typography.body,
                  color: "white !important",
                  height: "56px",
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: "400",
                  padding: "0 16px",
                }}
                placeholder="Set"
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
                Description
              </label>
              <textarea
                value={wine.description || ""}
                onChange={(e) => updateWine("description", e.target.value)}
                className="contact-form-input"
                style={{
                  ...typography.body,
                  color: "white !important",
                  minHeight: "96px",
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: "400",
                  padding: "16px",
                  resize: "vertical",
                }}
                placeholder="Set"
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
                Membership Tiers
              </label>
              <textarea
                value={wine.membershipTiers || ""}
                onChange={(e) => updateWine("membershipTiers", e.target.value)}
                className="contact-form-input"
                style={{
                  ...typography.body,
                  color: "white !important",
                  minHeight: "96px",
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: "400",
                  padding: "16px",
                  resize: "vertical",
                }}
                placeholder="Set"
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
                Pricing
              </label>
              <textarea
                value={wine.clubPricing || ""}
                onChange={(e) => updateWine("clubPricing", e.target.value)}
                className="contact-form-input"
                style={{
                  ...typography.body,
                  color: "white !important",
                  minHeight: "96px",
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: "400",
                  padding: "16px",
                  resize: "vertical",
                }}
                placeholder="Set"
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
                Club Benefits
              </label>
              <textarea
                value={wine.clubBenefits || ""}
                onChange={(e) => updateWine("clubBenefits", e.target.value)}
                className="contact-form-input"
                style={{
                  ...typography.body,
                  color: "white !important",
                  minHeight: "96px",
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: "400",
                  padding: "16px",
                  resize: "vertical",
                }}
                placeholder="Set"
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
            placeholder="Set"
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
          paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
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
          Save
        </button>
      </div>
    </div>
  );
}
