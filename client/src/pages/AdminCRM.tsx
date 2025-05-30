import React, { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";
import { generateWineQRData } from "@/utils/cellarManager";
import { SimpleQRCode } from "@/components/SimpleQRCode";

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
  const [wineCards, setWineCards] = useState<WineCardData[]>([
    {
      id: 1,
      name: 'Ridge "Lytton Springs" Dry Creek Zinfandel',
      year: 2021,
      bottles: 4,
      image: "/@fs/home/runner/workspace/attached_assets/Product%20Image.png",
      ratings: { vn: 95, jd: 93, ws: 93, abv: 14.3 },
      buyAgainLink: "https://ridge.com/product/lytton-springs",
      qrCode: "QR_CODE_1",
      qrLink: "https://ridge.com/wines/lytton-springs"
    },
    {
      id: 2,
      name: "Monte Bello Cabernet Sauvignon",
      year: 2021,
      bottles: 2,
      image: "/@fs/home/runner/workspace/attached_assets/image-2.png",
      ratings: { vn: 95, jd: 93, ws: 93, abv: 14.3 },
      buyAgainLink: "https://ridge.com/product/monte-bello",
      qrCode: "QR_CODE_2",
      qrLink: "https://ridge.com/wines/monte-bello"
    },
  ]);

  const handleAddWine = async () => {
    const newWine: WineCardData = {
      id: Math.max(...wineCards.map((w) => w.id)) + 1,
      name: "New Wine",
      year: 2023,
      bottles: 1,
      image: "/@fs/home/runner/workspace/attached_assets/Product%20Image.png",
      ratings: { vn: 90, jd: 90, ws: 90, abv: 13.5 },
      buyAgainLink: "https://example.com",
      qrCode: "QR_NEW",
      qrLink: "https://example.com/qr"
    };

    setWineCards((prev) => [...prev, newWine]);

    toast({
      title: "Wine Added",
      description: "New wine has been added to your collection.",
    });
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
          <Button onClick={handleAddWine} style={{ height: "40px", padding: "0 16px", lineHeight: "40px", minHeight: "40px", maxHeight: "40px" }}>Add Wine</Button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 p-6">
        <div className="space-y-8">
          {/* Wine Cards Preview */}
          <div className="space-y-6">

            <div className="space-y-4">
              {wineCards.map((card) => (
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
