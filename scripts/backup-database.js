#!/usr/bin/env node

/**
 * Script de backup automatique de la base de données SQLite
 * Usage: node scripts/backup-database.js
 * 
 * Crée une copie de la base de données dans data/backups/
 * avec un timestamp dans le nom du fichier
 */

const fs = require('fs')
const path = require('path')

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
const backupsDir = path.join(process.cwd(), 'data', 'backups')

// Créer le dossier backups s'il n'existe pas
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true })
  console.log('✅ Dossier backups créé:', backupsDir)
}

// Vérifier que la base de données existe
if (!fs.existsSync(dbPath)) {
  console.error('❌ Base de données non trouvée:', dbPath)
  process.exit(1)
}

// Générer le nom du fichier de backup avec timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
const backupFileName = `inoxya_bijoux_${timestamp}.db`
const backupPath = path.join(backupsDir, backupFileName)

try {
  // Copier la base de données
  fs.copyFileSync(dbPath, backupPath)
  
  const stats = fs.statSync(backupPath)
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
  
  console.log('✅ Backup créé avec succès!')
  console.log(`   Fichier: ${backupFileName}`)
  console.log(`   Taille: ${sizeMB} MB`)
  console.log(`   Chemin: ${backupPath}`)
  
  // Nettoyer les anciens backups (garder seulement les 30 derniers)
  const backups = fs.readdirSync(backupsDir)
    .filter(f => f.startsWith('inoxya_bijoux_') && f.endsWith('.db'))
    .map(f => ({
      name: f,
      path: path.join(backupsDir, f),
      time: fs.statSync(path.join(backupsDir, f)).mtime
    }))
    .sort((a, b) => b.time - a.time)
  
  if (backups.length > 30) {
    const toDelete = backups.slice(30)
    let deletedCount = 0
    toDelete.forEach(backup => {
      try {
        fs.unlinkSync(backup.path)
        deletedCount++
      } catch (err) {
        console.warn(`⚠️  Impossible de supprimer ${backup.name}:`, err.message)
      }
    })
    if (deletedCount > 0) {
      console.log(`🗑️  ${deletedCount} ancien(s) backup(s) supprimé(s)`)
    }
  }
  
  console.log(`\n📊 Total backups: ${backups.length}`)
  console.log('✅ Script terminé avec succès!')
} catch (error) {
  console.error('❌ Erreur lors de la création du backup:', error.message)
  process.exit(1)
}
