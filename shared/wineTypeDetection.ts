/**
 * Wine Type Detection Utility
 * Detects wine type (Red, Rose, White, Sparkling) from wine names
 */

export type WineTypeCategory = 'Red' | 'Rose' | 'White' | 'Sparkling';

// Wine type detection patterns based on wine name analysis
const WINE_TYPE_PATTERNS = {
  Red: [
    // Grape varieties
    'cabernet', 'merlot', 'pinot noir', 'syrah', 'shiraz', 'malbec', 
    'zinfandel', 'sangiovese', 'chianti', 'barolo', 'brunello',
    'tempranillo', 'grenache', 'mourvedre', 'petite sirah',
    'nebbiolo', 'barbera', 'dolcetto', 'aglianico', 'nero d\'avola',
    'carmenere', 'petit verdot', 'tannat', 'touriga nacional',
    
    // Regional indicators
    'bordeaux red', 'burgundy red', 'rhone red', 'rioja', 'ribera del duero',
    'priorat', 'toro', 'jumilla', 'dao red', 'douro red',
    'barossa', 'hunter valley red', 'napa red', 'sonoma red',
    'paso robles red', 'willamette valley red',
    
    // Wine styles
    'red blend', 'red wine', 'rouge', 'rosso', 'tinto',
    'meritage red', 'super tuscan', 'amarone', 'ripasso'
  ],
  
  Rose: [
    'rosé', 'rose', 'rosado', 'rosato', 'blush', 'pink',
    'provence rosé', 'bandol rosé', 'tavel', 'anjou rosé',
    'sancerre rosé', 'côtes de provence', 'coteaux d\'aix rosé'
  ],
  
  White: [
    // Grape varieties
    'chardonnay', 'sauvignon blanc', 'riesling', 'pinot grigio', 'pinot gris',
    'gewürztraminer', 'viognier', 'albariño', 'verdejo', 'godello',
    'grüner veltliner', 'chenin blanc', 'sémillon', 'muscadet',
    'vermentino', 'cortese', 'gavi', 'soave', 'orvieto',
    'sancerre', 'pouilly fumé', 'chablis', 'meursault', 'puligny',
    'chassagne', 'montrachet', 'mâcon', 'muscadet', 'vouvray',
    'anjou blanc', 'touraine', 'quincy', 'menetou salon',
    
    // Regional indicators
    'alsace', 'loire white', 'burgundy white', 'bordeaux blanc',
    'rioja blanco', 'rueda', 'rías baixas', 'vinho verde',
    'dao branco', 'douro branco', 'alentejo branco',
    'hunter valley white', 'adelaide hills', 'margaret river white',
    'marlborough', 'central otago white', 'mosel', 'rheingau',
    'pfalz', 'baden white', 'württemberg white',
    
    // Wine styles
    'white blend', 'white wine', 'blanc', 'bianco', 'blanco',
    'meritage white', 'rhône white'
  ],
  
  Sparkling: [
    'champagne', 'prosecco', 'cava', 'crémant', 'franciacorta',
    'sparkling', 'spumante', 'espumoso', 'espumante', 'pétillant',
    'blanc de blancs', 'blanc de noirs', 'brut', 'extra brut',
    'sec', 'demi sec', 'doux', 'zero dosage', 'natural',
    'méthode champenoise', 'méthode traditionnelle', 'charmat',
    'lambrusco', 'asti', 'moscato d\'asti', 'brachetto d\'acqui',
    'sekt', 'english sparkling', 'california sparkling'
  ]
};

/**
 * Detect wine type from wine name
 */
export function detectWineType(wineName: string): WineTypeCategory {
  if (!wineName) return 'Red'; // Default fallback
  
  const normalizedName = wineName.toLowerCase().trim();
  
  // Check for each wine type in order of specificity
  for (const [type, patterns] of Object.entries(WINE_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (normalizedName.includes(pattern.toLowerCase())) {
        return type as WineTypeCategory;
      }
    }
  }
  
  // Additional heuristics for edge cases
  
  // Check for vintage year patterns (helps with classification)
  const hasVintage = /\b(19|20)\d{2}\b/.test(normalizedName);
  
  // Check for alcohol content indicators
  const hasAlcohol = /\b\d{1,2}\.?\d?%|\balc|\babv\b/.test(normalizedName);
  
  // Check for bottle size indicators
  const hasBottleSize = /\b(375ml|750ml|1\.5l|magnum|split)\b/.test(normalizedName);
  
  // If contains typical red wine regions but no specific grape
  if (normalizedName.includes('napa') || normalizedName.includes('sonoma') || 
      normalizedName.includes('paso robles') || normalizedName.includes('lodi')) {
    return 'Red';
  }
  
  // If contains typical white wine regions
  if (normalizedName.includes('marlborough') || normalizedName.includes('sancerre') ||
      normalizedName.includes('chablis') || normalizedName.includes('alsace')) {
    return 'White';
  }
  
  // Default to Red if no clear indicators (most common wine type)
  return 'Red';
}

/**
 * Get wine type image path based on detected type
 */
export function getWineTypeImagePath(wineType: WineTypeCategory): string {
  const imagePaths = {
    'Red': '/wine-types/red.svg',
    'Rose': '/wine-types/rose.svg', 
    'White': '/wine-types/white.svg',
    'Sparkling': '/wine-types/sparkling.svg'
  };
  
  return imagePaths[wineType] || imagePaths.Red;
}

/**
 * Analyze wine collection and return type distribution
 */
export function analyzeWineTypeDistribution(wineNames: string[]): Record<WineTypeCategory, number> {
  const distribution = {
    'Red': 0,
    'Rose': 0,
    'White': 0,
    'Sparkling': 0
  };
  
  wineNames.forEach(name => {
    const type = detectWineType(name);
    distribution[type]++;
  });
  
  return distribution;
}

/**
 * Get wine type for specific wine names in the current collection
 */
export function getWineTypeForCurrentWines(): Record<string, WineTypeCategory> {
  const currentWines = [
    'Ridge "Lytton Springs" Dry Creek Zinfandel',
    'Monte Bello Cabernet Sauvignon'
  ];
  
  const wineTypes: Record<string, WineTypeCategory> = {};
  
  currentWines.forEach(wineName => {
    wineTypes[wineName] = detectWineType(wineName);
  });
  
  return wineTypes;
}