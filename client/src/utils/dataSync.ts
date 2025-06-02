// Unified Wine Data Synchronization System
// Ensures all users see identical wine inventory across all environments

// No default images - only authentic uploaded images will be displayed

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
  location?: string;
  description?: string;
  foodPairing?: string[];
  conversationHistory?: Array<{
    id: string;
    timestamp: number;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: number;
    }>;
  }>;
}

// Master wine data - this is the canonical source of truth
const MASTER_WINE_DATA: UnifiedWineData[] = [
  {
    id: 1,
    name: "Ridge \"Lytton Springs\" Dry Creek Zinfandel",
    year: 2021,
    bottles: 6,
    image: "",
    ratings: {
      vn: 95,
      jd: 93,
      ws: 92,
      abv: 14.8
    },
    buyAgainLink: "https://www.ridgewine.com/wines/2021-lytton-springs/",
    qrCode: "QR_001",
    qrLink: "/scanned?wine=1",
    location: "Dry Creek Valley, Sonoma County, California",
    description: "A bold and complex Zinfandel blend that showcases the distinctive terroir of Lytton Springs vineyard. Known for its rich berry flavors, spice complexity, and structured tannins.",
    foodPairing: ["Grilled lamb", "BBQ ribs", "Aged cheddar", "Dark chocolate desserts"],
    conversationHistory: []
  },
  {
    id: 2,
    name: "Monte Bello Cabernet Sauvignon",
    year: 2021,
    bottles: 2,
    image: "",
    ratings: {
      vn: 95,
      jd: 93,
      ws: 93,
      abv: 14.3
    },
    buyAgainLink: "https://ridge.com/product/monte-bello",
    qrCode: "QR_002",
    qrLink: "/scanned?wine=2",
    location: "Santa Cruz Mountains, California",
    description: "An iconic Bordeaux-style blend from Ridge's flagship Monte Bello vineyard. This wine represents the pinnacle of California Cabernet Sauvignon with exceptional aging potential.",
    foodPairing: ["Prime rib", "Filet mignon", "Roasted duck", "Mushroom risotto"],
    conversationHistory: []
  },
  {
    id: 3,
    name: "Geyserville Zinfandel Blend",
    year: 2020,
    bottles: 4,
    image: "",
    ratings: {
      vn: 92,
      jd: 90,
      ws: 91,
      abv: 14.1
    },
    buyAgainLink: "https://www.ridgewine.com/wines/2020-geyserville/",
    qrCode: "QR_003",
    qrLink: "/scanned?wine=3",
    location: "Geyserville, Sonoma County, California",
    description: "A sophisticated blend of Zinfandel, Carignane, and Petite Sirah from historic vineyards. This wine embodies the character of Geyserville's unique microclimate and volcanic soils.",
    foodPairing: ["Braised short ribs", "Wild boar", "Grilled portobello", "Sharp blue cheese"],
    conversationHistory: []
  }
];

const STORAGE_KEY = 'unified-wine-data';
const SYNC_VERSION_KEY = 'wine-data-version';
const CUSTOM_IMAGES_KEY = 'custom-wine-images';
const CURRENT_VERSION = '1.7.0';

export class DataSyncManager {
  
  // Get unified wine data (same for all users)
  static getUnifiedWineData(): UnifiedWineData[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const version = localStorage.getItem(SYNC_VERSION_KEY);
      
      console.log('DataSyncManager: Loading data - stored exists:', !!stored, 'version match:', version === CURRENT_VERSION);
      
      // If no data or version mismatch, use master data
      if (!stored || version !== CURRENT_VERSION) {
        console.log('DataSyncManager: Resetting to master data due to version mismatch or missing data');
        this.resetToMasterData();
        return [...MASTER_WINE_DATA];
      }
      
      const wines = JSON.parse(stored) as UnifiedWineData[];
      console.log('DataSyncManager: Loaded from storage:', wines.map(w => ({ 
        id: w.id, 
        name: w.name, 
        hasCustomImage: w.image?.startsWith('data:'),
        imagePrefix: w.image?.substring(0, 30) + '...',
        imageSize: w.image?.length || 0
      })));
      
      // Check if we have any corrupted image data and fix it
      const cleanedWines = wines.map(wine => {
        if (wine.image && !wine.image.startsWith('data:') && !wine.image.startsWith('/@fs') && !wine.image.startsWith('/')) {
          console.log(`DataSyncManager: Found corrupted image data for wine ${wine.id}, reverting to master`);
          const masterWine = MASTER_WINE_DATA.find(m => m.id === wine.id);
          return { ...wine, image: masterWine?.image || wine.image };
        }
        return wine;
      });
      
      return cleanedWines.length > 0 ? cleanedWines : [...MASTER_WINE_DATA];
    } catch (error) {
      console.error('Error loading unified wine data:', error);
      this.resetToMasterData();
      return [...MASTER_WINE_DATA];
    }
  }
  
  // Save unified wine data
  static saveUnifiedWineData(wines: UnifiedWineData[]): void {
    try {
      const dataString = JSON.stringify(wines);
      const dataSize = new Blob([dataString]).size;
      console.log(`DataSyncManager: Attempting to save ${wines.length} wines (${Math.round(dataSize / 1024)}KB)`);
      
      // Check if data might be too large for localStorage (5MB limit)
      if (dataSize > 4 * 1024 * 1024) { // 4MB warning threshold
        console.warn('Wine data is very large, may exceed localStorage limits');
      }
      
      localStorage.setItem(STORAGE_KEY, dataString);
      localStorage.setItem(SYNC_VERSION_KEY, CURRENT_VERSION);
      
      // Also update legacy storage for backwards compatibility
      localStorage.setItem('admin-wines', dataString);
      
      console.log('Unified wine data saved successfully');
    } catch (error) {
      console.error('Error saving unified wine data:', error);
      
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded. Wine data too large.');
        throw new Error('Storage limit exceeded. Try using smaller images or remove unused wines.');
      }
      
      throw error;
    }
  }
  
  // Get wine by ID
  static getWineById(id: number): UnifiedWineData | undefined {
    const wines = this.getUnifiedWineData();
    const wine = wines.find(w => w.id === id);
    console.log(`DataSyncManager: Looking for wine ID ${id}, found:`, wine ? { id: wine.id, name: wine.name } : 'not found');
    return wine;
  }

  // Reset to master data
  static resetToMasterData(): void {
    const currentWines = this.getUnifiedWineData();
    const masterWithImages = MASTER_WINE_DATA.map(masterWine => {
      const existingWine = currentWines.find(w => w.id === masterWine.id);
      return {
        ...masterWine,
        // Preserve the existing image if it exists
        image: existingWine?.image || masterWine.image
      };
    });
    this.saveUnifiedWineData(masterWithImages);
    console.log('Reset to master wine data while preserving images');
  }
  
  // Add or update a wine
  static addOrUpdateWine(wine: UnifiedWineData): void {
    console.log(`DataSyncManager: Adding/updating wine with ID ${wine.id}:`, { id: wine.id, name: wine.name, year: wine.year });
    const wines = this.getUnifiedWineData();
    console.log(`DataSyncManager: Current wines before add/update:`, wines.map(w => ({ id: w.id, name: w.name })));
    
    const existingIndex = wines.findIndex(w => w.id === wine.id);
    
    if (existingIndex >= 0) {
      console.log(`DataSyncManager: Updating existing wine at index ${existingIndex}`);
      wines[existingIndex] = wine;
    } else {
      console.log(`DataSyncManager: Adding new wine`);
      wines.push(wine);
    }
    
    console.log(`DataSyncManager: Wines after add/update:`, wines.map(w => ({ id: w.id, name: w.name })));
    this.saveUnifiedWineData(wines);
    console.log(`DataSyncManager: Wine ${wine.id} add/update completed`);
  }
  
  // Remove a wine
  static removeWine(wineId: number): void {
    console.log(`DataSyncManager: Removing wine with ID ${wineId}`);
    const wines = this.getUnifiedWineData();
    console.log(`DataSyncManager: Current wines before removal:`, wines.map(w => ({ id: w.id, name: w.name })));
    
    const filteredWines = wines.filter(w => w.id !== wineId);
    console.log(`DataSyncManager: Wines after filtering:`, filteredWines.map(w => ({ id: w.id, name: w.name })));
    
    this.saveUnifiedWineData(filteredWines);
    console.log(`DataSyncManager: Wine ${wineId} removal completed`);
  }
  
  // Update wine-specific metadata
  static updateWineMetadata(wineId: number, metadata: {
    location?: string;
    description?: string;
    foodPairing?: string[];
  }): void {
    const wines = this.getUnifiedWineData();
    const wine = wines.find(w => w.id === wineId);
    
    if (wine) {
      if (metadata.location) wine.location = metadata.location;
      if (metadata.description) wine.description = metadata.description;
      if (metadata.foodPairing) wine.foodPairing = metadata.foodPairing;
      
      this.saveUnifiedWineData(wines);
      console.log(`Updated metadata for wine ID ${wineId}`);
    }
  }
  
  // Add conversation to wine history
  static addConversationToWine(wineId: number, conversation: {
    id: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: number;
    }>;
  }): void {
    const wines = this.getUnifiedWineData();
    const wine = wines.find(w => w.id === wineId);
    
    if (wine) {
      if (!wine.conversationHistory) {
        wine.conversationHistory = [];
      }
      
      wine.conversationHistory.push({
        id: conversation.id,
        timestamp: Date.now(),
        messages: conversation.messages
      });
      
      // Keep only the last 10 conversations to prevent excessive storage
      if (wine.conversationHistory.length > 10) {
        wine.conversationHistory = wine.conversationHistory.slice(-10);
      }
      
      this.saveUnifiedWineData(wines);
      console.log(`Added conversation to wine ID ${wineId} history`);
    }
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