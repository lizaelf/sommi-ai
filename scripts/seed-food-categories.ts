import { storage } from "../server/storage";

const foodCategories = [
  { type: "Appetizers", imagePath: "/food-categories/Appetizers.png" },
  { type: "Cheese", imagePath: "/food-categories/Cheese.png" },
  { type: "Meat", imagePath: "/food-categories/Meat.png" },
  { type: "Pasta", imagePath: "/food-categories/Pasta.png" },
  { type: "Poultry", imagePath: "/food-categories/Poultry.png" },
  { type: "Seafood", imagePath: "/food-categories/Seafood.png" },
  { type: "Side Dishes", imagePath: "/food-categories/Side Dishes.png" },
  { type: "Veggie", imagePath: "/food-categories/Veggie.png" },
];

async function seedFoodCategories() {
  console.log("Starting food category seeding...");
  
  try {
    // Always reseed to ensure latest image paths
    console.log("Reseeding food categories with updated image paths...");

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