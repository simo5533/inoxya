/**
 * Script pour nettoyer les fichiers .md redondants et obsolètes
 * Conserve uniquement les fichiers essentiels et organise la documentation
 */

const fs = require('fs')
const path = require('path')

// Fichiers à CONSERVER (essentiels)
const filesToKeep = [
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'DEPLOYMENT_GUIDE_VERCEL.md',
  'GUIDE_ADMIN.md',
  'GUIDE_DEPLOIEMENT_FINAL.md',
  'GUIDE_TEST_LOCAL.md',
  'RAPPORT_TRADUCTIONS_FINAL.md',
  'CORRECTIONS_SUR_MESURE_ARABE.md',
  'STATUS_SERVEUR.md',
  'RAPPORT_ANALYSE_COMPLETE_PROFONDEUR_FINAL_2025.md', // Nouveau rapport principal
]

// Patterns de fichiers à SUPPRIMER (redondants/obsolètes)
const patternsToRemove = [
  /^ANALYSE_/,
  /^AUDIT_/,
  /^RAPPORT_ANALYSE_/,
  /^RAPPORT_CORRECTIONS_/,
  /^RAPPORT_CORRECTION_/,
  /^RAPPORT_FINAL_/,
  /^PHASE_\d+_/,
  /^PHASE_\d+_LOT\d+_/,
  /^PR\d+_/,
  /^CORRECTION_/,
  /^VERIFICATION_/,
  /^ETAT_/,
  /^RESUME_/,
  /^BUILD_/,
  /^NETTOYAGE_/,
  /^OPTIMISATION_/,
  /^IMAGE_/,
  /^GUIDE-.*\.md$/,
  /^README-.*\.md$/,
  /^SETUP-.*\.md$/,
  /^AJOUT-.*\.md$/,
  /^PACKS-.*\.md$/,
  /^PRODUIT_.*\.md$/,
  /^TOUT_VA_BIEN\.md$/,
  /^CONFIRMATION_.*\.md$/,
  /^DEMARRAGE_.*\.md$/,
  /^INSTRUCTIONS_.*\.md$/,
  /^IDENTIFIANTS_.*\.md$/,
  /^SECURITY_.*\.md$/,
  /^HTTPS_.*\.md$/,
  /^WEBPACK-.*\.md$/,
  /^FIX_.*\.md$/,
  /^GESTION-.*\.md$/,
  /^SCHEMA-.*\.md$/,
  /^COMMANDES-.*\.md$/,
  /^TEST_.*\.md$/,
  /^VERIFIER-.*\.md$/,
  /^PROJET_.*\.md$/,
  /^RAPPORT-.*\.md$/,
]

// Fichiers spécifiques à conserver dans docs/
const docsFilesToKeep = [
  'docs/I18N_FINAL_STATUS.md',
  'docs/PRE_DEPLOY_REPORT.md',
  'docs/DEPLOYMENT_GUIDE.md',
]

function shouldKeepFile(fileName) {
  // Toujours conserver les fichiers essentiels
  if (filesToKeep.includes(fileName)) {
    return true
  }
  
  // Conserver les fichiers dans docs/ (sauf ceux explicitement à supprimer)
  if (fileName.startsWith('docs/')) {
    return docsFilesToKeep.some(keep => fileName.includes(keep.replace('docs/', '')))
  }
  
  // Vérifier les patterns à supprimer
  const baseName = path.basename(fileName)
  for (const pattern of patternsToRemove) {
    if (pattern.test(baseName)) {
      return false
    }
  }
  
  // Par défaut, conserver si pas de pattern match
  return true
}

function findMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    // Ignorer node_modules, .next, etc.
    if (file.startsWith('.') || file === 'node_modules' || file === '.next' || file === 'out' || file === 'dist') {
      return
    }
    
    if (stat.isDirectory()) {
      findMarkdownFiles(filePath, fileList)
    } else if (file.endsWith('.md')) {
      const relativePath = path.relative(process.cwd(), filePath)
      fileList.push(relativePath)
    }
  })
  
  return fileList
}

function main() {
  console.log('🧹 NETTOYAGE DES FICHIERS .MD REDONDANTS\n')
  
  const rootDir = process.cwd()
  const allMdFiles = findMarkdownFiles(rootDir)
  
  console.log(`📊 Total fichiers .md trouvés: ${allMdFiles.length}\n`)
  
  const filesToDelete = []
  const filesToKeepList = []
  
  allMdFiles.forEach(file => {
    if (shouldKeepFile(file)) {
      filesToKeepList.push(file)
    } else {
      filesToDelete.push(file)
    }
  })
  
  console.log(`✅ Fichiers à CONSERVER: ${filesToKeepList.length}`)
  console.log(`❌ Fichiers à SUPPRIMER: ${filesToDelete.length}\n`)
  
  if (filesToDelete.length === 0) {
    console.log('✨ Aucun fichier à supprimer!\n')
    return
  }
  
  // Afficher les fichiers à supprimer
  console.log('📋 Fichiers à supprimer:\n')
  filesToDelete.slice(0, 20).forEach(file => {
    console.log(`   - ${file}`)
  })
  if (filesToDelete.length > 20) {
    console.log(`   ... et ${filesToDelete.length - 20} autres fichiers`)
  }
  
  console.log('\n⚠️  Pour supprimer ces fichiers, exécutez:')
  console.log('   node scripts/cleanup-redundant-md-files.js --execute\n')
  
  // Mode exécution
  if (process.argv.includes('--execute')) {
    console.log('\n🗑️  Suppression des fichiers...\n')
    let deleted = 0
    let errors = 0
    
    filesToDelete.forEach(file => {
      try {
        const fullPath = path.join(rootDir, file)
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
          deleted++
          console.log(`   ✅ Supprimé: ${file}`)
        }
      } catch (error) {
        errors++
        console.error(`   ❌ Erreur: ${file} - ${error.message}`)
      }
    })
    
    console.log(`\n✨ Suppression terminée: ${deleted} fichiers supprimés, ${errors} erreurs\n`)
  }
}

main()

