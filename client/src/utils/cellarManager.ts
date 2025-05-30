// Cellar management utility for handling scanned wines
export interface CellarWine {
  id: number;
  name: string;
  year: number;
  image: string;
  addedAt: number; // timestamp for ordering
  scannedCount: number; // how many times this wine was scanned
}

const CELLAR_STORAGE_KEY = 'userCellarWines';

export class CellarManager {
  // Get all wines in the cellar, ordered by most recently added/scanned
  static getCellarWines(): CellarWine[] {
    try {
      const stored = localStorage.getItem(CELLAR_STORAGE_KEY);
      if (!stored) return [];
      
      const wines = JSON.parse(stored) as CellarWine[];
      // Sort by addedAt timestamp (most recent first)
      return wines.sort((a, b) => b.addedAt - a.addedAt);
    } catch (error) {
      console.error('Error loading cellar wines:', error);
      return [];
    }
  }

  // Add a wine to the cellar or move existing wine to top
  static addWineToCellar(wine: Omit<CellarWine, 'addedAt' | 'scannedCount'>): void {
    try {
      const existingWines = this.getCellarWines();
      const existingWineIndex = existingWines.findIndex(w => w.id === wine.id);
      
      const timestamp = Date.now();
      
      if (existingWineIndex >= 0) {
        // Wine already exists - update timestamp and increment scan count
        existingWines[existingWineIndex] = {
          ...existingWines[existingWineIndex],
          addedAt: timestamp,
          scannedCount: existingWines[existingWineIndex].scannedCount + 1
        };
      } else {
        // New wine - add to beginning
        const newWine: CellarWine = {
          ...wine,
          addedAt: timestamp,
          scannedCount: 1
        };
        existingWines.unshift(newWine);
      }
      
      localStorage.setItem(CELLAR_STORAGE_KEY, JSON.stringify(existingWines));
    } catch (error) {
      console.error('Error adding wine to cellar:', error);
    }
  }

  // Remove a wine from the cellar
  static removeWineFromCellar(wineId: number): void {
    try {
      const existingWines = this.getCellarWines();
      const filteredWines = existingWines.filter(w => w.id !== wineId);
      localStorage.setItem(CELLAR_STORAGE_KEY, JSON.stringify(filteredWines));
    } catch (error) {
      console.error('Error removing wine from cellar:', error);
    }
  }

  // Check if a wine is in the cellar
  static isWineInCellar(wineId: number): boolean {
    const wines = this.getCellarWines();
    return wines.some(w => w.id === wineId);
  }

  // Clear all wines from cellar
  static clearCellar(): void {
    localStorage.removeItem(CELLAR_STORAGE_KEY);
  }
}

// Generate QR code data for a wine
export function generateWineQRData(wineId: number): string {
  // Create a unique but deterministic QR code data
  const baseUrl = window.location.origin;
  return `${baseUrl}/scan-wine/${wineId}`;
}

// Parse QR code data to extract wine ID
export function parseWineQRData(qrData: string): number | null {
  try {
    const url = new URL(qrData);
    const pathParts = url.pathname.split('/');
    
    if (pathParts[1] === 'scan-wine' && pathParts[2]) {
      const wineId = parseInt(pathParts[2], 10);
      return isNaN(wineId) ? null : wineId;
    }
    
    return null;
  } catch {
    return null;
  }
}