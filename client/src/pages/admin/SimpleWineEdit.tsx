import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useStandardToast } from "@/components/ui/feedback/StandardToast";
import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/buttons/Button";
import typography from "@/styles/typography";
import { DataSyncManager } from "@/utils/dataSync";
import { Wine } from "@/types/wine";
import { Upload, X, Image as ImageIcon, Download, QrCode } from "lucide-react";
import * as QRCodeReact from "qrcode.react";

const SimpleWineEdit: React.FC = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toastSuccess, toastError } = useStandardToast();
  const [wine, setWine] = useState<Wine | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewWine, setIsNewWine] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadWine = async () => {
      try {
        // Check if this is a new wine creation (id = "new")
        if (id === "new") {
          setIsNewWine(true);
          setWine({
            id: 0, // Temporary ID for new wine
            name: "",
            year: new Date().getFullYear(),
            bottles: 0,
            image: "",
            ratings: { vn: 0, jd: 0, ws: 0, abv: 0 },
            description: "",
            buyAgainLink: "",
            qrCode: "",
            qrLink: "",
            foodPairing: [],
            location: ""
          });
          setLoading(false);
          return;
        }

        if (!id) {
          setLoading(false);
          return;
        }

        const wineId = parseInt(id);
        if (isNaN(wineId)) {
          setLoading(false);
          return;
        }

        console.log("Loading wine with ID:", wineId);
        const wineData = await DataSyncManager.getWineById(wineId);
        
        if (wineData) {
          console.log("Loaded wine data:", wineData);
          setWine(wineData);
        } else {
          console.log("Wine not found, creating default");
          setWine({
            id: wineId,
            name: "",
            year: new Date().getFullYear(),
            bottles: 0,
            image: "",
            ratings: { vn: 0, jd: 0, ws: 0, abv: 0 }
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading wine:", error);
        setLoading(false);
      }
    };

    loadWine();
  }, [id]);

  // Initialize image preview when wine data loads
  useEffect(() => {
    if (wine && wine.image) {
      setImagePreview(wine.image);
    }
  }, [wine]);

  const handleImageUpload = async (file: File) => {
    if (!wine) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('wineId', wine.id.toString());
      formData.append('wineName', wine.name || '');

      const response = await fetch('/api/upload-wine-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update wine with new image URL
        setWine({ ...wine, image: result.imageUrl });
        setImagePreview(result.imageUrl);
        toastSuccess('Image uploaded successfully');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toastError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toastError('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toastError('Image size must be less than 10MB');
        return;
      }

      handleImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    if (wine) {
      setWine({ ...wine, image: '' });
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const generateQRCodeValue = () => {
    if (!wine) return '';
    // Generate QR code value based on wine details
    const baseUrl = window.location.origin;
    return wine.qrLink || `${baseUrl}/wine-details/${wine.id}`;
  };

  const downloadQRCode = () => {
    const svg = document.querySelector('#wine-qr-code svg') as SVGElement;
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 256;
      canvas.height = 256;
      
      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 256, 256);
          ctx.drawImage(img, 0, 0);
          
          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `wine-${wine?.id || 'new'}-qr-code.png`;
          link.href = url;
          link.click();
        }
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const handleSave = async () => {
    if (!wine || !wine.name.trim()) {
      toastError("Wine name is required");
      return;
    }

    try {
      if (isNewWine) {
        // Create new wine (exclude the temporary id)
        const { id, ...wineData } = wine;
        const newWine = await DataSyncManager.addWine(wineData);
        if (newWine) {
          toastSuccess("Wine added successfully");
          setLocation("/winery-tenant-admin");
        } else {
          toastError("Failed to add wine");
        }
      } else {
        // Update existing wine
        const updatedWine = await DataSyncManager.updateWine(wine.id, wine);
        if (updatedWine) {
          toastSuccess("Wine updated successfully");
          setLocation("/winery-tenant-admin");
        } else {
          toastError("Failed to update wine");
        }
      }
    } catch (error) {
      console.error("Error saving wine:", error);
      toastError(isNewWine ? "Failed to add wine" : "Failed to update wine");
    }
  };

  const pageTitle = isNewWine ? "Add New Wine" : "Edit Wine";

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader title={pageTitle} showBackButton onBack={() => setLocation("/winery-tenant-admin")} />
        <div className="pt-[75px] p-6">
          <div style={typography.body}>Loading wine data...</div>
        </div>
      </div>
    );
  }

  if (!wine) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader title={pageTitle} showBackButton onBack={() => setLocation("/winery-tenant-admin")} />
        <div className="pt-[75px] p-6">
          <div style={typography.body}>Wine not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-600">
      <AppHeader 
        title={pageTitle} 
        showBackButton 
        onBack={() => setLocation("/winery-tenant-admin")} 
      />
      
      <div className="pt-[75px] p-6">
        <div className="space-y-6">
          {/* Wine Name */}
          <div>
            <label style={typography.body1R} className="block mb-2">Wine Name</label>
            <input
              type="text"
              value={wine.name}
              onChange={(e) => setWine({ ...wine, name: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="Enter wine name"
            />
          </div>

          {/* Year */}
          <div>
            <label style={typography.body1R} className="block mb-2">Year</label>
            <input
              type="number"
              value={wine.year}
              onChange={(e) => setWine({ ...wine, year: parseInt(e.target.value) || 0 })}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="Year"
            />
          </div>

          {/* Bottles */}
          <div>
            <label style={typography.body1R} className="block mb-2">Bottles</label>
            <input
              type="number"
              value={wine.bottles}
              onChange={(e) => setWine({ ...wine, bottles: parseInt(e.target.value) || 0 })}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="Number of bottles"
            />
          </div>

          {/* Wine Image and QR Code Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wine Image Upload */}
            <div>
              <label style={typography.body1R} className="block mb-2">Wine Image</label>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-4 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Wine preview"
                    className="w-32 h-32 object-cover rounded-lg border border-white/20"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <div className="mb-4">
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span style={typography.body1R}>Uploading image...</span>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                    type="button"
                  >
                    <Upload size={16} />
                    Replace Image
                  </Button>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* QR Code Section */}
            <div>
              <label style={typography.body1R} className="block mb-2">QR Code</label>
              
              {wine && (
                <div className="flex flex-col items-center gap-4">
                  {/* QR Code Display */}
                  <div 
                    id="wine-qr-code"
                    className="bg-white p-4 rounded-lg border border-white/20"
                  >
                    <QRCodeReact.QRCodeSVG
                      value={generateQRCodeValue()}
                      size={128}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                    />
                  </div>
                  
                  {/* QR Code Info */}
                  <div className="text-center">
                    <p style={typography.body1R} className="text-white/60 text-sm mb-2">
                      Scan to view wine details
                    </p>
                    <Button
                      variant="secondary"
                      onClick={downloadQRCode}
                      className="flex items-center gap-2"
                      type="button"
                    >
                      <Download size={16} />
                      Download QR Code
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ratings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={typography.body1R} className="block mb-2">VN Rating</label>
              <input
                type="number"
                value={wine.ratings.vn}
                onChange={(e) => setWine({ 
                  ...wine, 
                  ratings: { ...wine.ratings, vn: parseInt(e.target.value) || 0 }
                })}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg "
                placeholder="VN Rating"
              />
            </div>
            <div>
              <label style={typography.body1R} className="block mb-2">JD Rating</label>
              <input
                type="number"
                value={wine.ratings.jd}
                onChange={(e) => setWine({ 
                  ...wine, 
                  ratings: { ...wine.ratings, jd: parseInt(e.target.value) || 0 }
                })}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg "
                placeholder="JD Rating"
              />
            </div>
            <div>
              <label style={typography.body1R} className="block mb-2">WS Rating</label>
              <input
                type="number"
                value={wine.ratings.ws}
                onChange={(e) => setWine({ 
                  ...wine, 
                  ratings: { ...wine.ratings, ws: parseInt(e.target.value) || 0 }
                })}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg "
                placeholder="WS Rating"
              />
            </div>
            <div>
              <label style={typography.body1R} className="block mb-2">ABV</label>
              <input
                type="number"
                step="0.1"
                value={wine.ratings.abv}
                onChange={(e) => setWine({ 
                  ...wine, 
                  ratings: { ...wine.ratings, abv: parseFloat(e.target.value) || 0 }
                })}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg "
                placeholder="ABV"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6">
            <Button 
              variant="primary" 
              onClick={handleSave}
              className="w-full"
            >
              {isNewWine ? "Add Wine" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleWineEdit;