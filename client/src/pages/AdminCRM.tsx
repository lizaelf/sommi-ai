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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const [isEditMode, setIsEditMode] = useState(false);
  const [wineCards, setWineCards] = useState<WineCardData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [showDataSync, setShowDataSync] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to load wine data
  const loadWineData = () => {
    try {
      console.log("AdminCRM: Starting to load wine data...");
      setIsLoading(true);
      setError(null);
      
      // Initialize unified data system
      DataSyncManager.initialize();
      
      // Get wines from unified data source
      const allWines = DataSyncManager.getUnifiedWineData();
      
      console.log("AdminCRM: Loaded wines:", allWines.length, "wines");
      console.log("AdminCRM: Wine data:", allWines.map(w => ({ id: w.id, name: w.name, hasImage: !!w.image })));
      setWineCards(allWines);
      setIsLoading(false);
    } catch (error) {
      console.error("AdminCRM: Error loading wine data:", error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setWineCards([]);
      setIsLoading(false);
    }
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
      link.download = `wine-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data Exported",
        description: "Wine data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export wine data.",
        variant: "destructive"
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const result = DataSyncManager.importData(jsonData);
        
        if (result.success) {
          // Refresh the wine cards display
          const updatedWines = DataSyncManager.getUnifiedWineData();
          setWineCards(updatedWines);
          
          toast({
            title: "Data Imported",
            description: result.message,
          });
        } else {
          toast({
            title: "Import Failed",
            description: result.message,
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid file format or corrupted data.",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(file);
    // Reset the input
    if (event.target) event.target.value = '';
  };

  const handleSyncCheck = async () => {
    try {
      const result = await DataSyncManager.syncWithDeployedEnvironment();
      
      if (result.success) {
        // Refresh the wine cards display
        const updatedWines = DataSyncManager.getUnifiedWineData();
        setWineCards(updatedWines);
        
        toast({
          title: "Sync Complete",
          description: result.message,
        });
      } else {
        toast({
          title: "Sync Warning",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to check synchronization status.",
        variant: "destructive"
      });
    }
  };



  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center" style={{
        backgroundColor: "#0A0A0A !important"
      }}>
        <div className="text-center">
          <h2 className="text-xl mb-4">Error Loading Admin CRM</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadWineData}>Retry</Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center" style={{
        backgroundColor: "#0A0A0A !important"
      }}>
        <div className="text-center">
          <h2 className="text-xl">Loading Wine Collection...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white" style={{
      backgroundColor: "#0A0A0A !important",
      backgroundImage: "none !important"
    }}>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <h1 className="text-lg font-medium text-white text-left flex-1 truncate overflow-hidden whitespace-nowrap">Admin</h1>
        <div className="flex gap-3">
          {isEditMode && (
            <Button 
              onClick={() => {
                // Save all wine data to unified system
                console.log('AdminCRM: Saving wine data:', wineCards.map(w => ({ id: w.id, name: w.name, hasCustomImage: w.image?.startsWith('data:') })));
                DataSyncManager.saveUnifiedWineData(wineCards);
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
      <div style={{ paddingTop: showSearch ? "160px" : "72px" }}>
        <div>
          {/* Search Bar - Full Screen Width Below Header */}
          {showSearch && (
            <div style={{
              position: "fixed",
              top: "72px",
              left: "0",
              right: "0",
              padding: "16px",
              zIndex: 40
            }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search wines by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="contact-form-input"
                  style={{
                    ...typography.body1R,
                    color: "rgba(255, 255, 255, 0.60) !important",
                    height: "56px",
                    width: "100%",
                    fontSize: "16px",
                    fontWeight: "400",
                    padding: "0 16px 0 16px",
                    paddingRight: "48px"
                  }}
                />
                <div
                  onClick={() => {
                    setSearchTerm("");
                  }}
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "24px",
                    height: "24px",
                    color: "rgba(255, 255, 255, 0.6)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <X size={16} />
                </div>
              </div>
            </div>
          )}

          {/* Data Sync Interface */}
          {showDataSync && (
            <div style={{
              padding: "16px",
              backgroundColor: "#191919",
              margin: "16px",
              borderRadius: "16px"
            }}>
              <div style={{
                ...typography.body1R,
                color: "white",
                marginBottom: "16px",
                fontSize: "18px",
                fontWeight: "600"
              }}>
                Data Synchronization
              </div>
              
              <div style={{
                ...typography.body1R,
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "16px",
                fontSize: "14px"
              }}>
                Sync wine inventory data between Replit development and deployed environments
              </div>
              
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <Button
                  onClick={handleExportData}
                  style={{
                    backgroundColor: "#007AFF",
                    color: "white",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <Download size={16} />
                  Export Data
                </Button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportData}
                  accept=".json"
                  style={{ display: 'none' }}
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    backgroundColor: "#34C759",
                    color: "white",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <Upload size={16} />
                  Import Data
                </Button>
                
                <Button
                  onClick={handleSyncCheck}
                  style={{
                    backgroundColor: "#FF9500",
                    color: "white",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <RefreshCw size={16} />
                  Check Sync Status
                </Button>
              </div>
              
              <div style={{
                ...typography.body1R,
                color: "rgba(255, 255, 255, 0.5)",
                marginTop: "16px",
                fontSize: "12px",
                lineHeight: "1.4"
              }}>
                • Export: Download current wine data to share between environments<br/>
                • Import: Upload wine data from another environment<br/>
                • Check Sync: Verify data consistency and integrity
              </div>
            </div>
          )}

          {/* Wine Cards Preview */}
          <div>
            <div style={{ padding: "16px" }}>
              <h3 style={{ color: "white", marginBottom: "16px" }}>
                {filteredWines.length} wines found
              </h3>
              
              {filteredWines.length === 0 ? (
                <div style={{ 
                  color: "rgba(255, 255, 255, 0.6)", 
                  textAlign: "center", 
                  padding: "32px" 
                }}>
                  No wines in collection. Click "Add Wine" to get started.
                </div>
              ) : (
                filteredWines.map((card) => (
                  <div 
                    key={card.id}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "12px",
                      cursor: "pointer",
                      border: "1px solid rgba(255, 255, 255, 0.1)"
                    }}
                    onClick={() => setLocation(`/wine-edit/${card.id}`)}
                  >
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "16px" 
                    }}>
                      {/* Image */}
                      <div style={{ 
                        width: "60px", 
                        height: "80px", 
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {card.image && card.image.startsWith('data:') ? (
                          <img
                            src={card.image}
                            alt={card.name}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain"
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            border: "2px dashed rgba(255, 255, 255, 0.3)",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            color: "rgba(255, 255, 255, 0.5)"
                          }}>
                            No Image
                          </div>
                        )}
                      </div>
                      
                      {/* Wine Info */}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          color: "white", 
                          margin: "0 0 8px 0",
                          fontSize: "16px",
                          fontWeight: "500"
                        }}>
                          {card.name}
                        </h4>
                        <div style={{ 
                          color: "rgba(255, 255, 255, 0.7)",
                          fontSize: "14px"
                        }}>
                          {card.year} • {card.bottles} bottles
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
