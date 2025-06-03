// Image Deduplication Utility
// Prevents duplicate wine images from being uploaded or stored

export interface ImageHash {
  hash: string;
  filename: string;
  size: number;
  timestamp: number;
}

// Generate hash from image data for duplicate detection
export async function generateImageHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        resolve(hashHex);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// Check if image already exists in the wine collection
export function isDuplicateImage(newHash: string, existingHashes: ImageHash[]): ImageHash | null {
  return existingHashes.find(existing => existing.hash === newHash) || null;
}

// Generate unique filename to prevent conflicts
export function generateUniqueFilename(originalName: string, wineId: number): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop() || 'jpeg';
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  return `wine-${wineId}-${sanitizedBaseName}-${timestamp}.${extension}`;
}

// Validate image file before processing
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, and WebP images are allowed'
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image size must be less than 5MB'
    };
  }

  return { valid: true };
}

// Image deduplication manager for wine uploads
export class WineImageDeduplication {
  private imageHashes: Map<number, ImageHash[]> = new Map();

  // Load existing image hashes from wine data
  loadExistingImages(wines: any[]) {
    wines.forEach(wine => {
      if (wine.image && wine.image.startsWith('data:')) {
        // For base64 images, we can't generate hash without decoding
        // Store basic info for now
        const existingHashes = this.imageHashes.get(wine.id) || [];
        existingHashes.push({
          hash: '', // Would need to decode base64 to generate hash
          filename: `wine-${wine.id}-existing`,
          size: wine.image.length,
          timestamp: Date.now()
        });
        this.imageHashes.set(wine.id, existingHashes);
      }
    });
  }

  // Check if new image is duplicate for specific wine
  async checkDuplicate(wineId: number, file: File): Promise<{ isDuplicate: boolean; existingImage?: ImageHash }> {
    try {
      const newHash = await generateImageHash(file);
      const existingHashes = this.imageHashes.get(wineId) || [];
      const duplicate = isDuplicateImage(newHash, existingHashes);
      
      return {
        isDuplicate: !!duplicate,
        existingImage: duplicate || undefined
      };
    } catch (error) {
      console.error('Error checking image duplicate:', error);
      return { isDuplicate: false };
    }
  }

  // Add new image hash to tracking
  async addImageHash(wineId: number, file: File, filename: string) {
    try {
      const hash = await generateImageHash(file);
      const existingHashes = this.imageHashes.get(wineId) || [];
      
      existingHashes.push({
        hash,
        filename,
        size: file.size,
        timestamp: Date.now()
      });
      
      this.imageHashes.set(wineId, existingHashes);
    } catch (error) {
      console.error('Error adding image hash:', error);
    }
  }

  // Remove image hash when image is deleted
  removeImageHash(wineId: number, filename: string) {
    const existingHashes = this.imageHashes.get(wineId) || [];
    const filteredHashes = existingHashes.filter(hash => hash.filename !== filename);
    this.imageHashes.set(wineId, filteredHashes);
  }

  // Get statistics about image usage
  getStats() {
    let totalImages = 0;
    let totalSize = 0;
    
    this.imageHashes.forEach(hashes => {
      totalImages += hashes.length;
      totalSize += hashes.reduce((sum, hash) => sum + hash.size, 0);
    });
    
    return {
      totalImages,
      totalSize,
      averageSize: totalImages > 0 ? totalSize / totalImages : 0
    };
  }
}

// Global instance for wine image deduplication
export const wineImageDeduplication = new WineImageDeduplication();