// utils/audioCache.ts
export class AudioCache {
  private cache = new Map<string, Blob>();
  private maxSize: number;

  constructor(maxSize = 10) {
    this.maxSize = maxSize;
  }

  private generateKey(text: string): string {
    return btoa(text).slice(0, 50);
  }

  get(text: string): Blob | null {
    const key = this.generateKey(text);
    return this.cache.get(key) || null;
  }

  set(text: string, audioBlob: Blob): void {
    const key = this.generateKey(text);
    this.cache.set(key, audioBlob);
    
    // Limit cache size to prevent memory issues
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  has(text: string): boolean {
    const key = this.generateKey(text);
    return this.cache.has(key);
  }
}

// Create a singleton instance for global use
export const audioCache = new AudioCache(10);