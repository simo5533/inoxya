/**
 * Script pour nettoyer les packs en double et garder seulement les 13 officiels
 * Usage: npx tsx scripts/clean-duplicate-packs.ts
 */

import Database from 'better-sqlite3'
import { join } from 'path'

const dbPath = join(process.cwd(), 'data', 'inoxya_bijoux.db')

const officialPacks = [
  'pack-prestige',
  'pack-emeraude',
  'pack-dore-luxe',
  'pack-cloue',
  'pack-cloue-soft',
  'pack-elegancia',
  'pack-eclat-supreme',
  'pack-trefle',
  'pack-royal',
  'pack-papillon',
  'pack-imperial',
  'pack-glamour',
  'pack-black-titanium',
]

async function cleanDuplicatePacks() {
  console.log('🧹 Nettoyage des packs en double...\n')
  
  const db = new Database(dbPath)
  
  try {
    // Récupérer tous les packs
    const allPacks = db.prepare('SELECT id, name, slug FROM packs').all() as Array<{
      id: number
      name: string
      slug: string
    }>
    
    console.log(`📦 Packs actuels: ${allPacks.length}\n`)
    
    // Identifier les packs à supprimer (ceux qui ne sont pas dans la liste officielle)
    const packsToDelete: number[] = []
    const packsToKeep: string[] = []
    
    for (const pack of allPacks) {
      if (officialPacks.includes(pack.slug)) {
        // Vérifier s'il y a déjà un pack avec ce slug
        const existing = packsToKeep.find(s => s === pack.slug)
        if (existing) {
          // Doublon, marquer pour suppression
          packsToDelete.push(pack.id)
          console.log(`   ❌ Doublon: ${pack.name} (ID: ${pack.id})`)
        } else {
          packsToKeep.push(pack.slug)
          console.log(`   ✅ Gardé: ${pack.name} (ID: ${pack.id})`)
        }
      } else {
        // Pack non officiel, marquer pour suppression
        packsToDelete.push(pack.id)
        console.log(`   ❌ Non officiel: ${pack.name} (ID: ${pack.id})`)
      }
    }
    
    // Supprimer les packs en double/non officiels
    if (packsToDelete.length > 0) {
      console.log(`\n🗑️  Suppression de ${packsToDelete.length} pack(s)...\n`)
      const deletePack = db.prepare('DELETE FROM packs WHERE id = ?')
      
      for (const id of packsToDelete) {
        deletePack.run(id)
        console.log(`   ✅ Pack ID ${id} supprimé`)
      }
    } else {
      console.log('\n✅ Aucun pack à supprimer')
    }
    
    // Vérifier le résultat final
    const finalCount = db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number }
    const finalPacks = db.prepare('SELECT id, name, slug FROM packs ORDER BY id').all() as Array<{
      id: number
      name: string
      slug: string
    }>
    
    console.log(`\n📊 Résultat final:`)
    console.log(`   📦 Total packs: ${finalCount.count}`)
    console.log(`\n📋 Liste des packs:`)
    finalPacks.forEach((pack, index) => {
      console.log(`   ${index + 1}. ${pack.name} (${pack.slug})`)
    })
    
    if (finalCount.count === 13) {
      console.log('\n✅ Exactement 13 packs officiels présents!')
    } else {
      console.log(`\n⚠️  Attendu: 13 packs, trouvé: ${finalCount.count}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    db.close()
  }
}

cleanDuplicatePacks().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

