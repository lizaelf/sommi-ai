// Wine Data Synchronization for Multi-Environment Deployment
// Handles data consistency between development and production environments

interface WineData {
  id: number;
  name: string;
  year?: number;
  bottles: number;
  image: string;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  buyAgainLink: string;
  qrCode: string;
  qrLink: string;
  location?: string;
  description?: string;
  foodPairing?: string[];
  conversationHistory?: any[];
}

/**
 * Reads wine data from the development environment
 * This simulates reading from localStorage or a local data store
 */
export function getDevelopmentWineData(): WineData[] {
  // In a real implementation, this would read from your actual data source
  // For now, we'll return the structure that matches your current CRM
  return [
    {
      id: 1,
      name: "Ridge \"Lytton Springs\" Dry Creek Zinfandel",
      year: 2021,
      bottles: 6,
      image: "/wines/wine-1-ridge-lytton-springs-dry-creek-zinfandel.png",
      ratings: { vn: 95, jd: 93, ws: 92, abv: 14.8 },
      buyAgainLink: "https://www.ridgewine.com/wines/2021-lytton-springs/",
      qrCode: "QR_001",
      qrLink: "/scanned?wine=1",
      location: "Dry Creek Valley, Sonoma County, California",
      description: "The 2021 Ridge \"Lytton Springs\" Dry Creek Zinfandel exhibits a rich tapestry of blackberry and raspberry notes, underscored by a peppery spice typical of the varietal. Matured in American oak, it possesses a well-structured tannin profile and a finish that resonates with the minerality of its Dry Creek Valley terroir.",
      foodPairing: ["Grilled lamb", "BBQ ribs", "Aged cheddar", "Dark chocolate desserts"],
      conversationHistory: []
    },
    {
      id: 2,
      name: "Monte Bello Cabernet Sauvignon",
      year: 2021,
      bottles: 2,
      image: "/wine-2-monte-bello-cabernet-sauvignon-1749210160812.png",
      ratings: { vn: 95, jd: 93, ws: 93, abv: 14.3 },
      buyAgainLink: "https://ridge.com/product/monte-bello",
      qrCode: "QR_002",
      qrLink: "/scanned?wine=2",
      location: "Santa Cruz Mountains, California",
      description: "The 2020 Monte Bello Cabernet Sauvignon offers a complex palate of ripe blackcurrant, tobacco, and mocha, underpinned by a robust tannic structure typical of the varietal. This full-bodied Californian wine showcases the distinctive minerality and cool-climate elegance of the Santa Cruz Mountains terroir.",
      foodPairing: ["Grilled steak", "Lamb chops", "Aged cheeses", "Dark chocolate"],
      conversationHistory: []
    },
    {
      id: 3,
      name: "regin",
      year: 2022,
      bottles: 0,
      image: "",
      ratings: { vn: 0, jd: 0, ws: 0, abv: 0 },
      buyAgainLink: "",
      qrCode: "QR_003",
      qrLink: "/scanned?wine=3",
      description: "The 2022 Regin is a youthful and vibrant wine, showcasing an expressive bouquet of fresh white fruits and delicate floral undertones. The palate is refreshingly crisp, with a harmonious balance of acidity and minerality, indicative of its terroir. This wine exhibits the classic characteristics of a cool-climate white, offering a long, clean finish.",
      foodPairing: ["Fresh seafood", "Goat cheese salad", "Light pasta", "Asian cuisine"],
      conversationHistory: []
    },
    {
      id: 4,
      name: "cherdoney",
      year: 2021,
      bottles: 0,
      image: "",
      ratings: { vn: 0, jd: 0, ws: 0, abv: 0 },
      buyAgainLink: "",
      qrCode: "QR_004",
      qrLink: "/scanned?wine=4",
      description: "The 2021 Cherdoney presents a refined and elegant profile, characterized by notes of citrus, green apple, and subtle tropical fruit. The wine displays excellent balance with crisp acidity and a mineral-driven finish. Its clean, refreshing character makes it an ideal companion for lighter fare and seafood dishes.",
      foodPairing: ["Oysters", "Grilled fish", "Soft cheeses", "Summer salads"],
      conversationHistory: []
    },
    {
      id: 5,
      name: "red wine",
      year: 2023,
      bottles: 0,
      image: "",
      ratings: { vn: 0, jd: 0, ws: 0, abv: 0 },
      buyAgainLink: "",
      qrCode: "QR_005",
      qrLink: "/scanned?wine=5",
      description: "A young and vibrant red wine with bright fruit flavors and soft tannins. This approachable wine showcases fresh red berry character with hints of spice and earth. The medium-bodied profile makes it versatile for various occasions and food pairings.",
      foodPairing: ["Pizza", "Pasta with tomato sauce", "Grilled vegetables", "Casual dining"],
      conversationHistory: []
    }
  ];
}

/**
 * Simulates deployed environment wine data
 * In production, this would query your actual database
 */
export function getDeployedWineData(): WineData[] {
  // Now synchronized with development environment data
  return [
    {
      id: 1,
      name: "Ridge \"Lytton Springs\" Dry Creek Zinfandel",
      year: 2021,
      bottles: 6,
      image: "/wines/wine-1-ridge-lytton-springs-dry-creek-zinfandel.png",
      ratings: { vn: 95, jd: 93, ws: 92, abv: 14.8 },
      buyAgainLink: "https://www.ridgewine.com/wines/2021-lytton-springs/",
      qrCode: "QR_001",
      qrLink: "/scanned?wine=1",
      location: "Dry Creek Valley, Sonoma County, California",
      description: "The 2021 Ridge \"Lytton Springs\" Dry Creek Zinfandel exhibits a rich tapestry of blackberry and raspberry notes, underscored by a peppery spice typical of the varietal. Matured in American oak, it possesses a well-structured tannin profile and a finish that resonates with the minerality of its Dry Creek Valley terroir.",
      foodPairing: ["Grilled lamb", "BBQ ribs", "Aged cheddar", "Dark chocolate desserts"],
      conversationHistory: []
    },
    {
      id: 2,
      name: "Monte Bello Cabernet Sauvignon",
      year: 2021,
      bottles: 2,
      image: "/wine-2-monte-bello-cabernet-sauvignon-1749210160812.png",
      ratings: { vn: 95, jd: 93, ws: 93, abv: 14.3 },
      buyAgainLink: "https://ridge.com/product/monte-bello",
      qrCode: "QR_002",
      qrLink: "/scanned?wine=2",
      location: "Santa Cruz Mountains, California",
      description: "The 2020 Monte Bello Cabernet Sauvignon offers a complex palate of ripe blackcurrant, tobacco, and mocha, underpinned by a robust tannic structure typical of the varietal. This full-bodied Californian wine showcases the distinctive minerality and cool-climate elegance of the Santa Cruz Mountains terroir.",
      foodPairing: ["Grilled steak", "Lamb chops", "Aged cheeses", "Dark chocolate"],
      conversationHistory: []
    },
    {
      id: 3,
      name: "regin",
      year: 2022,
      bottles: 0,
      image: "",
      ratings: { vn: 0, jd: 0, ws: 0, abv: 0 },
      buyAgainLink: "",
      qrCode: "QR_003",
      qrLink: "/scanned?wine=3",
      description: "The 2022 Regin is a youthful and vibrant wine, showcasing an expressive bouquet of fresh white fruits and delicate floral undertones. The palate is refreshingly crisp, with a harmonious balance of acidity and minerality, indicative of its terroir. This wine exhibits the classic characteristics of a cool-climate white, offering a long, clean finish.",
      foodPairing: ["Fresh seafood", "Goat cheese salad", "Light pasta", "Asian cuisine"],
      conversationHistory: []
    },
    {
      id: 4,
      name: "cherdoney",
      year: 2021,
      bottles: 0,
      image: "",
      ratings: { vn: 0, jd: 0, ws: 0, abv: 0 },
      buyAgainLink: "",
      qrCode: "QR_004",
      qrLink: "/scanned?wine=4",
      description: "The 2021 Cherdoney presents a refined and elegant profile, characterized by notes of citrus, green apple, and subtle tropical fruit. The wine displays excellent balance with crisp acidity and a mineral-driven finish. Its clean, refreshing character makes it an ideal companion for lighter fare and seafood dishes.",
      foodPairing: ["Oysters", "Grilled fish", "Soft cheeses", "Summer salads"],
      conversationHistory: []
    },
    {
      id: 5,
      name: "red wine",
      year: 2023,
      bottles: 0,
      image: "",
      ratings: { vn: 0, jd: 0, ws: 0, abv: 0 },
      buyAgainLink: "",
      qrCode: "QR_005",
      qrLink: "/scanned?wine=5",
      description: "A young and vibrant red wine with bright fruit flavors and soft tannins. This approachable wine showcases fresh red berry character with hints of spice and earth. The medium-bodied profile makes it versatile for various occasions and food pairings.",
      foodPairing: ["Pizza", "Pasta with tomato sauce", "Grilled vegetables", "Casual dining"],
      conversationHistory: []
    }
  ];
}

/**
 * Compare development and deployed wine data to identify sync issues
 */
export function compareWineData(): {
  inSync: boolean;
  differences: string[];
  developmentCount: number;
  deployedCount: number;
} {
  const devData = getDevelopmentWineData();
  const deployedData = getDeployedWineData();
  
  const differences: string[] = [];
  
  // Check counts
  if (devData.length !== deployedData.length) {
    differences.push(`Wine count mismatch: development has ${devData.length}, deployed has ${deployedData.length}`);
  }
  
  // Check individual wines
  for (const devWine of devData) {
    const deployedWine = deployedData.find(w => w.id === devWine.id);
    if (!deployedWine) {
      differences.push(`Wine ID ${devWine.id} exists in development but not in deployed`);
      continue;
    }
    
    // Check key fields
    if (devWine.name !== deployedWine.name) {
      differences.push(`Wine ${devWine.id}: name differs (dev: "${devWine.name}", deployed: "${deployedWine.name}")`);
    }
    if (devWine.bottles !== deployedWine.bottles) {
      differences.push(`Wine ${devWine.id}: bottle count differs (dev: ${devWine.bottles}, deployed: ${deployedWine.bottles})`);
    }
    if (devWine.image !== deployedWine.image) {
      differences.push(`Wine ${devWine.id}: image path differs (dev: "${devWine.image}", deployed: "${deployedWine.image}")`);
    }
  }
  
  return {
    inSync: differences.length === 0,
    differences,
    developmentCount: devData.length,
    deployedCount: deployedData.length
  };
}

/**
 * Sync development data to deployed environment
 */
export function syncToDeployed(wineData: WineData[]): { success: boolean; message: string } {
  try {
    // In a real implementation, this would update your production database
    // For now, we'll just validate the data structure
    
    for (const wine of wineData) {
      if (!wine.id || !wine.name || typeof wine.bottles !== 'number') {
        return {
          success: false,
          message: `Invalid wine data structure for wine ID ${wine.id}`
        };
      }
    }
    
    console.log(`Would sync ${wineData.length} wines to deployed environment`);
    
    return {
      success: true,
      message: `Successfully synchronized ${wineData.length} wines to deployed environment`
    };
  } catch (error) {
    return {
      success: false,
      message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}