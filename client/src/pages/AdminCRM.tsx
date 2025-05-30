import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";
import { generateWineQRData } from "@/utils/cellarManager";
import { SimpleQRCode } from "@/components/SimpleQRCode";
import { getAllWines, saveAllWines, type WineData } from "@/utils/wineDataManager";
import { Search } from "lucide-react";

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

export default function AdminCRM() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();


  const [isEditMode, setIsEditMode] = useState(false);
  const [wineCards, setWineCards] = useState<WineCardData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Load wines from storage on component mount
  useEffect(() => {
    const wines = getAllWines();
    setWineCards(wines);
  }, []);

  // Filter wines based on search term
  const filteredWines = wineCards.filter(wine =>
    wine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddWine = async () => {
    const newWineId = wineCards.length > 0 ? Math.max(...wineCards.map((w) => w.id)) + 1 : 1;
    const newWine: WineCardData = {
      id: newWineId,
      name: "",
      year: 0,
      bottles: 0,
      image: "/@fs/home/runner/workspace/attached_assets/Product%20Image.png",
      ratings: { vn: 0, jd: 0, ws: 0, abv: 0 },
      buyAgainLink: "",
      qrCode: `QR_${newWineId.toString().padStart(3, '0')}`,
      qrLink: ""
    };

    // Add wine at the top of the list
    const updatedWines = [newWine, ...wineCards];
    setWineCards(updatedWines);
    
    // Save to storage
    saveAllWines(updatedWines);

    // Navigate to wine edit page for the new wine
    setLocation(`/wine-edit/${newWine.id}`);
  };

  const updateWineCard = (cardId: number, field: keyof WineCardData, value: any) => {
    setWineCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, [field]: value } : card,
      ),
    );
  };

  const updateWineCardRating = (
    cardId: number,
    ratingType: string,
    value: number,
  ) => {
    setWineCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? {
              ...card,
              ratings: { ...card.ratings, [ratingType]: value },
            }
          : card,
      ),
    );
  };



  const deleteWineCard = (cardId: number) => {
    setWineCards((prev) => prev.filter((card) => card.id !== cardId));

    toast({
      title: "Wine Removed",
      description: "Wine has been removed from your collection.",
    });
  };



  return (
    <div className="min-h-screen bg-background text-white">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <h1 className="text-lg font-medium text-white text-left flex-1 truncate overflow-hidden whitespace-nowrap">Admin</h1>
        <div className="flex gap-3">
          {isEditMode && (
            <Button 
              onClick={() => {
                setIsEditMode(false);
                toast({
                  title: "Changes Saved",
                  description: "All wine details have been saved successfully.",
                });
              }}
            >
              Save All
            </Button>
          )}
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              width: '40px',
              height: '40px',
              minWidth: '40px',
              minHeight: '40px',
              maxWidth: '40px',
              maxHeight: '40px',
              padding: 0,
              margin: 0,
              border: 'none',
              borderWidth: 0,
              borderStyle: 'none',
              background: 'transparent',
              backgroundColor: 'transparent',
              backgroundImage: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              outlineWidth: 0,
              boxShadow: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              borderRadius: 0,
              textDecoration: 'none',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              lineHeight: 'normal'
            }}
          >
            <Search size={20} />
          </button>
          <button
            onClick={handleAddWine}
            className="admin-add-button"
            style={{
              padding: "0 16px",
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 24,
              border: '1px solid transparent',
              backgroundImage: 'linear-gradient(#0A0A0A, #0A0A0A), linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.2))',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Add Wine
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 p-6">
        <div className="space-y-8">
          {/* Search Bar - Only show when toggled */}
          {showSearch && (
            <div style={{ marginBottom: "24px" }}>
              <input
                type="text"
                placeholder="Search wines by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                autoFocus
              />
            </div>
          )}

          {/* Wine Cards Preview */}
          <div className="space-y-6">
            <div className="space-y-4">
              {filteredWines.map((card) => (
                <div
                  key={card.id}
                  style={{
                    background: "rgba(25, 25, 25, 0.8)",
                    borderRadius: "16px",
                    border: "1px solid #494949",
                    padding: "20px",
                    position: "relative",
                    cursor: "pointer",
                  }}
                  onClick={() => setLocation(`/wine-edit/${card.id}`)}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      alignItems: "center",
                    }}
                  >
                    {/* Wine Image */}
                    <div
                      style={{
                        width: "80px",
                        height: "100px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255, 255, 255, 0.05)",
                        borderRadius: "8px",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={card.image}
                        alt={card.name}
                        style={{
                          maxHeight: "90px",
                          maxWidth: "70px",
                          width: "auto",
                          height: "auto",
                        }}
                      />
                    </div>

                    {/* Essential Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", marginBottom: "4px" }}>
                        ID: {card.id}
                      </div>
                      <div style={{ ...typography.bodyPlus1, color: "white" }}>
                        {card.year} {card.name}
                      </div>
                    </div>


                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
