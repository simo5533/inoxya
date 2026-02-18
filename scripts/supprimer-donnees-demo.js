/**
 * Script pour supprimer les données demo de la base SQLite
 * Usage: node scripts/supprimer-donnees-demo.js
 */
const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')

try {
  const db = new Database(dbPath)
  
  // Témoignages demo (@example.com)
  const r1 = db.prepare('DELETE FROM testimonials WHERE customer_email LIKE ?').run('%@example.com%')
  console.log(`✅ Témoignages demo supprimés: ${r1.changes}`)
  
  // Contact messages demo
  const r2 = db.prepare('DELETE FROM contact_messages WHERE email LIKE ?').run('%@example.com%')
  console.log(`✅ Messages contact demo supprimés: ${r2.changes}`)
  
  db.close()
  console.log('\n✅ Nettoyage terminé')
} catch (e) {
  console.error('❌ Erreur:', e.message)
  process.exit(1)
}
