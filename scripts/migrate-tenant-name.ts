import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function migrateTenantName() {
  // Додаємо поле, якщо його ще немає
  await db.execute(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tenant_name TEXT UNIQUE`)
  // Заповнюємо для існуючих записів
  await db.execute(`UPDATE tenants SET tenant_name = 'tenant_' || id WHERE tenant_name IS NULL OR tenant_name = ''`)
  // Робимо поле NOT NULL
  await db.execute(`ALTER TABLE tenants ALTER COLUMN tenant_name SET NOT NULL`)
  console.log('Міграція tenant_name виконана успішно!')
}

migrateTenantName().catch(e => {
  console.error('Помилка міграції:', e)
  process.exit(1)
})
