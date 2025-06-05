import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";
import { generateWineQRData } from "@/utils/cellarManager";
import { SimpleQRCode } from "@/components/SimpleQRCode";
import { DataSyncManager, type UnifiedWineData } from "@/utils/dataSync";
import { Search, X, Download, Upload, RefreshCw } from "lucide-react";
import placeholderImage from "@assets/Placeholder.png";
// Default images removed - only authentic uploaded images will be displayed

// Use unified wine data interface
type WineCardData = UnifiedWineData;

export default function AdminCRM() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();


  const [isEditMode, setIsEditMode] = useState(false);
  const [wineCards, setWineCards] = useState<WineCardData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [showDataSync, setShowDataSync] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to load wine data
  const loadWineData = () => {
    // Initialize unified data system
    DataSyncManager.initialize();
    
    // Get wines from unified data source
    const allWines = DataSyncManager.getUnifiedWineData();
    
    console.log("Loaded CRM wines:", allWines);
    console.log("Placeholder image path:", placeholderImage);
    setWineCards(allWines);
  };

  // Load wines from unified data system on component mount
  useEffect(() => {
    loadWineData();
  }, []);

  // Refresh wine data when page becomes visible (when returning from wine edit)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadWineData();
      }
    };

    const handleFocus = () => {
      loadWineData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Filter wines based on search term
  const filteredWines = wineCards.filter(wine =>
    wine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to generate wine description using AI
  const generateWineDescription = async (wineName: string, year?: number): Promise<string> => {
    try {
      const response = await fetch('/api/generate-wine-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wineName,
          year
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.description;
      } else {
        console.warn('Failed to generate wine description, using default');
        return `A ${year || 'classic'} wine with distinctive character and elegant profile.`;
      }
    } catch (error) {
      console.warn('Error generating wine description:', error);
      return `A ${year || 'classic'} wine with distinctive character and elegant profile.`;
    }
  };

  const handleAddWine = async () => {
    // Navigate to edit wine page with new wine ID
    const existingWines = DataSyncManager.getUnifiedWineData();
    const newWineId = existingWines.length > 0 ? Math.max(...existingWines.map(w => w.id)) + 1 : 1;
    setLocation(`/wine-edit/${newWineId}?new=true`);
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
    DataSyncManager.removeWine(cardId);
    setWineCards((prev) => prev.filter((card) => card.id !== cardId));

    toast({
      title: "Wine Removed",
      description: "Wine has been removed from your collection.",
    });
  };

  // Data synchronization functions
  const handleExportData = () => {
    try {
      const exportData = DataSyncManager.exportData();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `wine-collection-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Your wine collection has been exported to a JSON file.",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export wine collection data.",
        variant: "destructive",
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        DataSyncManager.importData(importedData);
        loadWineData(); // Refresh the display
        
        toast({
          title: "Import Successful",
          description: `Successfully imported ${Array.isArray(importedData) ? importedData.length : Object.keys(importedData).length} wine entries.`,
        });
      } catch (error) {
        console.error('Import failed:', error);
        toast({
          title: "Import Failed",
          description: "Failed to import wine collection data. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDataSync = () => {
    try {
      DataSyncManager.initialize();
      loadWineData(); // Refresh the display
      
      toast({
        title: "Sync Successful",
        description: "Wine collection data has been synchronized.",
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize wine collection data.",
        variant: "destructive",
      });
    }
  };

  return (
    <div style={{ backgroundColor: "#000000", minHeight: "100vh" }}>
      {/* Fixed Header with Search and Controls */}
      <div className="sticky top-0 z-10 backdrop-blur-md" style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}>
        <div className="p-4">
          {/* Search Bar */}
          {showSearch && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search wines..."
                className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
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
              onClick={handleAddWine}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Add Wine
            </Button>

            <Button
              onClick={() => setShowDataSync(!showDataSync)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Data Sync
            </Button>

            {/* Hidden file input for import */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".json"
              onChange={handleImportData}
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>

            <Button
              onClick={handleExportData}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          {/* Data Sync Panel */}
          {showDataSync && (
            <div className="bg-white/10 border border-white/20 rounded-lg p-4 mb-4">
              <h3 className="text-white font-medium mb-3">Data Synchronization</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleDataSync}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                >
                  Sync Now
                </Button>
                <Button
                  onClick={() => {
                    localStorage.removeItem('wineDataSyncCache');
                    loadWineData();
                    toast({
                      title: "Cache Cleared",
                      description: "Local cache has been cleared and data reloaded.",
                    });
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm"
                >
                  Clear Cache
                </Button>
                <Button
                  onClick={() => {
                    const wineCount = DataSyncManager.getUnifiedWineData().length;
                    toast({
                      title: "Sync Status",
                      description: `Total wines: ${wineCount}, Data loaded successfully`,
                    });
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm"
                >
                  Check Status
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wine Cards Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWines.map((wine) => (
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
                  onLoad={() => console.log(`CRM image loaded: ${wine.name}`)}
                  onError={(e) => {
                    console.log(`CRM placeholder loaded for: ${wine.name}`);
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
        {filteredWines.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/50 text-lg mb-4">
              {searchTerm ? `No wines found matching "${searchTerm}"` : "No wines in your collection"}
            </div>
            {!searchTerm && (
              <Button
                onClick={handleAddWine}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Add Your First Wine
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}