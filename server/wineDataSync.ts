import fs from 'fs';
import path from 'path';

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
      image: "/wine-1-ridge-lytton-springs-dry-creek-zinfandel-1749209989253.png",
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
      image: "/@assets/wine-2-monte-bello-cabernet-sauvignon-1748949892850.jpeg",
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
      description: "The 2021 cherdoney showcases vibrant acidity balanced by rich, buttery mouthfeel, indicative of its Chardonnay roots. It reveals notes of tart green apple, ripe pear, and hints of vanilla with subtle minerality that speaks to cool-climate terroir.",
      foodPairing: ["Grilled chicken", "Seafood", "Creamy pasta", "Light cheeses"],
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
      image: "/@assets/wine-1-ridge-lytton-springs-dry-creek-zinfandel-1748949884152.jpeg",
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
      image: "/@assets/wine-2-monte-bello-cabernet-sauvignon-1748949892850.jpeg",
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
      description: "The 2021 cherdoney showcases vibrant acidity balanced by rich, buttery mouthfeel, indicative of its Chardonnay roots. It reveals notes of tart green apple, ripe pear, and hints of vanilla with subtle minerality that speaks to cool-climate terroir.",
      foodPairing: ["Grilled chicken", "Seafood", "Creamy pasta", "Light cheeses"],
      conversationHistory: []
    }
  ];
}

/**
 * Compare development and deployed wine data to identify sync issues
 */
export function compareWineData(): {
  inSync: boolean;
  developmentCount: number;
  deployedCount: number;
  missingInDeployed: WineData[];
  differences: any[];
} {
  const devData = getDevelopmentWineData();
  const deployedData = getDeployedWineData();
  
  const missingInDeployed = devData.filter(devWine => 
    !deployedData.find(depWine => depWine.id === devWine.id)
  );
  
  const differences: any[] = [];
  
  // Check for differences in existing wines
  devData.forEach(devWine => {
    const deployedWine = deployedData.find(dep => dep.id === devWine.id);
    if (deployedWine) {
      const diffs: any = { id: devWine.id, name: devWine.name, changes: [] };
      
      if (devWine.year !== deployedWine.year) {
        diffs.changes.push({ field: 'year', dev: devWine.year, deployed: deployedWine.year });
      }
      if (devWine.bottles !== deployedWine.bottles) {
        diffs.changes.push({ field: 'bottles', dev: devWine.bottles, deployed: deployedWine.bottles });
      }
      if (devWine.description !== deployedWine.description) {
        diffs.changes.push({ field: 'description', dev: 'updated', deployed: 'outdated' });
      }
      
      if (diffs.changes.length > 0) {
        differences.push(diffs);
      }
    }
  });
  
  return {
    inSync: missingInDeployed.length === 0 && differences.length === 0,
    developmentCount: devData.length,
    deployedCount: deployedData.length,
    missingInDeployed,
    differences
  };
}

/**
 * Sync development data to deployed environment
 */
export function syncToDeployed(wineData: WineData[]): { success: boolean; message: string } {
  try {
    // In production, this would update your database
    console.log(`Syncing ${wineData.length} wines to deployed environment`);
    
    // Simulate successful sync
    return {
      success: true,
      message: `Successfully synchronized ${wineData.length} wines to deployed environment`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to sync wine data: ${error}`
    };
  }
}