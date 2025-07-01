/**
 * Slug Utility Functions for Multi-Tenant Wine Platform
 * Handles URL-friendly slug generation and validation for winery tenants
 */

/**
 * Generate a URL-friendly slug from winery name
 * Converts to lowercase, replaces spaces/special chars with hyphens, removes consecutive hyphens
 */
export function generateSlug(wineryName: string): string {
  if (!wineryName) return "";
  
  return wineryName
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '');
}

/**
 * Validate slug format
 * Must contain only lowercase letters, numbers, and hyphens
 */
export function validateSlug(slug: string): { isValid: boolean; error?: string } {
  if (!slug) {
    return { isValid: false, error: "Slug is required" };
  }
  
  if (slug.length < 2) {
    return { isValid: false, error: "Slug must be at least 2 characters" };
  }
  
  if (slug.length > 50) {
    return { isValid: false, error: "Slug must be 50 characters or less" };
  }
  
  // Check for valid format: lowercase letters, numbers, hyphens only
  const slugPattern = /^[a-z0-9-]+$/;
  if (!slugPattern.test(slug)) {
    return { isValid: false, error: "Slug can only contain lowercase letters, numbers, and hyphens" };
  }
  
  // Check for consecutive hyphens
  if (slug.includes('--')) {
    return { isValid: false, error: "Slug cannot contain consecutive hyphens" };
  }
  
  // Check for leading/trailing hyphens
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { isValid: false, error: "Slug cannot start or end with a hyphen" };
  }
  
  return { isValid: true };
}

/**
 * Normalize slug by applying generation rules
 */
export function normalizeSlug(slug: string): string {
  return generateSlug(slug);
}

/**
 * Generate tenant URLs based on slug
 */
export function generateTenantUrls(slug: string) {
  const baseUrl = `/${slug}`;
  return {
    home: baseUrl,
    wine: `${baseUrl}/wine`,
    cellar: `${baseUrl}/cellar`,
    foodPairing: `${baseUrl}/wine/food-pairing-ai`,
    chat: `${baseUrl}/chat`,
    admin: `${baseUrl}/admin`
  };
}

/**
 * Check if slug is available (used by API)
 */
export async function checkSlugAvailability(slug: string, excludeId?: number): Promise<{ available: boolean; message?: string }> {
  try {
    const url = excludeId 
      ? `/api/check-slug/${slug}?exclude=${excludeId}`
      : `/api/check-slug/${slug}`;
      
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      available: data.available,
      message: data.available ? "Slug is available" : "Slug is already taken"
    };
  } catch (error) {
    return {
      available: false,
      message: "Error checking slug availability"
    };
  }
}