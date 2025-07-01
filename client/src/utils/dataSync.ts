import { Wine } from "@/types/wine";
import getWineDB from "@/lib/indexedDB";

export class DataSyncManager {
  static async getUnifiedWineData(): Promise<Wine[]> {
    try {
      const response = await fetch('/api/wines');
      return response.ok ? await response.json() : [];
    } catch {
      return [];
    }
  }

  static async getWineById(id: number): Promise<Wine | undefined> {
    try {
      const response = await fetch(`/api/wines/${id}`);
      return response.ok ? await response.json() : undefined;
    } catch {
      return undefined;
    }
  }

  static async addWine(wine: Omit<Wine, 'id'>): Promise<Wine | undefined> {
    try {
      const response = await fetch('/api/wines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wine),
      });
      return response.ok ? await response.json() : undefined;
    } catch {
      return undefined;
    }
  }

  static async updateWine(id: number, wine: Partial<Wine>): Promise<Wine | undefined> {
    try {
      const response = await fetch(`/api/wines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wine),
      });
      return response.ok ? await response.json() : undefined;
    } catch {
      return undefined;
    }
  }

  static async removeWine(id: number): Promise<boolean> {
    try {
      const response = await fetch(`/api/wines/${id}`, { method: 'DELETE' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export async function getAllWines(): Promise<Wine[]> {
  return await DataSyncManager.getUnifiedWineData();
}

export async function getAllWinesAsync(): Promise<Wine[]> {
  return await DataSyncManager.getUnifiedWineData();
}

export async function saveAllWines(wines: Wine[]): Promise<void> {
  // Можно реализовать массовое обновление через API, если потребуется
  // Сейчас функция-заглушка
}