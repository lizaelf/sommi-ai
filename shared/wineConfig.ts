// Centralized wine configuration - single source of truth
// Update only this object to change wine information throughout the app

export const WINE_CONFIG = {
  // Primary wine information
  name: 'Tenuta San Guido Bolgheri Sassicaia DOC',
  fullName: 'Tenuta San Guido Bolgheri Sassicaia DOC',
  vintage: 2021,
  winery: 'Tenuta San Guido',
  vineyard: 'Bolgheri',
  region: 'Bolgheri',
  appellation: 'Bolgheri DOC',
  county: 'Tuscany',
  state: 'Tuscany',
  country: 'Italy',
  varietal: 'Cabernet Sauvignon',
  
  // Detailed characteristics
  characteristics: {
    body: 70,
    sweet: 30,
    dry: 75,
    smooth: 60,
    tannic: 80,
  },
  
  // Professional ratings
  ratings: {
    ws: 94,  // Wine Spectator
    ww: 93,  // Wine & Whiskey
    js: 92,  // James Suckling
  },
  
  // Tasting notes and description
  tastingNotes: [
    'Complex aromas of blackcurrant and cedar',
    'Rich flavors of dark berries and Mediterranean herbs',
    'Elegant structure with refined tannins',
    'Notes of tobacco and vanilla from oak aging',
    'Long, persistent finish with mineral complexity'
  ],
  
  // Historical information
  history: 'Sassicaia is the legendary wine from Tenuta San Guido in Bolgheri, Tuscany. Created in the 1940s by Mario Incisa della Rocchetta, it was one of the first "Super Tuscan" wines. The estate pioneered Cabernet Sauvignon cultivation in Tuscany, creating what many consider Italy\'s most prestigious wine.',
  
  // Food pairing categories
  foodPairings: [
    { id: "red-meat", name: "Red Meat", active: true },
    { id: "cheese", name: "Cheese Pairings", active: false },
    { id: "vegetarian", name: "Vegetarian Options", active: false },
    { id: "avoid", name: "Avoid pairing with...", active: false },
  ],
} as const;

// Helper functions to extract specific information
export const getWineDisplayName = () => WINE_CONFIG.name;
export const getFullWineName = () => WINE_CONFIG.fullName;
export const getWineRegion = () => `${WINE_CONFIG.region} | ${WINE_CONFIG.county} | ${WINE_CONFIG.country}`;
export const getWineVarietal = () => WINE_CONFIG.varietal;
export const getWineVintage = () => WINE_CONFIG.vintage;
export const getWinery = () => WINE_CONFIG.winery;
export const getVineyard = () => WINE_CONFIG.vineyard;

// Automatic wine type extraction from the name
export const extractWineTypeFromName = () => {
  const name = WINE_CONFIG.name.toLowerCase();
  
  // Extract wine type from name patterns
  if (name.includes('sassicaia') || WINE_CONFIG.varietal.toLowerCase().includes('cabernet')) {
    return 'Cabernet Sauvignon';
  }
  if (name.includes('zinfandel') || WINE_CONFIG.varietal.toLowerCase().includes('zinfandel')) {
    return 'Zinfandel';
  }
  if (name.includes('chianti') || name.includes('sangiovese')) {
    return 'Sangiovese';
  }
  if (name.includes('barolo') || name.includes('nebbiolo')) {
    return 'Nebbiolo';
  }
  if (name.includes('rioja') || name.includes('tempranillo')) {
    return 'Tempranillo';
  }
  
  // Fallback to configured varietal
  return WINE_CONFIG.varietal;
};

// Get wine type - automatically extracted from name or fallback to varietal
export const getWineType = () => extractWineTypeFromName();

// Generate AI system prompt based on wine config
export const generateWineSystemPrompt = () => {
  const wineType = getWineType(); // Automatically extracted wine type
  return `You are a wine expert specializing EXCLUSIVELY in ${WINE_CONFIG.fullName}.

CRITICAL: You MUST ONLY discuss ${WINE_CONFIG.fullName}. NEVER discuss generic ${wineType} or any other wine. Every response must be specifically about ${WINE_CONFIG.fullName}.

When users ask about "this wine" or wine characteristics, they are asking specifically about ${WINE_CONFIG.fullName}.

SPECIFIC WINE DETAILS for ${WINE_CONFIG.fullName}:
- Producer: ${WINE_CONFIG.winery}
- Wine Name: ${WINE_CONFIG.fullName}
- Type: Premium ${wineType} 
- Region: ${WINE_CONFIG.region}, ${WINE_CONFIG.county}, ${WINE_CONFIG.country}
- Vintage: ${WINE_CONFIG.vintage}
- Heritage: ${WINE_CONFIG.history}
- Flavor Profile: ${WINE_CONFIG.tastingNotes.join(', ')}

MANDATORY: Always mention "${WINE_CONFIG.fullName}" by name in your responses. Never give generic ${wineType} information.

Follow these specific instructions for common queries:
1. When asked about "Tasting notes", focus on describing the specific flavor profile of the ${WINE_CONFIG.vintage} ${WINE_CONFIG.name}.
2. When asked about "Simple recipes", provide food recipes that pair perfectly with this specific ${wineType}.
3. When asked about "Where it's from", discuss the ${WINE_CONFIG.region}, ${WINE_CONFIG.county}, and ${WINE_CONFIG.winery}'s history.
4. For any general questions, always answer specifically about the ${WINE_CONFIG.fullName}.

Do not mention that you're redirecting - simply answer as if the ${WINE_CONFIG.fullName} was specifically asked about.

Present information in a friendly, conversational manner as if you're speaking to a friend who loves wine. Include interesting facts and stories about ${WINE_CONFIG.winery}, ${WINE_CONFIG.region}, and ${wineType} when appropriate. If you don't know something specific about this wine, acknowledge this and provide the most relevant information you can.

For tasting notes, be specific and detailed about the ${WINE_CONFIG.vintage} ${WINE_CONFIG.name}. For food pairings, be creative but appropriate for this ${wineType}. For region information, include the history of ${WINE_CONFIG.region} and what makes it special for ${wineType}.`;
};