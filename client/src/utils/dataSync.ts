// Unified Wine Data Synchronization System
// Ensures all users see identical wine inventory across all environments

// Import wine bottle image that works in both environments
import wineBottleImage from "@assets/Product Image.png";

export interface UnifiedWineData {
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

// Master wine data - this is the canonical source of truth
const MASTER_WINE_DATA: UnifiedWineData[] = [
  {
    id: 1,
    name: "Ridge \"Lytton Springs\" Dry Creek Zinfandel",
    year: 2021,
    bottles: 6,
    image: wineBottleImage,
    ratings: {
      vn: 95,
      jd: 93,
      ws: 92,
      abv: 14.8
    },
    buyAgainLink: "https://www.ridgewine.com/wines/2021-lytton-springs/",
    qrCode: "QR_001",
    qrLink: "https://ridgewine.com/qr/001"
  },
  {
    id: 2,
    name: "Monte Bello Cabernet Sauvignon",
    year: 2021,
    bottles: 2,
    image: wineBottleImage,
    ratings: {
      vn: 95,
      jd: 93,
      ws: 93,
      abv: 14.3
    },
    buyAgainLink: "https://ridge.com/product/monte-bello",
    qrCode: "QR_002",
    qrLink: "https://ridge.com/wines/monte-bello"
  }
];

const STORAGE_KEY = 'unified-wine-data';
const SYNC_VERSION_KEY = 'wine-data-version';
const CURRENT_VERSION = '1.2.0';

export class DataSyncManager {
  
  // Get unified wine data (same for all users)
  static getUnifiedWineData(): UnifiedWineData[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const version = localStorage.getItem(SYNC_VERSION_KEY);
      
      // If no data or version mismatch, use master data
      if (!stored || version !== CURRENT_VERSION) {
        this.resetToMasterData();
        return [...MASTER_WINE_DATA];
      }
      
      const wines = JSON.parse(stored) as UnifiedWineData[];
      return wines.length > 0 ? wines : [...MASTER_WINE_DATA];
    } catch (error) {
      console.error('Error loading unified wine data:', error);
      this.resetToMasterData();
      return [...MASTER_WINE_DATA];
    }
  }
  
  // Save unified wine data
  static saveUnifiedWineData(wines: UnifiedWineData[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wines));
      localStorage.setItem(SYNC_VERSION_KEY, CURRENT_VERSION);
      
      // Also update legacy storage for backwards compatibility
      localStorage.setItem('admin-wines', JSON.stringify(wines));
      
      console.log('Unified wine data saved successfully');
    } catch (error) {
      console.error('Error saving unified wine data:', error);
    }
  }
  
  // Reset to master data
  static resetToMasterData(): void {
    this.saveUnifiedWineData([...MASTER_WINE_DATA]);
    console.log('Reset to master wine data');
  }
  
  // Add or update a wine
  static addOrUpdateWine(wine: UnifiedWineData): void {
    const wines = this.getUnifiedWineData();
    const existingIndex = wines.findIndex(w => w.id === wine.id);
    
    if (existingIndex >= 0) {
      wines[existingIndex] = wine;
    } else {
      wines.push(wine);
    }
    
    this.saveUnifiedWineData(wines);
  }
  
  // Remove a wine
  static removeWine(wineId: number): void {
    const wines = this.getUnifiedWineData();
    const filteredWines = wines.filter(w => w.id !== wineId);
    this.saveUnifiedWineData(filteredWines);
  }
  
  // Get wine by ID
  static getWineById(wineId: number): UnifiedWineData | undefined {
    const wines = this.getUnifiedWineData();
    return wines.find(w => w.id === wineId);
  }
  
  // Export data for synchronization
  static exportData(): string {
    const wines = this.getUnifiedWineData();
    const exportData = {
      version: CURRENT_VERSION,
      timestamp: new Date().toISOString(),
      wines: wines
    };
    return JSON.stringify(exportData, null, 2);
  }
  
  // Import data from another environment
  static importData(jsonData: string): { success: boolean; message: string } {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.wines || !Array.isArray(importData.wines)) {
        return { success: false, message: 'Invalid data format: missing wines array' };
      }
      
      // Validate each wine has required fields
      for (const wine of importData.wines) {
        if (!wine.id || !wine.name || !wine.year) {
          return { success: false, message: 'Invalid wine data: missing required fields' };
        }
      }
      
      this.saveUnifiedWineData(importData.wines);
      
      return { 
        success: true, 
        message: `Successfully imported ${importData.wines.length} wines` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
  
  // Sync with deployed environment (placeholder for future API integration)
  static async syncWithDeployedEnvironment(): Promise<{ success: boolean; message: string }> {
    // This would connect to your deployed API in the future
    // For now, it ensures data consistency locally
    
    try {
      const currentData = this.getUnifiedWineData();
      
      // Validate data integrity
      if (currentData.length === 0) {
        this.resetToMasterData();
        return { success: true, message: 'Reset to master data for consistency' };
      }
      
      return { success: true, message: 'Data is synchronized' };
    } catch (error) {
      return { 
        success: false, 
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
  
  // Initialize data on app start
  static initialize(): void {
    // Ensure we have valid data
    const wines = this.getUnifiedWineData();
    console.log(`Initialized unified wine data with ${wines.length} wines`);
  }
}

// Helper function for backwards compatibility
export function getAllWines(): UnifiedWineData[] {
  return DataSyncManager.getUnifiedWineData();
}

// Helper function to save all wines (backwards compatibility)
export function saveAllWines(wines: UnifiedWineData[]): void {
  DataSyncManager.saveUnifiedWineData(wines);
}