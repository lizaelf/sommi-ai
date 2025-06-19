import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useStandardToast } from "@/components/ui/feedback/StandardToast";
import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/buttons/Button";
import typography from "@/styles/typography";
import { DataSyncManager } from "@/utils/dataSync";
import { Wine } from "@/types/wine";

const SimpleWineEdit: React.FC = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toastSuccess, toastError } = useStandardToast();
  const [wine, setWine] = useState<Wine | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewWine, setIsNewWine] = useState(false);

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

          {/* Image URL */}
          <div>
            <label style={typography.body1R} className="block mb-2">Image URL</label>
            <input
              type="text"
              value={wine.image}
              onChange={(e) => setWine({ ...wine, image: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="Image URL"
            />
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