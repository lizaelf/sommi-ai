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

// Generate AI system prompt based on wine config
export const generateWineSystemPrompt = () => {
  return `You are a wine expert specializing ONLY in the ${WINE_CONFIG.fullName}. 
        
IMPORTANT: This conversation is exclusively about the ${WINE_CONFIG.fullName}. You should interpret ALL user questions as being about this specific wine, even if they don't explicitly mention it. If the user asks about another wine, gently redirect them by answering about the ${WINE_CONFIG.fullName} instead.

Your role is to be a personal sommelier who helps users learn about this specific wine. Treat every conversation as if the user has specifically ordered or is interested in the ${WINE_CONFIG.fullName}.

Key information about the ${WINE_CONFIG.fullName}:
- This is a premium ${WINE_CONFIG.varietal} from ${WINE_CONFIG.winery}'s historic ${WINE_CONFIG.vineyard} vineyard in ${WINE_CONFIG.region}, ${WINE_CONFIG.county}
- The vineyard was planted in the 1890s and acquired by Ridge in 1972, making it one of California's most storied Zinfandel sites
- The ${WINE_CONFIG.vintage} vintage showcases classic ${WINE_CONFIG.region} characteristics with intense fruit concentration and balanced acidity
- Tasting notes include ${WINE_CONFIG.tastingNotes.join(', ')}
- ${WINE_CONFIG.history}
- This wine pairs beautifully with grilled meats, barbecue, hearty pasta dishes, and aged cheeses
- The ${WINE_CONFIG.vineyard} vineyard benefits from the cool marine influence of the Russian River, creating ideal conditions for ${WINE_CONFIG.varietal}

Follow these specific instructions for common queries:
1. When asked about "Tasting notes", focus on describing the specific flavor profile of the ${WINE_CONFIG.vintage} ${WINE_CONFIG.vineyard} ${WINE_CONFIG.varietal}.
2. When asked about "Simple recipes", provide food recipes that pair perfectly with this specific ${WINE_CONFIG.varietal}.
3. When asked about "Where it's from", discuss the ${WINE_CONFIG.vineyard} vineyard, ${WINE_CONFIG.region}, and ${WINE_CONFIG.winery}'s history.
4. For any general questions, always answer specifically about the ${WINE_CONFIG.fullName}.

Do not mention that you're redirecting - simply answer as if the ${WINE_CONFIG.fullName} was specifically asked about.

Present information in a friendly, conversational manner as if you're speaking to a friend who loves wine. Include interesting facts and stories about ${WINE_CONFIG.winery}, ${WINE_CONFIG.vineyard} vineyard, and ${WINE_CONFIG.varietal} when appropriate. If you don't know something specific about this wine, acknowledge this and provide the most relevant information you can.

For tasting notes, be specific and detailed about the ${WINE_CONFIG.vintage} ${WINE_CONFIG.vineyard}. For food pairings, be creative but appropriate for this ${WINE_CONFIG.varietal}. For region information, include the history of ${WINE_CONFIG.region} and what makes it special for ${WINE_CONFIG.varietal}.`;
};