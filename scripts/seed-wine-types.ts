import { storage } from "../server/storage";
import { detectWineType, getWineTypeImagePath } from "../shared/wineTypeDetection";

// Wine type data based on spreadsheet mapping
const wineTypes = [
  { type: "Red", imagePath: "/wine-types/red.svg" },
  { type: "Rose", imagePath: "/wine-types/rose.svg" },
  { type: "White", imagePath: "/wine-types/white.svg" },
  { type: "Sparkling", imagePath: "/wine-types/sparkling.svg" },
];

async function seedWineTypes() {
  console.log("Starting wine type seeding...");
  
  try {
    // Check if wine types already exist
    const existingTypes = await storage.getAllWineTypes();
    
    if (existingTypes.length > 0) {
      console.log("Wine types already exist in database. Skipping seed.");
      return;
    }

    // Insert each wine type
    for (const wineType of wineTypes) {
      try {
        const created = await storage.createWineType(wineType);
        console.log(`✓ Created wine type: ${created.type} -> ${created.imagePath}`);
      } catch (error) {
        console.error(`✗ Failed to create wine type ${wineType.type}:`, error);
      }
    }

    console.log("Wine type seeding completed successfully!");
    
    // Test wine type detection on current wines
    console.log("\nTesting wine type detection:");
    const testWines = [
      'Ridge "Lytton Springs" Dry Creek Zinfandel',
      'Monte Bello Cabernet Sauvignon'
    ];
    
    testWines.forEach(wineName => {
      const detectedType = detectWineType(wineName);
      const imagePath = getWineTypeImagePath(detectedType);
      console.log(`  ${wineName} -> ${detectedType} (${imagePath})`);
    });
    
    // Verify the seeding
    const finalTypes = await storage.getAllWineTypes();
    console.log(`\nTotal wine types in database: ${finalTypes.length}`);
    
  } catch (error) {
    console.error("Error during wine type seeding:", error);
    process.exit(1);
  }
}

// Run the seeder
seedWineTypes()
  .then(() => {
    console.log("Wine type seeding process finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Wine type seeding failed:", error);
    process.exit(1);
  });