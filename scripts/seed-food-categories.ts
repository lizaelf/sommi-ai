import { storage } from "../server/storage";

const foodCategories = [
  { type: "Appetizers", imagePath: "/food-categories/appetizers.png" },
  { type: "Cheese", imagePath: "/food-categories/cheese.png" },
  { type: "Meat", imagePath: "/food-categories/meat.png" },
  { type: "Pasta", imagePath: "/food-categories/pasta.png" },
  { type: "Poultry", imagePath: "/food-categories/poultry.png" },
  { type: "Seafood", imagePath: "/food-categories/seafood.png" },
  { type: "Side Dishes", imagePath: "/food-categories/side-dishes.png" },
  { type: "Veggie", imagePath: "/food-categories/veggie.png" },
];

async function seedFoodCategories() {
  console.log("Starting food category seeding...");
  
  try {
    // Check if categories already exist
    const existingCategories = await storage.getAllFoodPairingCategories();
    
    if (existingCategories.length > 0) {
      console.log("Food categories already exist in database. Skipping seed.");
      return;
    }

    // Insert each category
    for (const category of foodCategories) {
      try {
        const created = await storage.createFoodPairingCategory(category);
        console.log(`✓ Created category: ${created.type} -> ${created.imagePath}`);
      } catch (error) {
        console.error(`✗ Failed to create category ${category.type}:`, error);
      }
    }

    console.log("Food category seeding completed successfully!");
    
    // Verify the seeding
    const finalCategories = await storage.getAllFoodPairingCategories();
    console.log(`Total categories in database: ${finalCategories.length}`);
    
  } catch (error) {
    console.error("Error during food category seeding:", error);
    process.exit(1);
  }
}

// Run the seeder
seedFoodCategories()
  .then(() => {
    console.log("Seeding process finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });