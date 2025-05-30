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
  const [editingWine, setEditingWine] = useState<WineCardData | null>(null);
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
      {/* Fixed Header with back button navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={() => setLocation("/home-global")}
          className="text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M15.707 4.293a1 1 0 0 1 0 1.414L9.414 12l6.293 6.293a1 1 0 0 1-1.414 1.414l-7-7a1 1 0 0 1 0-1.414l7-7a1 1 0 0 1 1.414 0"
            />
          </svg>
        </button>
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
          <Button onClick={handleAddWine}>Add Wine</Button>
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
                    display: "flex",
                    gap: "20px",
                    position: "relative",
                    alignItems: "stretch",
                  }}
                >


                  {/* Left Side: Wine Image */}
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
                      src={card.image}
                      alt={card.name}
                      style={{
                        maxHeight: "150px",
                        maxWidth: "110px",
                        width: "auto",
                        height: "auto",
                      }}
                    />
                    {isEditMode && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                updateWineCard(card.id, 'image', event.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          style={{ display: "none" }}
                          id={`image-upload-${card.id}`}
                        />
                        <label
                          htmlFor={`image-upload-${card.id}`}
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
                      </>
                    )}
                  </div>

                  {/* Right Side: Wine Details */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* ID */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", minWidth: "80px" }}>
                        ID:
                      </span>
                      <span style={{ ...typography.bodyPlus1, color: "white" }}>
                        {card.id}
                      </span>
                    </div>

                    {/* Wine Name */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", minWidth: "80px" }}>
                        Wine name:
                      </span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={card.name}
                          onChange={(e) => updateWineCard(card.id, 'name', e.target.value)}
                          style={{ 
                            ...typography.bodyPlus1, 
                            color: "white", 
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            flex: 1
                          }}
                        />
                      ) : (
                        <span style={{ ...typography.bodyPlus1, color: "white" }}>
                          {card.name}
                        </span>
                      )}
                    </div>

                    {/* Wine Year */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", minWidth: "80px" }}>
                        Wine year:
                      </span>
                      {isEditMode ? (
                        <input
                          type="number"
                          value={card.year}
                          onChange={(e) => updateWineCard(card.id, 'year', parseInt(e.target.value))}
                          style={{ 
                            ...typography.bodyPlus1, 
                            color: "white", 
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            width: "80px"
                          }}
                        />
                      ) : (
                        <span style={{ ...typography.bodyPlus1, color: "white" }}>
                          {card.year}
                        </span>
                      )}
                    </div>

                    {/* Ratings Row */}
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)" }}>VN:</span>
                        {isEditMode ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={card.ratings.vn}
                            onChange={(e) => updateWineCardRating(card.id, 'vn', parseInt(e.target.value))}
                            style={{ 
                              ...typography.num, 
                              color: "white", 
                              background: "rgba(255, 255, 255, 0.1)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: "4px",
                              padding: "2px 4px",
                              width: "50px"
                            }}
                          />
                        ) : (
                          <span style={{ ...typography.num, color: "white" }}>{card.ratings.vn}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)" }}>JD:</span>
                        {isEditMode ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={card.ratings.jd}
                            onChange={(e) => updateWineCardRating(card.id, 'jd', parseInt(e.target.value))}
                            style={{ 
                              ...typography.num, 
                              color: "white", 
                              background: "rgba(255, 255, 255, 0.1)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: "4px",
                              padding: "2px 4px",
                              width: "50px"
                            }}
                          />
                        ) : (
                          <span style={{ ...typography.num, color: "white" }}>{card.ratings.jd}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)" }}>WS:</span>
                        {isEditMode ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={card.ratings.ws}
                            onChange={(e) => updateWineCardRating(card.id, 'ws', parseInt(e.target.value))}
                            style={{ 
                              ...typography.num, 
                              color: "white", 
                              background: "rgba(255, 255, 255, 0.1)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: "4px",
                              padding: "2px 4px",
                              width: "50px"
                            }}
                          />
                        ) : (
                          <span style={{ ...typography.num, color: "white" }}>{card.ratings.ws}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)" }}>ABV:</span>
                        {isEditMode ? (
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.1"
                            value={card.ratings.abv}
                            onChange={(e) => updateWineCardRating(card.id, 'abv', parseFloat(e.target.value))}
                            style={{ 
                              ...typography.num, 
                              color: "white", 
                              background: "rgba(255, 255, 255, 0.1)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: "4px",
                              padding: "2px 4px",
                              width: "60px"
                            }}
                          />
                        ) : (
                          <span style={{ ...typography.num, color: "white" }}>{card.ratings.abv}%</span>
                        )}
                      </div>
                    </div>

                    {/* Buy Again Link */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", minWidth: "80px" }}>
                        Buy again:
                      </span>
                      {isEditMode ? (
                        <input
                          type="url"
                          value={card.buyAgainLink}
                          onChange={(e) => updateWineCard(card.id, 'buyAgainLink', e.target.value)}
                          style={{ 
                            ...typography.body1R, 
                            color: "white", 
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            flex: 1
                          }}
                        />
                      ) : (
                        <a 
                          href={card.buyAgainLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...typography.body1R, color: "#3B82F6", textDecoration: "underline" }}
                          className="hover:text-blue-400 transition-colors"
                        >
                          {card.buyAgainLink}
                        </a>
                      )}
                    </div>

                    {/* QR Code */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <span style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)", minWidth: "80px", marginTop: "4px" }}>
                        QR Code:
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {/* QR Code Display */}
                        <SimpleQRCode 
                          value={generateWineQRData(card.id)}
                          size={80}
                        />
                        {/* QR Code URL */}
                        <div style={{ maxWidth: "200px" }}>
                          <span style={{ 
                            ...typography.body1R, 
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "12px",
                            wordBreak: "break-all"
                          }}>
                            {generateWineQRData(card.id)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Wine Modal */}
      {editingWine && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setEditingWine(null)}
        >
          <div
            style={{
              background: "rgba(25, 25, 25, 0.95)",
              borderRadius: "16px",
              border: "1px solid #494949",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ ...typography.h1, color: 'white' }}>
                Edit Wine
              </h3>
              <button
                onClick={() => setEditingWine(null)}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Wine Name</label>
                <input
                  type="text"
                  value={editingWine.name}
                  onChange={(e) => setEditingWine(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Number of Bottles</label>
                <input
                  type="number"
                  value={editingWine.bottles}
                  onChange={(e) => setEditingWine(prev => prev ? { ...prev, bottles: parseInt(e.target.value) } : null)}
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-sm text-white/80">Ratings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Vivino (VN)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editingWine.ratings.vn}
                      onChange={(e) => setEditingWine(prev => prev ? {
                        ...prev,
                        ratings: { ...prev.ratings, vn: parseInt(e.target.value) }
                      } : null)}
                      className="w-full p-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">James Halliday (JD)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editingWine.ratings.jd}
                      onChange={(e) => setEditingWine(prev => prev ? {
                        ...prev,
                        ratings: { ...prev.ratings, jd: parseInt(e.target.value) }
                      } : null)}
                      className="w-full p-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Wine Spectator (WS)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editingWine.ratings.ws}
                      onChange={(e) => setEditingWine(prev => prev ? {
                        ...prev,
                        ratings: { ...prev.ratings, ws: parseInt(e.target.value) }
                      } : null)}
                      className="w-full p-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">ABV (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={editingWine.ratings.abv}
                      onChange={(e) => setEditingWine(prev => prev ? {
                        ...prev,
                        ratings: { ...prev.ratings, abv: parseFloat(e.target.value) }
                      } : null)}
                      className="w-full p-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setWineCards(prev => prev.map(card => 
                      card.id === editingWine.id ? editingWine : card
                    ));
                    setEditingWine(null);
                    toast({
                      title: "Wine Updated",
                      description: "Wine details have been saved successfully.",
                    });
                  }}
                  style={{ flex: 1 }}
                >
                  Save Changes
                </Button>
                <button
                  onClick={() => {
                    deleteWineCard(editingWine.id);
                    setEditingWine(null);
                  }}
                  className="px-4 py-2 text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-300/40 rounded-lg transition-colors"
                >
                  Delete Wine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
