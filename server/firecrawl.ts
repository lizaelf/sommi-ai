import FirecrawlApp from '@mendable/firecrawl-js';
import { storage } from './storage.js';
import type { InsertWine, InsertTenant } from '@shared/schema.js';

// Initialize Firecrawl
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

interface WineData {
  name: string;
  year: number;
  description?: string;
  varietal?: string;
  region?: string;
  ratings?: {
    vn?: number;
    jd?: number;
    ws?: number;
    abv?: number;
  };
  price?: string;
  availability?: string;
}

interface WineryData {
  name: string;
  description?: string;
  location?: string;
  established?: number;
  website?: string;
  wines: WineData[];
}

/**
 * Parse winery website and extract wine data
 */
export async function parseWineryWebsite(url: string): Promise<WineryData> {
  try {
    console.log(`Starting Firecrawl parsing of: ${url}`);
    
    // Crawl the website with wine-specific extraction
    const crawlResult = await firecrawl.scrapeUrl(url, {
      formats: ['markdown'],
      includeTags: ['h1', 'h2', 'h3', 'p', 'div', 'span', 'li'],
      excludeTags: ['script', 'style', 'nav', 'footer', 'header'],
      waitFor: 2000
    });

    console.log('Firecrawl response structure:', {
      success: crawlResult.success,
      keys: Object.keys(crawlResult)
    });

    if (!crawlResult.success) {
      console.error('Firecrawl failed:', crawlResult);
      throw new Error('Failed to crawl website');
    }

    // Handle different response structures
    const content = (crawlResult as any).markdown || (crawlResult as any).data?.markdown || '';
    if (!content.trim()) {
      console.error('No content found in response:', crawlResult);
      throw new Error('No content extracted from website');
    }

    console.log('Website crawled successfully, extracting wine data...');
    
    // Extract structured wine data using AI
    const wineExtractionPrompt = `
    Extract winery and wine information from this website content. Return a JSON object with this exact structure:
    
    {
      "name": "Winery Name",
      "description": "Brief winery description",
      "location": "Location/Region", 
      "established": year_number_or_null,
      "website": "${url}",
      "wines": [
        {
          "name": "Wine Name",
          "year": vintage_year_number,
          "description": "Wine description",
          "varietal": "Grape variety (e.g., Cabernet Sauvignon, Chardonnay)",
          "region": "Wine region/appellation",
          "ratings": {
            "vn": vinorium_score_or_null,
            "jd": james_suckling_score_or_null, 
            "ws": wine_spectator_score_or_null,
            "abv": alcohol_percentage_or_null
          },
          "price": "Price if mentioned",
          "availability": "Availability status"
        }
      ]
    }
    
    Extract as many wines as possible. Focus on current releases and vintage wines.
    For ratings, only include scores if explicitly mentioned (90+ scores are common).
    If information is not available, use null instead of guessing.
    
    Website content:
    ${content}
    `;

    // Use OpenAI to structure the wine data
    const { chatCompletion } = await import('./openai.js');
    const extractionResponse = await chatCompletion([
      {
        role: 'system',
        content: 'You are a wine data extraction specialist. Extract structured wine information from website content and return valid JSON only.'
      },
      {
        role: 'user', 
        content: wineExtractionPrompt
      }
    ]);

    // Parse the AI response
    let wineryData: WineryData;
    try {
      const jsonMatch = extractionResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      wineryData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to extract structured wine data');
    }

    console.log(`Extracted winery data: ${wineryData.name} with ${wineryData.wines.length} wines`);
    return wineryData;

  } catch (error) {
    console.error('Firecrawl parsing error:', error);
    throw error;
  }
}

/**
 * Crawl multiple pages of a winery website for comprehensive wine data
 */
export async function crawlComprehensiveWineryData(baseUrl: string, additionalPaths: string[] = []): Promise<WineryData> {
  try {
    const urlsToCrawl = [
      baseUrl,
      ...additionalPaths.map(path => `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`)
    ];

    console.log(`Crawling comprehensive winery data from ${urlsToCrawl.length} URLs`);
    
    // Crawl all URLs
    const crawlPromises = urlsToCrawl.map(url => 
      firecrawl.scrapeUrl(url, {
        formats: ['markdown'],
        includeTags: ['h1', 'h2', 'h3', 'p', 'div', 'li'],
        excludeTags: ['script', 'style', 'nav', 'footer'],
        waitFor: 2000
      }).then(result => ({
        url,
        success: result.success,
        content: result.success ? result.markdown || '' : ''
      }))
    );

    const crawlResults = await Promise.all(crawlPromises);
    const successfulCrawls = crawlResults.filter(result => result.success);

    if (successfulCrawls.length === 0) {
      throw new Error('Failed to crawl any URLs');
    }

    // Combine all content
    const combinedContent = successfulCrawls
      .map(result => `--- Content from ${result.url} ---\n${result.content}`)
      .join('\n\n');

    // Extract comprehensive wine data
    const comprehensivePrompt = `
    Extract comprehensive winery and wine information from this multi-page website content. 
    Return a JSON object with complete winery details and ALL wines found across all pages.
    
    {
      "name": "Winery Name",
      "description": "Detailed winery description",
      "location": "Full location/region/address",
      "established": year_number_or_null,
      "website": "${baseUrl}",
      "wines": [
        // Extract ALL wines from all pages, including:
        // - Current releases
        // - Reserve wines  
        // - Limited editions
        // - Library wines
        // - Vintage collections
      ]
    }
    
    Be thorough - extract every wine mentioned across all pages.
    
    Combined website content:
    ${combinedContent}
    `;

    const { chatCompletion } = await import('./openai.js');
    const response = await chatCompletion([
      {
        role: 'system',
        content: 'You are a comprehensive wine data extraction specialist. Extract ALL wine information from multi-page website content.'
      },
      {
        role: 'user',
        content: comprehensivePrompt
      }
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in comprehensive extraction response');
    }

    const wineryData = JSON.parse(jsonMatch[0]);
    console.log(`Comprehensive extraction complete: ${wineryData.wines.length} wines found`);
    
    return wineryData;

  } catch (error) {
    console.error('Comprehensive crawl error:', error);
    throw error;
  }
}

/**
 * Create tenant and populate wines from winery data
 */
export async function createTenantFromWineryData(wineryData: WineryData, slug?: string): Promise<void> {
  try {
    console.log(`Creating tenant for winery: ${wineryData.name}`);

    // Create tenant
    const tenantSlug = slug || wineryData.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const tenant = await storage.createTenant({
      name: wineryData.name,
      slug: tenantSlug,
      description: wineryData.description || `Premium wines from ${wineryData.name}`,
      location: wineryData.location || '',
      established: wineryData.established || null,
      website: wineryData.website || '',
      isActive: true
    });

    console.log(`Created tenant: ${tenant.name} (ID: ${tenant.id})`);

    // Create wines
    let successfulWines = 0;
    let failedWines = 0;

    for (const wineData of wineryData.wines) {
      try {
        const wine: InsertWine = {
          name: wineData.name,
          year: wineData.year,
          description: wineData.description || `${wineData.name} from ${wineryData.name}`,
          image: '', // Will be populated later with uploaded images
          bottles: 1, // Default bottle count
          ratings: {
            vn: wineData.ratings?.vn || 0,
            jd: wineData.ratings?.jd || 0,
            ws: wineData.ratings?.ws || 0,
            abv: wineData.ratings?.abv || 0
          },
          location: wineData.region || wineryData.location || '',
          winery: wineryData.name,
          varietal: wineData.varietal || '',
          appellation: wineData.region || '',
          tenantId: tenant.id
        };

        await storage.createWine(wine);
        successfulWines++;
        console.log(`Created wine: ${wine.name} (${wine.year})`);

      } catch (wineError) {
        console.error(`Failed to create wine: ${wineData.name}`, wineError);
        failedWines++;
      }
    }

    console.log(`Wine creation complete: ${successfulWines} successful, ${failedWines} failed`);
    console.log(`Tenant ${tenant.name} created with ${successfulWines} wines`);

  } catch (error) {
    console.error('Failed to create tenant from winery data:', error);
    throw error;
  }
}

/**
 * Auto-populate winery from URL with optional custom paths
 */
export async function autoPopulateWinery(
  url: string, 
  tenantSlug?: string,
  additionalPaths?: string[]
): Promise<{ tenantId: number; winesCreated: number }> {
  try {
    console.log(`Starting auto-population for winery: ${url}`);

    // Use comprehensive crawling if additional paths provided
    const wineryData = additionalPaths && additionalPaths.length > 0
      ? await crawlComprehensiveWineryData(url, additionalPaths)
      : await parseWineryWebsite(url);

    // Create tenant and populate wines
    await createTenantFromWineryData(wineryData, tenantSlug);

    // Get the created tenant
    const tenant = await storage.getTenantBySlug(
      tenantSlug || wineryData.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    );

    if (!tenant) {
      throw new Error('Failed to retrieve created tenant');
    }

    const wines = await storage.getAllWines();
    const tenantWines = wines.filter(wine => wine.tenantId === tenant.id);

    return {
      tenantId: tenant.id,
      winesCreated: tenantWines.length
    };

  } catch (error) {
    console.error('Auto-populate winery failed:', error);
    throw error;
  }
}