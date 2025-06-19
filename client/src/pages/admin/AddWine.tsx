import React, { useState } from "react";
import { useLocation } from "wouter";
import { useStandardToast } from "@/components/ui/feedback/StandardToast";
import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/buttons/Button";
import typography from "@/styles/typography";
import { DataSyncManager } from "@/utils/dataSync";
import { Wine } from "@/types/wine";

const AddWine: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toastSuccess, toastError } = useStandardToast();
  const [loading, setLoading] = useState(false);

  const [wine, setWine] = useState<Omit<Wine, 'id'>>({
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

  const handleSave = async () => {
    if (!wine.name.trim()) {
      toastError("Wine name is required");
      return;
    }

    setLoading(true);
    try {
      const newWine = await DataSyncManager.addWine(wine);
      if (newWine) {
        toastSuccess("Wine added successfully");
        setLocation("/winery-tenant-admin");
      } else {
        toastError("Failed to add wine");
      }
    } catch (error) {
      console.error("Error adding wine:", error);
      toastError("Failed to add wine");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setLocation("/winery-tenant-admin");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <AppHeader 
        title="Add New Wine" 
        showBackButton 
        onBack={handleCancel}
      />
      
      <div className="pt-[75px] p-6 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Wine Name */}
          <div>
            <label style={typography.body1R} className="block mb-2 text-white/80">
              Wine Name *
            </label>
            <input
              type="text"
              value={wine.name}
              onChange={(e) => setWine({ ...wine, name: e.target.value })}
              className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
              placeholder="Enter wine name"
              required
            />
          </div>

          {/* Year and Bottles Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={typography.body1R} className="block mb-2 text-white/80">
                Vintage Year
              </label>
              <input
                type="number"
                value={wine.year}
                onChange={(e) => setWine({ ...wine, year: parseInt(e.target.value) || new Date().getFullYear() })}
                className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                placeholder="Year"
                min="1900"
                max={new Date().getFullYear() + 5}
              />
            </div>
            <div>
              <label style={typography.body1R} className="block mb-2 text-white/80">
                Number of Bottles
              </label>
              <input
                type="number"
                value={wine.bottles}
                onChange={(e) => setWine({ ...wine, bottles: parseInt(e.target.value) || 0 })}
                className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                placeholder="Bottles"
                min="0"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={typography.body1R} className="block mb-2 text-white/80">
              Location/Region
            </label>
            <input
              type="text"
              value={wine.location || ""}
              onChange={(e) => setWine({ ...wine, location: e.target.value })}
              className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
              placeholder="e.g., Napa Valley, California"
            />
          </div>

          {/* Description */}
          <div>
            <label style={typography.body1R} className="block mb-2 text-white/80">
              Description
            </label>
            <textarea
              value={wine.description || ""}
              onChange={(e) => setWine({ ...wine, description: e.target.value })}
              className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none resize-none"
              placeholder="Wine description, tasting notes, etc."
              rows={4}
            />
          </div>

          {/* Image URL */}
          <div>
            <label style={typography.body1R} className="block mb-2 text-white/80">
              Wine Image URL
            </label>
            <input
              type="url"
              value={wine.image}
              onChange={(e) => setWine({ ...wine, image: e.target.value })}
              className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
              placeholder="https://example.com/wine-image.jpg"
            />
          </div>

          {/* Ratings Section */}
          <div>
            <h3 style={typography.h2} className="mb-4 text-white">Wine Ratings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={typography.body1R} className="block mb-2 text-white/80">
                  Vinous (VN) Rating
                </label>
                <input
                  type="number"
                  value={wine.ratings.vn}
                  onChange={(e) => setWine({ 
                    ...wine, 
                    ratings: { ...wine.ratings, vn: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  placeholder="0-100"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label style={typography.body1R} className="block mb-2 text-white/80">
                  James Suckling (JD) Rating
                </label>
                <input
                  type="number"
                  value={wine.ratings.jd}
                  onChange={(e) => setWine({ 
                    ...wine, 
                    ratings: { ...wine.ratings, jd: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  placeholder="0-100"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label style={typography.body1R} className="block mb-2 text-white/80">
                  Wine Spectator (WS) Rating
                </label>
                <input
                  type="number"
                  value={wine.ratings.ws}
                  onChange={(e) => setWine({ 
                    ...wine, 
                    ratings: { ...wine.ratings, ws: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  placeholder="0-100"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label style={typography.body1R} className="block mb-2 text-white/80">
                  Alcohol by Volume (ABV) %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={wine.ratings.abv}
                  onChange={(e) => setWine({ 
                    ...wine, 
                    ratings: { ...wine.ratings, abv: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  placeholder="0.0-20.0"
                  min="0"
                  max="20"
                />
              </div>
            </div>
          </div>

          {/* Buy Again Link */}
          <div>
            <label style={typography.body1R} className="block mb-2 text-white/80">
              Purchase Link
            </label>
            <input
              type="url"
              value={wine.buyAgainLink || ""}
              onChange={(e) => setWine({ ...wine, buyAgainLink: e.target.value })}
              className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
              placeholder="https://winery.com/purchase-link"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button 
              variant="secondary" 
              onClick={handleCancel}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              className="flex-1"
              disabled={loading || !wine.name.trim()}
            >
              {loading ? "Adding..." : "Add Wine"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWine;