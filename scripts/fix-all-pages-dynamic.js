/**
 * Script pour ajouter export const dynamic = 'force-dynamic' à TOUTES les pages
 * qui utilisent next-intl ou routing pour éviter l'erreur dynamicAccess
 */

const fs = require('fs')
const path = require('path')

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  
  // Vérifier si la page utilise next-intl ou routing
  const usesNextIntl = content.includes('next-intl') || content.includes('@/i18n/routing') || content.includes('routing')
  
  if (!usesNextIntl) {
    return false
  }
  
  // Vérifier si export const dynamic existe déjà
  if (content.includes('export const dynamic')) {
    return false
  }
  
  const lines = content.split('\n')
  let insertIndex = 0
  let hasUseClient = false
  let useClientIndex = -1
  
  // Trouver "use client" si présent
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === '"use client"' || line === "'use client'") {
      hasUseClient = true
      useClientIndex = i
      break
    }
  }
  
  if (hasUseClient && useClientIndex >= 0) {
    // Insérer après "use client"
    insertIndex = useClientIndex + 1
    // Ajouter une ligne vide si nécessaire
    if (lines[insertIndex] && lines[insertIndex].trim() !== '') {
      lines.splice(insertIndex, 0, '')
      insertIndex++
    }
  } else {
    // Trouver le premier import ou export
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('import') || (line.startsWith('export') && !line.includes('default'))) {
        insertIndex = i
        break
      }
    }
  }
  
  // Insérer les exports
  const dynamicExports = [
    '// Forcer le rendu dynamique pour éviter l\'erreur dynamicAccess',
    'export const dynamic = \'force-dynamic\'',
    'export const revalidate = 0',
    'export const dynamicParams = true',
    ''
  ]
  
  lines.splice(insertIndex, 0, ...dynamicExports)
  content = lines.join('\n')
  
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`✅ Corrigé: ${filePath}`)
  return true
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true })
  let count = 0
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name)
    
    // Ignorer node_modules, .next, etc.
    if (file.name.startsWith('.') || file.name === 'node_modules' || file.name === '.next') {
      continue
    }
    
    if (file.isDirectory()) {
      count += processDirectory(fullPath)
    } else if (file.name === 'page.tsx' || file.name === 'page.js') {
      if (processFile(fullPath)) {
        count++
      }
    }
  }
  
  return count
}

// Traiter le répertoire app
const appDir = path.join(__dirname, '..', 'app')
if (fs.existsSync(appDir)) {
  const count = processDirectory(appDir)
  console.log(`\n✅ ${count} page(s) corrigée(s)!`)
} else {
  console.log('❌ Répertoire app non trouvé')
}

