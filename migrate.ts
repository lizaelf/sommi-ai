import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./server/db";

// Run migration
async function main() {
  console.log("Starting migration...");
  
  try {
    // Add user_id column to conversations table if it doesn't exist
    await db.execute(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'conversations' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE conversations 
          ADD COLUMN user_id INTEGER DEFAULT 1 NOT NULL;
        END IF;
      END $$;
    `);
    
    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();