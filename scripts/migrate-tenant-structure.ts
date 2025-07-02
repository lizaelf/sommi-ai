import 'dotenv/config'
import { db } from '../server/db'
import { sql } from 'drizzle-orm'

async function migrateTenantStructure() {
  try {
    console.log('Starting tenant structure migration...')

    // Перейменовуємо колонки на camelCase
    await db.execute(sql`ALTER TABLE tenants RENAME COLUMN wine_entries TO "wineEntries"`)
    await db.execute(sql`ALTER TABLE tenants RENAME COLUMN wine_club TO "wineClub"`)
    await db.execute(sql`ALTER TABLE tenants RENAME COLUMN ai_model TO "aiModel"`)
    await db.execute(sql`ALTER TABLE tenants RENAME COLUMN created_at TO "createdAt"`)

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Запускаємо міграцію
migrateTenantStructure()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
