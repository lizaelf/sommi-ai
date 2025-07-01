import { Wine } from "@shared/schema";

export class WineDataManager {
  private static instance: WineDataManager;
  private wines: Wine[] = [];
  private isLoaded = false;

  static getInstance(): WineDataManager {
    if (!WineDataManager.instance) {
      WineDataManager.instance = new WineDataManager();
    }
    return WineDataManager.instance;
  }

  async loadWines(): Promise<Wine[]> {
    if (this.isLoaded) {
      return this.wines;
    }

    try {
      // First try to load from database
      const response = await fetch('/api/wines');
      if (response.ok) {
        this.wines = await response.json();
        console.log(`Loaded ${this.wines.length} wines from database`);
        this.isLoaded = true;
        return this.wines;
      }
    } catch (error) {
      console.error('Error loading wines from database:', error);
    }

    // Fallback to localStorage if database fails
    return this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): Wine[] {
    try {
      const storedData = localStorage.getItem('unifiedWineData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        this.wines = parsedData.wines || [];
        console.log(`Loaded ${this.wines.length} wines from localStorage`);
        
        // Attempt to migrate to database
        this.migrateToDatabase();
        
        return this.wines;
      }
    } catch (error) {
      console.error('Error loading wines from localStorage:', error);
    }
    
    return [];
  }

  private async migrateToDatabase(): Promise<void> {
    try {
      console.log('Migrating wine data from localStorage to database...');
      const response = await fetch('/api/migrate-wines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wines: this.wines }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Migration result:', result.message);
        
        // Clear localStorage after successful migration
        if (result.success && result.migrated > 0) {
          localStorage.removeItem('unifiedWineData');
          console.log('Cleared localStorage after successful migration');
        }
      }
    } catch (error) {
      console.error('Error migrating wine data:', error);
    }
  }

  async getWine(id: number): Promise<Wine | undefined> {
    const wines = await this.loadWines();
    return wines.find(wine => wine.id === id);
  }

  async getAllWines(): Promise<Wine[]> {
    return this.loadWines();
  }

  async updateWine(id: number, updateData: Partial<Wine>): Promise<Wine | null> {
    try {
      const response = await fetch(`/api/wines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedWine = await response.json();
        
        // Update local cache
        const index = this.wines.findIndex(wine => wine.id === id);
        if (index !== -1) {
          this.wines[index] = updatedWine;
        }
        
        return updatedWine;
      }
    } catch (error) {
      console.error('Error updating wine:', error);
    }
    
    return null;
  }

  async createWine(wineData: Omit<Wine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Wine | null> {
    try {
      const response = await fetch('/api/wines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wineData),
      });

      if (response.ok) {
        const newWine = await response.json();
        this.wines.push(newWine);
        return newWine;
      }
    } catch (error) {
      console.error('Error creating wine:', error);
    }
    
    return null;
  }

  // Legacy compatibility for existing code
  getWineDisplayData() {
    return this.wines.map(wine => ({
      id: wine.id,
      name: wine.name,
      year: wine.year,
      bottles: wine.bottles || 0,
      image: wine.image,
      ratings: wine.ratings,
      buyAgainLink: wine.buyAgainLink,
      qrCode: wine.qrCode,
      qrLink: wine.qrLink,
      location: wine.location,
      description: wine.description,
      foodPairing: wine.foodPairing,
      conversationHistory: wine.conversationHistory || [],
      technicalDetails: wine.technicalDetails,
      hasCustomImage: wine.hasCustomImage || false,
      imagePrefix: wine.imagePrefix,
      imageSize: wine.imageSize || 0
    }));
  }
}

export const wineDataManager = WineDataManager.getInstance();