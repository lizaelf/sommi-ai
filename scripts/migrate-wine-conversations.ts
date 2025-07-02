import 'dotenv/config'
import { db } from '../server/db'
import { sql } from 'drizzle-orm'

async function migrateWineConversations() {
  try {
    console.log('Starting wine conversations migration...')

    // Створюємо таблицю wine_conversations
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS wine_conversations (
        id SERIAL PRIMARY KEY,
        conversation_key TEXT NOT NULL UNIQUE,
        tenant_name TEXT NOT NULL,
        wine_id INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_activity TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)

    // Створюємо таблицю wine_messages
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS wine_messages (
        id SERIAL PRIMARY KEY,
        conversation_key TEXT NOT NULL,
        content TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)

    // Додаємо індекси для кращої продуктивності
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_wine_conversations_key ON wine_conversations(conversation_key)
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_wine_conversations_tenant_wine ON wine_conversations(tenant_name, wine_id)
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_wine_messages_conversation ON wine_messages(conversation_key)
    `)

    console.log('Wine conversations migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Запускаємо міграцію
migrateWineConversations()
  .then(() => {
    console.log('Migration completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
