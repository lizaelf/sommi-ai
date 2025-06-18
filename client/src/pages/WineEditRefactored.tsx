import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/UseToast";
import { DataSyncManager } from "@/utils/dataSync";
import AppHeader, { HeaderSpacer } from "@/components/pages/shared/AppHeader";
import { WineEditForm } from "@/components/pages/wine-edit/WineEditForm";
import ShiningText from "@/components/pages/ui/ShiningText";
import typography from "@/styles/typography";

interface Wine {
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
}

const WineEditRefactored: React.FC = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [wine, setWine] = useState<Wine | null>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    const loadWine = async () => {
      try {
        setLoadingState('loading');
        
        if (!id) {
          setLoadingState('error');
          return;
        }

        const wineId = parseInt(id);
        if (isNaN(wineId)) {
          setLoadingState('error');
          return;
        }

        await DataSyncManager.initialize();
        const wineData = DataSyncManager.getWineById(wineId);
        
        if (!wineData) {
          setLoadingState('error');
          return;
        }

        const wine: Wine = {
          id: wineData.id,
          name: wineData.name,
          year: wineData.year,
          bottles: wineData.bottles,
          image: wineData.image,
          ratings: wineData.ratings,
        };

        setWine(wine);
        setLoadingState('loaded');
        
      } catch (error) {
        console.error("Error loading wine:", error);
        setLoadingState('error');
      }
    };

    loadWine();
  }, [id]);

  const handleSave = async (wineData: Wine) => {
    try {
      // Update wine in DataSyncManager
      DataSyncManager.addOrUpdateWine({
        ...wineData,
        buyAgainLink: "",
        qrCode: "",
        qrLink: "",
      });

      toast({
        title: "Wine updated",
        description: "Wine details have been saved successfully.",
      });

      // Navigate back to wine details
      setLocation(`/wine-details/${wineData.id}`);
    } catch (error) {
      console.error("Error saving wine:", error);
      toast({
        title: "Error",
        description: "Failed to save wine details.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setLocation(wine ? `/wine-details/${wine.id}` : '/');
  };

  if (loadingState === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white mx-auto" style={{ maxWidth: "1200px" }}>
        <AppHeader />
        <HeaderSpacer />
        <div style={{ padding: "40px", textAlign: "center" }}>
          <ShiningText text="Loading wine details..." />
          <p style={{ ...typography.body1R, color: "#666666", marginTop: "16px" }}>
            Please wait while we prepare the wine editor
          </p>
        </div>
      </div>
    );
  }

  if (loadingState === 'error' || !wine) {
    return (
      <div className="min-h-screen bg-black text-white mx-auto" style={{ maxWidth: "1200px" }}>
        <AppHeader />
        <HeaderSpacer />
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2 style={{ ...typography.h1, color: "#FF6B6B", marginBottom: "16px" }}>
            Wine Not Found
          </h2>
          <p style={{ ...typography.body, color: "#CECECE" }}>
            The wine you're trying to edit doesn't exist or couldn't be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white mx-auto" style={{ maxWidth: "1200px" }}>
      <AppHeader />
      <HeaderSpacer />
      <WineEditForm
        wine={wine}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default WineEditRefactored;