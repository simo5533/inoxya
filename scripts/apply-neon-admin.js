#!/usr/bin/env node
/**
 * Crée ou met à jour le compte admin dans Neon.
 * Mot de passe : Admin123!
 *
 * Usage: npm run db:neon:admin
 */
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const url =
  process.env.NEON_DATABASE_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  ''

if (!url.startsWith('postgres')) {
  console.error('❌ Ajoutez NEON_DATABASE_URL dans .env.local')
  process.exit(1)
}

const sql = fs.readFileSync(path.join(__dirname, 'neon-admin-user.sql'), 'utf8')

const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
})

pool
  .query(sql)
  .then((res) => {
    const rows = res[res.length - 1]?.rows ?? res.rows ?? []
    console.log('✅ Compte(s) admin prêt(s) dans Neon')
    if (rows.length) {
      rows.forEach((r) => console.log(`   - ${r.phone} (${r.role})`))
    }
    console.log('\nConnexion:')
    console.log('   Téléphone: admin_phone')
    console.log('   Mot de passe: Admin123!')
  })
  .catch((err) => {
    console.error('❌', err.message)
    process.exit(1)
  })
  .finally(() => pool.end())
