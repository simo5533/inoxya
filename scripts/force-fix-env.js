#!/usr/bin/env node
/**
 * Script pour forcer FORCE_SQLJS dans .env.local
 */

const fs = require('fs')
const path = require('path')

const envLocalPath = path.join(process.cwd(), '.env.local')

if (fs.existsSync(envLocalPath)) {
  let content = fs.readFileSync(envLocalPath, 'utf8')
  
  // Vérifier si FORCE_SQLJS existe
  if (!content.includes('FORCE_SQLJS')) {
    content += '\n# Force sql.js pour éviter les blocages better-sqlite3\nFORCE_SQLJS=1\n'
    fs.writeFileSync(envLocalPath, content, 'utf8')
    console.log('✅ FORCE_SQLJS=1 ajouté à .env.local')
  } else if (!content.includes('FORCE_SQLJS=1')) {
    // Remplacer FORCE_SQLJS=0 ou autre valeur
    content = content.replace(/FORCE_SQLJS=.*/g, 'FORCE_SQLJS=1')
    fs.writeFileSync(envLocalPath, content, 'utf8')
    console.log('✅ FORCE_SQLJS=1 mis à jour dans .env.local')
  } else {
    console.log('✅ FORCE_SQLJS=1 déjà configuré')
  }
} else {
  // Créer .env.local avec FORCE_SQLJS
  const content = `# Configuration INOXYA BIJOUX
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
JWT_SECRET=${require('crypto').randomBytes(64).toString('base64')}
FORCE_SQLJS=1
`
  fs.writeFileSync(envLocalPath, content, 'utf8')
  console.log('✅ .env.local créé avec FORCE_SQLJS=1')
}

console.log('\n💡 Redémarrez le serveur: npm run dev\n')

