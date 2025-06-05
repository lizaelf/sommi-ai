import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";
import { generateWineQRData } from "@/utils/cellarManager";
import { SimpleQRCode } from "@/components/SimpleQRCode";
import placeholderImage from "@assets/Placeholder.png";

interface WineCardData {
  id: number;
  name: string;
  year?: number;
  bottles: number;
  image?: string;
  ratings?: {
    vn?: number;
    jd?: number;
    ws?: number;
    abv?: number;
  };
}

export default function AdminCRM() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [wineCards, setWineCards] = useState<WineCardData[]>([]);

  // Load wines from localStorage
  const loadWineData = () => {
    const storedWines = JSON.parse(localStorage.getItem('admin-wines') || '[]');
    setWineCards(storedWines);
  };

  // Load wine data on component mount
  useEffect(() => {
    loadWineData();
  }, []);

  const addWineCard = () => {
    const newId = wineCards.length > 0 ? Math.max(...wineCards.map(w => w.id)) + 1 : 1;
    setLocation(`/wine-edit/${newId}?new=true`);
  };

  const deleteWineCard = (cardId: number) => {
    const updatedWines = wineCards.filter((card) => card.id !== cardId);
    setWineCards(updatedWines);
    localStorage.setItem('admin-wines', JSON.stringify(updatedWines));

    toast({
      title: "Wine Removed",
      description: "Wine has been removed from your collection.",
    });
  };

  return (
    <div style={{ backgroundColor: "#000000", minHeight: "100vh" }}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Wine Collection</h1>
          <div className="flex gap-3">
            <Button
              onClick={() => setLocation("/tenants")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Manage Wineries
            </Button>
            <Button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded-lg font-medium ${
                isEditMode
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
              }`}
            >
              {isEditMode ? "Exit Edit" : "Edit Mode"}
            </Button>
            <Button
              onClick={addWineCard}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Add Wine
            </Button>
          </div>
        </div>

        {/* Wine Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {wineCards.map((wine) => (
            <div
              key={wine.id}
              className="relative bg-white/5 border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-sm"
              onClick={() => !isEditMode && setLocation(`/wine-details/${wine.id}`)}
            >
              {/* Wine Image */}
              <div className="aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-white/5">
                <img
                  src={wine.image || placeholderImage}
                  alt={wine.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = placeholderImage;
                  }}
                />
              </div>

              {/* Wine Details */}
              <div className="space-y-2">
                <h3 className="text-white font-medium text-sm leading-tight line-clamp-2">
                  {wine.name}
                </h3>
                
                {wine.year && (
                  <p className="text-white/70 text-xs">
                    {wine.year}
                  </p>
                )}

                <p className="text-white/70 text-xs">
                  {wine.bottles} bottles
                </p>

                {/* Ratings */}
                {wine.ratings && (
                  <div className="flex flex-wrap gap-1 text-xs">
                    {wine.ratings.vn && (
                      <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded">
                        VN {wine.ratings.vn}
                      </span>
                    )}
                    {wine.ratings.jd && (
                      <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                        JD {wine.ratings.jd}
                      </span>
                    )}
                    {wine.ratings.ws && (
                      <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded">
                        WS {wine.ratings.ws}
                      </span>
                    )}
                  </div>
                )}

                {/* QR Code */}
                <div className="flex justify-center mt-3">
                  <SimpleQRCode 
                    value={generateWineQRData(wine.id)} 
                    size={60}
                    wineId={wine.id}
                  />
                </div>
              </div>

              {/* Edit Mode Controls */}
              {isEditMode && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/wine-edit/${wine.id}`);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${wine.name}?`)) {
                        deleteWineCard(wine.id);
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {wineCards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/50 text-lg mb-4">
              No wines in your collection
            </div>
            <Button
              onClick={addWineCard}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Add Your First Wine
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}