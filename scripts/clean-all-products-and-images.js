/**
 * Script pour nettoyer complètement tous les produits et leurs images
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicImagesDir = path.join(__dirname, '..', 'public', 'images', 'products')

const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

console.log('🧹 Nettoyage complet du projet...\n')
console.log('='.repeat(80))

// 1. Supprimer tous les produits
console.log('\n1️⃣ Suppression de tous les produits...')
const countBefore = db.prepare('SELECT COUNT(*) as count FROM products').get()
console.log(`   📦 Produits avant suppression: ${countBefore.count}`)

const result = db.prepare('DELETE FROM products').run()
console.log(`   ✅ ${result.changes} produit(s) supprimé(s)`)

const countAfter = db.prepare('SELECT COUNT(*) as count FROM products').get()
console.log(`   📦 Produits après suppression: ${countAfter.count}`)

// 2. Supprimer toutes les images
console.log('\n2️⃣ Suppression des images...')
if (fs.existsSync(publicImagesDir)) {
  const files = fs.readdirSync(publicImagesDir, { withFileTypes: true })
  let deletedFiles = 0
  let deletedDirs = 0
  
  files.forEach(file => {
    const filePath = path.join(publicImagesDir, file.name)
    
    if (file.isDirectory()) {
      // Supprimer le dossier récursivement
      fs.rmSync(filePath, { recursive: true, force: true })
      deletedDirs++
      console.log(`   🗑️  Dossier supprimé: ${file.name}`)
    } else {
      // Supprimer le fichier
      const ext = path.extname(file.name).toLowerCase()
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        fs.unlinkSync(filePath)
        deletedFiles++
        console.log(`   🗑️  Image supprimée: ${file.name}`)
      }
    }
  })
  
  console.log(`   ✅ ${deletedFiles} fichier(s) image supprimé(s)`)
  console.log(`   ✅ ${deletedDirs} dossier(s) supprimé(s)`)
} else {
  console.log('   ⚠️  Dossier public/images/products n\'existe pas')
}

// 3. Vérification finale
console.log('\n3️⃣ Vérification finale...')
const finalCount = db.prepare('SELECT COUNT(*) as count FROM products').get()
const remainingImages = fs.existsSync(publicImagesDir) 
  ? fs.readdirSync(publicImagesDir).filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
    }).length
  : 0

console.log(`   📦 Produits restants: ${finalCount.count}`)
console.log(`   📸 Images restantes: ${remainingImages}`)

db.close()

console.log('\n' + '='.repeat(80))
if (finalCount.count === 0 && remainingImages === 0) {
  console.log('\n✅ Nettoyage complet réussi!')
  console.log('   - Tous les produits ont été supprimés')
  console.log('   - Toutes les images ont été supprimées')
  console.log('   - Le projet est maintenant vide et prêt pour de nouveaux produits')
} else {
  console.log('\n⚠️  Nettoyage partiel:')
  if (finalCount.count > 0) {
    console.log(`   - ${finalCount.count} produit(s) restant(s)`)
  }
  if (remainingImages > 0) {
    console.log(`   - ${remainingImages} image(s) restante(s)`)
  }
}

console.log('\n✅ Terminé!')

