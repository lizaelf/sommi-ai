/**
 * Suggestion Response Cache System
 * Caches AI responses for suggestion pills to improve performance and reduce API calls
 */

interface CachedSuggestionResponse {
  wineKey: string;
  suggestionId: string;
  response: string;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_KEY = 'wine_suggestion_responses_cache';

class SuggestionCacheManager {
  private cache: Map<string, CachedSuggestionResponse> = new Map();
  private initialized = false;

  /**
   * Initialize cache from localStorage
   */
  private async initializeCache(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const cachedData: CachedSuggestionResponse[] = JSON.parse(stored);
        const now = Date.now();

        // Filter out expired entries and populate cache
        cachedData.forEach(item => {
          if (item.expiresAt > now) {
            const key = this.getCacheKey(item.wineKey, item.suggestionId);
            this.cache.set(key, item);
          }
        });

        console.log(`Loaded ${this.cache.size} cached suggestion responses`);
      } else {
        // Initialize with default cached responses for instant suggestions
        await this.initializeDefaultCache();
      }
    } catch (error) {
      console.error('Error loading suggestion cache:', error);
    }

    this.initialized = true;
  }

  /**
   * Initialize default cached responses for common suggestions
   */
  private async initializeDefaultCache(): Promise<void> {
    const defaultResponses = [
      {
        suggestionId: 'tell_me_about_this_wine',
        response: 'The Ridge Lytton Springs Dry Creek Zinfandel (2021) is an exceptional wine that showcases the best of Sonoma County winemaking. This bold red wine features rich flavors of blackberry, spice, and earth, with a well-balanced structure that makes it perfect for pairing with hearty dishes or enjoying on its own.'
      },
      {
        suggestionId: 'what_s_the_story_behind_this_wine',
        response: 'Ridge Vineyards has been crafting exceptional wines since 1962, and the Lytton Springs vineyard represents a cornerstone of their legacy. Located in Dry Creek Valley, this vineyard benefits from unique terroir that produces wines of exceptional character and complexity, embodying the true spirit of California winemaking.'
      },
      {
        suggestionId: 'what_food_pairs_well_with_this_wine',
        response: 'This robust Zinfandel pairs beautifully with grilled meats, BBQ ribs, hearty pasta dishes with rich tomato sauces, and aged cheeses. The wine\'s bold flavors and balanced tannins complement spicy cuisines and dishes with complex flavor profiles.'
      }
    ];

    const now = Date.now();
    const wineKey = 'wine_1'; // Default wine key

    for (const defaultResponse of defaultResponses) {
      const cachedItem: CachedSuggestionResponse = {
        wineKey,
        suggestionId: defaultResponse.suggestionId,
        response: defaultResponse.response,
        timestamp: now,
        expiresAt: now + CACHE_DURATION,
      };

      const cacheKey = this.getCacheKey(wineKey, defaultResponse.suggestionId);
      this.cache.set(cacheKey, cachedItem);
    }

    this.saveCache();
    console.log(`Initialized ${defaultResponses.length} default cached responses`);
  }

  /**
   * Generate cache key for wine-suggestion combination
   */
  private getCacheKey(wineKey: string, suggestionId: string): string {
    return `${wineKey}:${suggestionId}`;
  }

  /**
   * Save cache to localStorage
   */
  private saveCache(): void {
    try {
      const cacheArray = Array.from(this.cache.values());
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheArray));
    } catch (error) {
      console.error('Error saving suggestion cache:', error);
    }
  }

  /**
   * Get cached response for a suggestion
   */
  async getCachedResponse(wineKey: string, suggestionId: string): Promise<string | null> {
    await this.initializeCache();

    // Normalize wine key - ensure it's not empty
    const normalizedWineKey = wineKey || 'wine_1'; // Default to wine_1 if empty
    const cacheKey = this.getCacheKey(normalizedWineKey, suggestionId);
    const cached = this.cache.get(cacheKey);

    console.log(`Cache lookup: wineKey="${normalizedWineKey}", suggestionId="${suggestionId}", cacheKey="${cacheKey}"`);

    if (cached) {
      const now = Date.now();
      if (cached.expiresAt > now) {
        console.log(`Cache hit for suggestion: ${suggestionId} (wine: ${normalizedWineKey})`);
        return cached.response;
      } else {
        // Remove expired entry
        this.cache.delete(cacheKey);
        this.saveCache();
        console.log(`Cache expired for suggestion: ${suggestionId} (wine: ${normalizedWineKey})`);
      }
    } else {
      console.log(`Cache miss for suggestion: ${suggestionId} (wine: ${normalizedWineKey})`);
    }

    return null;
  }

  /**
   * Cache a response for a suggestion
   */
  async cacheResponse(wineKey: string, suggestionId: string, response: string): Promise<void> {
    await this.initializeCache();

    const now = Date.now();
    const normalizedWineKey = wineKey || 'wine_1'; // Default to wine_1 if empty
    const cacheKey = this.getCacheKey(normalizedWineKey, suggestionId);

    const cachedItem: CachedSuggestionResponse = {
      wineKey: normalizedWineKey,
      suggestionId,
      response,
      timestamp: now,
      expiresAt: now + CACHE_DURATION,
    };

    this.cache.set(cacheKey, cachedItem);
    this.saveCache();

    console.log(`Cached response for suggestion: ${suggestionId} (wine: ${normalizedWineKey})`);
  }

  /**
   * Pre-cache responses for all available suggestions for a wine
   */
  async preCacheSuggestions(wineKey: string, suggestions: Array<{id: string, text: string}>): Promise<void> {
    console.log(`Pre-caching ${suggestions.length} suggestions for wine: ${wineKey}`);

    // Process suggestions in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < suggestions.length; i += batchSize) {
      const batch = suggestions.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (suggestion) => {
        const cached = await this.getCachedResponse(wineKey, suggestion.id);
        if (!cached) {
          try {
            // Generate response for this suggestion
            const response = await this.generateSuggestionResponse(wineKey, suggestion.text);
            if (response) {
              await this.cacheResponse(wineKey, suggestion.id, response);
            }
          } catch (error) {
            console.error(`Error pre-caching suggestion ${suggestion.id}:`, error);
          }
        }
      }));

      // Add delay between batches to be API-friendly
      if (i + batchSize < suggestions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Pre-caching complete for wine: ${wineKey}`);
  }

  /**
   * Generate response for a suggestion using the API
   */
  private async generateSuggestionResponse(wineKey: string, suggestionText: string): Promise<string | null> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: suggestionText }],
          conversationId: 1, // Use temporary conversation for caching
          wineData: null, // Will use wine config based on current wine
          text_only: true,
          cache_only: true, // Flag to indicate this is for caching
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.message?.content || null;
      }
    } catch (error) {
      console.error('Error generating suggestion response:', error);
    }

    return null;
  }

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem(CACHE_KEY);
    console.log('Suggestion cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalEntries: number; cacheSize: string } {
    const totalEntries = this.cache.size;
    const cacheSize = new Blob([localStorage.getItem(CACHE_KEY) || '']).size;
    return {
      totalEntries,
      cacheSize: `${(cacheSize / 1024).toFixed(2)} KB`,
    };
  }
}

// Export singleton instance
export const suggestionCache = new SuggestionCacheManager();