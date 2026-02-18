/**
 * Script pour ajouter export const dynamic = 'force-dynamic' à toutes les pages [locale]
 * Cela évite l'erreur "Cannot read properties of undefined (reading 'dynamicAccess')"
 */

const fs = require('fs')
const path = require('path')

const localeDir = path.join(__dirname, '..', 'app', '[locale]')

function processDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name)
    
    if (file.isDirectory()) {
      processDirectory(fullPath)
    } else if (file.name === 'page.tsx' || file.name === 'page.js') {
      let content = fs.readFileSync(fullPath, 'utf8')
      
      // Vérifier si export const dynamic existe déjà
      if (!content.includes('export const dynamic')) {
        // Trouver la première ligne d'import ou le début du fichier
        const lines = content.split('\n')
        let insertIndex = 0
        
        // Trouver où insérer (après "use client" si présent, sinon avant les imports)
        let hasUseClient = false
        let useClientIndex = -1
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim() === '"use client"' || lines[i].trim() === "'use client'") {
            hasUseClient = true
            useClientIndex = i
            break
          }
        }
        
        if (hasUseClient && useClientIndex >= 0) {
          // Insérer après "use client"
          insertIndex = useClientIndex + 1
        } else {
          // Trouver le premier import
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import') || lines[i].trim().startsWith('export')) {
              insertIndex = i
              break
            }
          }
        }
        
        // Insérer les exports
        const dynamicExports = [
          '',
          '// Forcer le rendu dynamique pour éviter l\'erreur dynamicAccess',
          'export const dynamic = \'force-dynamic\'',
          'export const revalidate = 0',
          'export const dynamicParams = true',
          ''
        ]
        
        lines.splice(insertIndex, 0, ...dynamicExports)
        content = lines.join('\n')
        
        fs.writeFileSync(fullPath, content, 'utf8')
        console.log(`✅ Ajouté dynamic exports à: ${fullPath}`)
      }
    }
  }
}

// Traiter aussi les pages à la racine de app qui pourraient utiliser next-intl
const appDir = path.join(__dirname, '..', 'app')
const rootPages = ['faq', 'a-propos', 'contact', 'cgv', 'mentions-legales']

for (const page of rootPages) {
  const pagePath = path.join(appDir, page, 'page.tsx')
  if (fs.existsSync(pagePath)) {
    let content = fs.readFileSync(pagePath, 'utf8')
    
    if (!content.includes('export const dynamic')) {
      const lines = content.split('\n')
      let insertIndex = 0
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import') || lines[i].trim().startsWith('export')) {
          insertIndex = i
          break
        }
      }
      
      const dynamicExports = [
        '// Forcer le rendu dynamique pour éviter l\'erreur dynamicAccess',
        'export const dynamic = \'force-dynamic\'',
        'export const revalidate = 0',
        'export const dynamicParams = true',
        ''
      ]
      
      lines.splice(insertIndex, 0, ...dynamicExports)
      content = lines.join('\n')
      
      fs.writeFileSync(pagePath, content, 'utf8')
      console.log(`✅ Ajouté dynamic exports à: ${pagePath}`)
    }
  }
}

// Traiter le répertoire [locale]
if (fs.existsSync(localeDir)) {
  processDirectory(localeDir)
  console.log('✅ Traitement terminé!')
} else {
  console.log('❌ Répertoire [locale] non trouvé')
}

