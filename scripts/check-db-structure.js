import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

async function checkDbStructure() {
  try {
    // Перевіряємо структуру таблиці tenants
    const { rows } = await db.execute(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      ORDER BY ordinal_position
    `)

    console.log('Структура таблиці tenants:')
    rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    })

    // Перевіряємо чи є дані в таблиці
    const { rows: tenantCount } = await db.execute(`SELECT COUNT(*) as count FROM tenants`)
    console.log(`\nКількість записів в tenants: ${tenantCount[0].count}`)

    // Перевіряємо приклад запису
    const { rows: sampleTenant } = await db.execute(`SELECT * FROM tenants LIMIT 1`)
    if (sampleTenant.length > 0) {
      console.log('\nПриклад запису:')
      console.log(JSON.stringify(sampleTenant[0], null, 2))
    }
  } catch (error) {
    console.error('Помилка при перевірці структури:', error)
  }
}

checkDbStructure().catch(e => {
  console.error('Error:', e)
  process.exit(1)
})
