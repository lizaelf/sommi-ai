import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/UseToast";
import { DataSyncManager } from "@/utils/dataSync";
import { PageLayout } from "@/components/shared/PageLayout";
import { WineEditForm } from "@/components/wine-edit/WineEditForm";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorDisplay } from "@/components/shared/ErrorDisplay";

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
      <PageLayout>
        <LoadingSpinner 
          text="Loading wine details..."
          description="Please wait while we prepare the wine editor"
          size="lg"
        />
      </PageLayout>
    );
  }

  if (loadingState === 'error' || !wine) {
    return (
      <PageLayout>
        <ErrorDisplay
          title="Wine Not Found"
          message="The wine you're trying to edit doesn't exist or couldn't be loaded."
          onRetry={() => window.location.reload()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <WineEditForm
        wine={wine}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </PageLayout>
  );
};

export default WineEditRefactored;