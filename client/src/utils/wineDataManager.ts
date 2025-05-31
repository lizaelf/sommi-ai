import { WINE_CONFIG } from '@shared/wineConfig';
import productImagePath from "@assets/Product Image.png";

export interface WineData {
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

// Get current wine configuration with any saved overrides
export const getCurrentWineConfig = () => {
  try {
    const saved = localStorage.getItem('wine-config');
    if (saved) {
      return { ...WINE_CONFIG, ...JSON.parse(saved) };
    }
    return WINE_CONFIG;
  } catch {
    return WINE_CONFIG;
  }
};

// Save wine configuration updates
export const saveWineConfig = (updates: any) => {
  try {
    const current = getCurrentWineConfig();
    const updated = { ...current, ...updates };
    localStorage.setItem('wine-config', JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save wine config:', error);
    return getCurrentWineConfig();
  }
};

// Get default wines - always available
const getDefaultWines = (): WineData[] => {
  const config = getCurrentWineConfig();
  let wineName = config.name;
  if (wineName.includes('Ridge "') && wineName.includes('"')) {
    wineName = wineName.replace('Ridge "', '').replace('" Dry Creek Zinfandel', '');
  }
  
  return [
    {
      id: 1,
      name: wineName,
      year: config.vintage,
      bottles: 6,
      image: productImagePath,
      ratings: {
        vn: 95,
        jd: 93,
        ws: config.ratings.ws,
        abv: 14.8
      },
      buyAgainLink: "https://ridgewine.com/wines/lytton-springs",
      qrCode: "QR_001",
      qrLink: "https://ridgewine.com/qr/001"
    },
    {
      id: 2,
      name: "Monte Bello Cabernet Sauvignon",
      year: 2021,
      bottles: 2,
      image: productImagePath,
      ratings: { vn: 95, jd: 93, ws: 93, abv: 14.3 },
      buyAgainLink: "https://ridge.com/product/monte-bello",
      qrCode: "QR_002",
      qrLink: "https://ridge.com/wines/monte-bello"
    }
  ];
};

// Get all wines from storage
export const getAllWines = (): WineData[] => {
  try {
    const defaultWines = getDefaultWines();
    const stored = localStorage.getItem('admin-wines');
    
    if (stored) {
      const storedWines = JSON.parse(stored);
      
      // Ensure ID1 and ID2 are always present by merging with defaults
      const mergedWines = [...defaultWines];
      
      // Add or update wines from storage
      storedWines.forEach((storedWine: WineData) => {
        const existingIndex = mergedWines.findIndex(w => w.id === storedWine.id);
        if (existingIndex >= 0) {
          // Update existing wine (ID1 or ID2)
          mergedWines[existingIndex] = storedWine;
        } else {
          // Add new wine (ID > 2)
          mergedWines.push(storedWine);
        }
      });
      
      return mergedWines;
    }
    
    // Return default wines if none stored
    return defaultWines;
  } catch {
    return getDefaultWines();
  }
};

// Save all wines to storage
export const saveAllWines = (wines: WineData[]) => {
  try {
    localStorage.setItem('admin-wines', JSON.stringify(wines));
  } catch (error) {
    console.error('Failed to save wines:', error);
  }
};

// Get wine data for admin editing
export const getEditableWineData = (wineId: number): WineData | null => {
  const wines = getAllWines();
  return wines.find(wine => wine.id === wineId) || null;
};

// Save editable wine data and update configuration
export const saveEditableWineData = (wineData: WineData) => {
  // Get all current wines
  const wines = getAllWines();
  
  // Update or add the wine
  const updatedWines = wines.some(w => w.id === wineData.id)
    ? wines.map(w => w.id === wineData.id ? wineData : w)
    : [...wines, wineData];
  
  // Save all wines
  saveAllWines(updatedWines);
  
  // If this is wine ID 1, also update the main wine config
  if (wineData.id === 1) {
    const configUpdates = {
      name: `Ridge "${wineData.name}" Dry Creek Zinfandel`,
      fullName: `Ridge "${wineData.name}" Dry Creek Zinfandel`,
      vintage: wineData.year,
      ratings: {
        ...getCurrentWineConfig().ratings,
        ws: wineData.ratings.ws
      }
    };
    
    return saveWineConfig(configUpdates);
  }
  
  return getCurrentWineConfig();
};