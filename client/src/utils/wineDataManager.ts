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

// Get wine data for admin editing
export const getEditableWineData = (wineId: number): WineData | null => {
  const config = getCurrentWineConfig();
  
  if (wineId === 1) {
    // Extract wine name from the full name
    let wineName = config.name;
    if (wineName.includes('Ridge "') && wineName.includes('"')) {
      wineName = wineName.replace('Ridge "', '').replace('" Dry Creek Zinfandel', '');
    }
    
    return {
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
    };
  }
  
  return null;
};

// Save editable wine data and update configuration
export const saveEditableWineData = (wineData: WineData) => {
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