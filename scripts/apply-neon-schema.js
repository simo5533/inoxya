#!/usr/bin/env node
/**
 * Applique scripts/neon-setup-clean.sql sur la base pointée par DATABASE_URL
 * Usage: node scripts/apply-neon-schema.js
 */
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL manquant (.env.local ou variable env)')
  process.exit(1)
}

const sqlPath = path.join(__dirname, 'neon-setup-clean.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false,
})

async function main() {
  console.log('Application du schéma Neon...')
  await pool.query(sql)
  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  )
  console.log('OK — tables créées:', tables.rows.map((r) => r.table_name).join(', '))
}

main()
  .catch((err) => {
    console.error('ERREUR:', err.message)
    process.exit(1)
  })
  .finally(() => pool.end())
