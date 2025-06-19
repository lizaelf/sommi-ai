import { db } from "../server/db";
import { wines } from "../shared/schema";
import { eq } from "drizzle-orm";

const wineData = [
  {
    id: 1,
    name: "Ridge \"Lytton Springs\" Dry Creek Zinfandel",
    year: 2021,
    bottles: 6,
    image: "/@assets/wine-1-ridge-lytton-springs-dry-creek-zinfandel-1749209989253.png",
    ratings: {
      vn: 95,
      jd: 93,
      ws: 92,
      abv: 14.8
    },
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
    year: 2019,
    bottles: 3,
    image: "/@assets/wine-2-monte-bello-cabernet-sauvignon-1749210160812.png",
    ratings: {
      vn: 98,
      jd: 96,
      ws: 95,
      abv: 13.5
    },
    buyAgainLink: "https://www.ridgewine.com/wines/monte-bello/",
    qrCode: "QR_002", 
    qrLink: "/scanned?wine=2",
    location: "Santa Cruz Mountains, California",
    description: "The 2019 Monte Bello Cabernet Sauvignon represents the pinnacle of Ridge's winemaking artistry. This wine displays remarkable complexity with layers of dark fruit, graphite minerality, and subtle oak integration. The Santa Cruz Mountains terroir imparts a distinctive elegance and longevity that defines this iconic estate.",
    foodPairing: ["Prime rib", "Aged beef", "Strong cheeses", "Dark chocolate"],
    conversationHistory: []
  }
];

async function seedWines() {
  try {
    console.log("Seeding wines...");
    
    for (const wine of wineData) {
      const existingWine = await db.select().from(wines).where(eq(wines.id, wine.id));
      
      if (existingWine.length === 0) {
        await db.insert(wines).values(wine);
        console.log(`Inserted wine: ${wine.name}`);
      } else {
        console.log(`Wine already exists: ${wine.name}`);
      }
    }
    
    console.log("Wine seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding wines:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedWines();
}

export { seedWines };