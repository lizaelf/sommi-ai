import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function migrateTenantStructure() {
  // Вибираємо всі tenants, у яких є cms
  const { rows: tenants } = await db.execute(`SELECT id, cms FROM tenants WHERE cms IS NOT NULL`)

  let migrated = 0

  for (const tenant of tenants) {
    if (!tenant.cms) continue

    const cms = tenant.cms as any
    const wineEntries = cms.wineEntries || []
    const wineClub = cms.wineClub || {
      clubName: '',
      description: '',
      membershipTiers: '',
      pricing: '',
      clubBenefits: '',
    }

    // Екрануємо одинарні лапки для SQL
    const wineEntriesStr = JSON.stringify(wineEntries).replace(/'/g, "''")
    const wineClubStr = JSON.stringify(wineClub).replace(/'/g, "''")

    console.log(`3. Мігруємо tenant id=${tenant.id}...`)
    await db.execute(`UPDATE tenants SET wine_entries = '${wineEntriesStr}', wine_club = '${wineClubStr}', cms = NULL WHERE id = ${tenant.id}`)

    migrated++
    console.log(`✓ Мігровано tenant id=${tenant.id}`)
  }

  console.log(`Done. Migrated ${migrated} tenants.`)
}

migrateTenantStructure().catch(e => {
  console.error('Migration error:', e)
  process.exit(1)
})
