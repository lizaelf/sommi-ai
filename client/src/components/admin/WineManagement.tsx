import React from "react";
import { Upload, Download, Search, RefreshCw } from "lucide-react";
import Button from "@/components/ui/buttons/Button";
import { DataSyncManager, type UnifiedWineData } from "@/utils/dataSync";
import typography from "@/styles/typography";

type WineCardData = UnifiedWineData;

interface WineManagementProps {
  wineCards: WineCardData[];
  searchTerm: string;
  showSearch: boolean;
  showDataSync: boolean;
  isEditMode: boolean;
  onSearchChange: (term: string) => void;
  onToggleSearch: () => void;
  onToggleDataSync: () => void;
  onToggleEditMode: () => void;
  onImportData: () => void;
  onExportData: () => void;
  onEditWine: (wine: WineCardData) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const WineManagement: React.FC<WineManagementProps> = ({
  wineCards,
  searchTerm,
  showSearch,
  showDataSync,
  isEditMode,
  onSearchChange,
  onToggleSearch,
  onToggleDataSync,
  onToggleEditMode,
  onImportData,
  onExportData,
  onEditWine,
  fileInputRef,
}) => {
  return (
    <div>
      {/* Search and Controls */}
      <div style={{ padding: "16px 20px" }}>
        <Button
          variant={showSearch ? "primary" : "secondary"}
          onClick={onToggleSearch}
        >
          <Search size={16} />
          Search
        </Button>
        <Button
          variant={showDataSync ? "primary" : "secondary"}
          onClick={onToggleDataSync}
        >
          <RefreshCw size={16} />
          Data Sync
        </Button>
        <Button
          variant={isEditMode ? "primary" : "secondary"}
          onClick={onToggleEditMode}
        >
          {isEditMode ? "View Mode" : "Edit Mode"}
        </Button>

        {showSearch && (
          <div style={{ marginBottom: "16px" }}>
            <input
              type="text"
              placeholder="Search wines..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "#1A1A1A",
                border: "1px solid #333",
                borderRadius: "8px",
                color: "#FFFFFF",
                ...typography.body1R,
              }}
            />
          </div>
        )}

        {showDataSync && (
          <div style={{ marginBottom: "16px", padding: "16px", backgroundColor: "#1A1A1A", borderRadius: "8px" }}>
            <h4 style={{ ...typography.h2, marginBottom: "12px" }}>
              Data Management
            </h4>
            <div style={{ display: "flex", gap: "12px" }}>
              <Button
                variant="secondary"
                onClick={onImportData}
              >
                <Upload size={16} />
                Import Data
              </Button>
              <Button
                variant="secondary"
                onClick={onExportData}
              >
                <Download size={16} />
                Export Data
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={onImportData}
            />
          </div>
        )}
      </div>

      {/* Wine Cards List */}
      <div style={{ padding: "0 20px" }}>
        <h3 style={{ ...typography.h2, marginBottom: "16px" }}>
          Wine Collection ({wineCards.length})
        </h3>
        
        {wineCards.length === 0 ? (
          <div style={{ 
            ...typography.body1R, 
            color: "#666666", 
            textAlign: "center",
            padding: "40px 20px"
          }}>
            No wines found. Add wines to get started.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {wineCards
              .filter(wine => 
                wine.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((wine) => (
                <div
                  key={wine.id}
                  onClick={() => onEditWine(wine)}
                  style={{
                    padding: "16px",
                    backgroundColor: "#1A1A1A",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#2A2A2A";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1A1A1A";
                  }}
                >
                  <img
                    src={wine.image || "/placeholder.png"}
                    alt={wine.name}
                    style={{
                      width: "60px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "4px",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ ...typography.h2, marginBottom: "4px" }}>
                      {wine.name}
                    </h4>
                    <p style={{ ...typography.body1R, color: "#CECECE" }}>
                      ID: {wine.id}
                    </p>
                  </div>
                  {isEditMode && (
                    <Button variant="secondary">
                      Edit
                    </Button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};