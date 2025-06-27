import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useStandardToast } from "@/components/ui/feedback/StandardToast";
import AppHeader, { HeaderSpacer } from "@/components/layout/AppHeader";
import Button from "@/components/ui/buttons/Button";
import typography from "@/styles/typography";
import { DataSyncManager } from "@/utils/dataSync";
import { Wine } from "@/types/wine";
import { Upload, Image as ImageIcon, Download, QrCode, Trash2 } from "lucide-react";
import * as QRCodeReact from "qrcode.react";
import ActionDropdown, { ActionDropdownItem } from "@/components/admin/ActionDropdown";
import placeholderImage from "@assets/Placeholder.png";

interface SimpleWineEditProps {
  wine?: any | null;
  onSave?: (updatedWine: any) => void;
  onCancel?: () => void;
}

const SimpleWineEdit: React.FC<SimpleWineEditProps> = ({ wine: propWine, onSave, onCancel }) => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toastSuccess, toastError } = useStandardToast();
  const [wine, setWine] = useState<Wine | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewWine, setIsNewWine] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Якщо передано пропс wine, використовуємо його
  const isModalMode = !!propWine || !!onSave || !!onCancel;

  useEffect(() => {
    const loadWine = async () => {
      // Якщо це модальний режим і передано wine
      if (isModalMode && propWine) {
        setWine(propWine);
        setLoading(false);
        return;
      }

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
          location: "",
          technicalDetails: {
            varietal: { primary: "", secondary: "", primaryPercentage: "", secondaryPercentage: "" },
            aging: { ageUpTo: "" }
          }
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
          ratings: { vn: 0, jd: 0, ws: 0, abv: 0 },
          technicalDetails: {
            varietal: { primary: "", secondary: "", primaryPercentage: "", secondaryPercentage: "" },
            aging: {  ageUpTo: "" }
          }
        });
      }
      setLoading(false);
    };

    loadWine();
  }, [id, isModalMode, propWine]);

  // Initialize image preview when wine data loads
  useEffect(() => {
    if (wine && wine.image) {
      // Use the Cloudinary URL directly from wine data
      setImagePreview(wine.image);
    } else if (wine && !wine.image) {
      // Clear preview if no image is set
      setImagePreview(null);
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
        const updatedWine = { ...wine, image: result.imageUrl };
        setWine(updatedWine);
        setImagePreview(result.imageUrl);
        
        // Automatically save the updated wine data to database
        if (!isNewWine) {
          try {
            await DataSyncManager.updateWine(wine.id, { image: result.imageUrl });
            console.log('Wine image URL saved to database:', result.imageUrl);
          } catch (saveError) {
            console.error('Failed to save image URL to database:', saveError);
          }
        }
        
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

    // Якщо це модальний режим, використовуємо onSave callback
    if (isModalMode && onSave) {
      onSave(wine);
      return;
    }

    try {
      if (isNewWine) {
        // Create new wine (exclude the temporary id)
        const { id, ...wineData } = wine;
        const newWine = await DataSyncManager.addWine(wineData);
        if (newWine) {
          toastSuccess("Wine added successfully");
          // Повертаємося назад до сторінки редагування tenant
          setLocation("/tenant-edit/new?tab=cms");
        } else {
          toastError("Failed to add wine");
        }
      } else {
        // Update existing wine
        const updatedWine = await DataSyncManager.updateWine(wine.id, wine);
        if (updatedWine) {
          toastSuccess("Wine updated successfully");
          // Повертаємося назад до сторінки редагування tenant
          setLocation("/tenant-edit/new?tab=cms");
        } else {
          toastError("Failed to update wine");
        }
      }
    } catch (error) {
      console.error("Error saving wine:", error);
      toastError(isNewWine ? "Failed to add wine" : "Failed to update wine");
    }
  };

  // Функция удаления вина
  const handleDeleteWine = async () => {
    if (!wine || isNewWine) return;
    if (!window.confirm("Are you sure you want to delete this wine? This action cannot be undone.")) return;
    try {
      const ok = await DataSyncManager.removeWine(wine.id);
      if (ok) {
        toastSuccess("Wine deleted successfully");
        setLocation("/tenant-edit/new?tab=cms");
      } else {
        toastError("Failed to delete wine");
      }
    } catch (error) {
      toastError("Failed to delete wine");
    }
  };

  // Дії для дропдауна
  const actions: ActionDropdownItem[] = [
    {
      label: "Delete Wine",
      icon: <Trash2 size={16} />,
      onClick: handleDeleteWine,
      colorClass: "text-red-400",
      disabled: false,
    },
  ];

  const pageTitle = isNewWine ? "Add New Wine" : "Edit Wine";

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader title={pageTitle} showBackButton onBack={() => setLocation("/tenant-edit/new?tab=cms")} />
        <div className="pt-[75px] p-6">
          <div style={typography.body}>Loading wine data...</div>
        </div>
      </div>
    );
  }

  if (!wine) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader title={pageTitle} showBackButton onBack={() => setLocation("/tenant-edit/new?tab=cms")} />
        <div className="pt-[75px] p-6">
          <div style={typography.body}>Wine not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-600">
      {!isModalMode && (
        <AppHeader 
          title={pageTitle} 
          showBackButton 
          onBack={() => setLocation("/tenant-edit/new?tab=cms")}
          rightContent={
            !isNewWine && wine?.id ? (
              <ActionDropdown actions={actions} />
            ) : null
          }
        />
      )}
      
      <div className={`${!isModalMode ? 'pt-[75px]' : ''} p-6 pb-32`}>
        <div className="space-y-6">
          {/* Wine Image and QR Code Section */}
          <div className="grid grid-cols-2 gap-6 items-start">
            {/* Wine Image Upload */}
            <div className="min-w-0">
              
              {/* Image Preview */}
              {imagePreview ? (
                <div className="mb-4 flex items-center justify-center bg-white p-4 rounded-lg border border-white/20" style={{ width: 150, height: 150 }}>
                  <img
                    src={imagePreview}
                    alt="Wine preview"
                    className="max-w-full max-h-full object-contain"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              ) : (
                <div className="mb-4 flex items-center justify-center bg-white p-4 rounded-lg border border-white/20" style={{ width: 150, height: 150 }}>
                  <img
                    src={placeholderImage}
                    alt="Placeholder wine preview"
                    className="max-w-full max-h-full object-contain opacity-80"
                    style={{ width: '100%', height: '100%' }}
                  />
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
                    Upload
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
            <div className="min-w-0">
              
              {wine && (
                <div className="flex flex-col items-center gap-4">
                  {/* QR Code Display */}
                  <div 
                    id="wine-qr-code"
                    className="bg-white p-4 rounded-lg border border-white/20"
                    style={{ width: 150, height: 150 }}
                  >
                    <QRCodeReact.QRCodeSVG
                      value={generateQRCodeValue()}
                      size={110}
                      bgColor="#000000"
                      fgColor="#ffffff"
                      level="M"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                  
                  {/* QR Code Info */}
                  <div className="text-center">
                    <Button
                      variant="secondary"
                      onClick={downloadQRCode}
                      className="flex items-center gap-2"
                      type="button"
                    >
                      <Download size={16} />
                      Download QR
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Wine Name */}
          <div>
            <label style={typography.body1R} className="block mb-2">Wine Name<span style={{ color: "#FF6B6B", marginLeft: 4 }}>*</span></label>
            <input
              type="text"
              value={wine.name}
              onChange={(e) => setWine({ ...wine, name: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="Enter wine name"
              required
            />
          </div>

          {/* Year */}
          <div>
            <label style={typography.body1R} className="block mb-2">Year<span style={{ color: "#FF6B6B", marginLeft: 4 }}>*</span></label>
            <input
              type="number"
              value={wine.year}
              onChange={(e) => setWine({ ...wine, year: parseInt(e.target.value) || 0 })}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder={String(new Date().getFullYear())}
              required
            />
          </div>

          
          


          {/* Buy Again Link */}
          <div>
            <label style={typography.body1R} className="block mb-2">Buy Again Link</label>
            <input
              type="text"
              value={wine.buyAgainLink || ""}
              onChange={e => setWine({ ...wine, buyAgainLink: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="https://..."
            />
          </div>

          {/* QR Link */}
          <div>
            <label style={typography.body1R} className="block mb-2">QR Link</label>
            <input
              type="text"
              value={wine.qrLink || ""}
              onChange={e => setWine({ ...wine, qrLink: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="https://..."
            />
          </div>



          {/* Technical Details: Varietal (2 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary varietal and percentage */}
            <div>
              <label style={typography.body1R} className="block mb-2">Varietal Primary</label>
              <input
                type="text"
                value={wine.technicalDetails?.varietal?.primary || ""}
                onChange={e => setWine({
                  ...wine,
                  technicalDetails: {
                    ...wine.technicalDetails,
                    varietal: {
                      ...wine.technicalDetails?.varietal,
                      primary: e.target.value
                    }
                  }
                })}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
                placeholder="Primary varietal"
              />
            </div>
            <div>
              <label style={typography.body1R} className="block mb-2">Primary Percentage</label>
              <input
                type="text"
                value={wine.technicalDetails?.varietal?.primaryPercentage || ""}
                onChange={e => setWine({
                  ...wine,
                  technicalDetails: {
                    ...wine.technicalDetails,
                    varietal: {
                      ...wine.technicalDetails?.varietal,
                      primaryPercentage: e.target.value
                    }
                  }
                })}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
                placeholder="Primary %"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Secondary varietal and percentage */}
            <div>
              <label style={typography.body1R} className="block mb-2">Varietal Secondary</label>
              <input
                type="text"
                value={wine.technicalDetails?.varietal?.secondary || ""}
                onChange={e => setWine({
                  ...wine,
                  technicalDetails: {
                    ...wine.technicalDetails,
                    varietal: {
                      ...wine.technicalDetails?.varietal,
                      secondary: e.target.value
                    }
                  }
                })}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
                placeholder="Secondary varietal"
              />
            </div>
            <div>
              <label style={typography.body1R} className="block mb-2">Secondary Percentage</label>
              <input
                type="text"
                value={wine.technicalDetails?.varietal?.secondaryPercentage || ""}
                onChange={e => setWine({
                  ...wine,
                  technicalDetails: {
                    ...wine.technicalDetails,
                    varietal: {
                      ...wine.technicalDetails?.varietal,
                      secondaryPercentage: e.target.value
                    }
                  }
                })}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
                placeholder="Secondary %"
              />
            </div>
          </div>

          {/* Appellation */}
          <div>
            <label style={typography.body1R} className="block mb-2">Appellation</label>
            <input
              type="text"
              value={wine.location || ""}
              onChange={e => setWine({ ...wine, location: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="Appellation"
            />
          </div>

          {/* Technical Details: Aging */}
          <div>
            <label style={typography.body1R} className="block mb-2">Age Up To</label>
            <input
              type="text"
              value={wine.technicalDetails?.aging?.ageUpTo || ""}
              onChange={e => setWine({
                ...wine,
                technicalDetails: {
                  ...wine.technicalDetails,
                  aging: {
                    ...wine.technicalDetails?.aging,
                    ageUpTo: e.target.value
                  }
                }
              })}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="Age up to"
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

{/* Ratings */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
</div>

          {/* Food Pairing
          <div>
            <label style={typography.body1R} className="block mb-2">Food Pairing (comma separated)</label>
            <input
              type="text"
              value={wine.foodPairing?.join(", ") || ""}
              onChange={e => setWine({ ...wine, foodPairing: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="e.g. cheese, meat, pasta"
            />
          </div> */}



          {/* Bottles */}
          <div>
            <label style={typography.body1R} className="block mb-2">Bottles<span style={{ color: "#FF6B6B", marginLeft: 4 }}>*</span></label>
            <input
              type="number"
              value={wine.bottles}
              onChange={(e) => setWine({ ...wine, bottles: parseInt(e.target.value) || 0 })}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="Number of bottles"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label style={typography.body1R} className="block mb-2">Description</label>
            <textarea
              value={wine.description || ""}
              onChange={e => setWine({ ...wine, description: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="Wine description"
            />
          </div>

          {/* Save Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-sm border-t border-white/10 z-50">
            <div className="flex gap-2">
              <Button 
                variant="primary" 
                onClick={handleSave}
                className="flex-1"
              >
                {isNewWine ? "Add Wine" : "Save"}
              </Button>
              {isModalMode && onCancel && (
                <Button 
                  variant="secondary" 
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleWineEdit;