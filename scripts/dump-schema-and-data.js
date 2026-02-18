/**
 * Script pour afficher le schéma et les données de la base SQLite
 */
const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)

console.log('=== SCHEMA DE LA BASE DE DONNÉES ===\n')

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()
tables.forEach(t => {
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE name=? AND type='table'").get(t.name)
  console.log('--- Table:', t.name, '---')
  console.log(schema?.sql || 'N/A')
  console.log('')
})

console.log('\n=== DONNÉES RÉELLES (comptages) ===\n')
tables.forEach(t => {
  try {
    const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get()
    console.log(`${t.name}: ${count.c} enregistrement(s)`)
  } catch (e) {
    console.log(`${t.name}: erreur - ${e.message}`)
  }
})

console.log('\n=== DONNÉES DÉTAILLÉES (échantillons) ===\n')
tables.forEach(t => {
  try {
    const rows = db.prepare(`SELECT * FROM ${t.name} LIMIT 3`).all()
    if (rows.length > 0) {
      console.log(`\n--- ${t.name} (premiers 3) ---`)
      rows.forEach((r, i) => console.log(JSON.stringify(r, null, 2)))
    }
  } catch (e) {
    // ignorer
  }
})

db.close()
console.log('\n✅ Terminé')
