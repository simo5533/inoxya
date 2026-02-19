#!/usr/bin/env node

/**
 * Script pour initialiser la base de données via l'API
 * Utilise sql.js si better-sqlite3 n'est pas disponible
 */

const http = require('http')

const PORT = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3001
const HOST = 'localhost'

console.log('🔧 Initialisation de la base de données via API...')
console.log(`📡 Connexion à http://${HOST}:${PORT}/api/health\n`)

// Attendre que le serveur soit prêt
function waitForServer(maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    
    const checkServer = () => {
      attempts++
      const req = http.get(`http://${HOST}:${PORT}/api/health`, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            const health = JSON.parse(data)
            console.log('✅ Serveur accessible')
            console.log(`   Driver: ${health.driver}`)
            console.log(`   DB Path: ${health.dbPath}`)
            console.log(`   DB Exists: ${health.dbExists}`)
            console.log(`   Tables: ${health.tables}`)
            console.log(`   Status: ${health.status}\n`)
            resolve(health)
          } catch (e) {
            if (attempts < maxAttempts) {
              setTimeout(checkServer, 1000)
            } else {
              reject(new Error('Timeout waiting for server'))
            }
          }
        })
      })
      
      req.on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(checkServer, 1000)
        } else {
          reject(new Error('Server not available'))
        }
      })
    }
    
    checkServer()
  })
}

// Initialiser la DB via l'API products
function initializeViaAPI() {
  return new Promise((resolve, reject) => {
    console.log('📦 Appel de /api/products pour initialiser la DB...')
    const req = http.get(`http://${HOST}:${PORT}/api/products`, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const products = JSON.parse(data)
          console.log(`✅ Base de données initialisée`)
          console.log(`   Produits trouvés: ${Array.isArray(products) ? products.length : 0}\n`)
          resolve(products)
        } catch (e) {
          console.log('⚠️ Réponse non-JSON (normal si DB vide):', data.substring(0, 100))
          resolve([])
        }
      })
    })
    
    req.on('error', (err) => {
      reject(err)
    })
  })
}

async function main() {
  try {
    // Attendre que le serveur soit prêt
    await waitForServer()
    
    // Initialiser via l'API
    await initializeViaAPI()
    
    // Vérifier à nouveau
    console.log('🔍 Vérification finale...')
    const health = await waitForServer(5)
    
    if (health.status === 'ok') {
      console.log('✅ Base de données opérationnelle!')
      console.log(`\n📊 État:`)
      console.log(`   - Driver: ${health.driver}`)
      console.log(`   - Tables: ${health.tables}`)
      console.log(`   - Taille: ${health.dbSizeKB} KB`)
      if (health.tableNames && health.tableNames.length > 0) {
        console.log(`   - Tables: ${health.tableNames.join(', ')}`)
      }
    } else {
      console.log('⚠️ Base de données non opérationnelle')
      console.log(`   Erreur: ${health.error || 'Unknown'}`)
    }
    
    console.log('\n💡 Vous pouvez maintenant tester l\'application sur http://localhost:' + PORT + '/fr')
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.log('\n💡 Assurez-vous que le serveur Next.js est démarré:')
    console.log('   npm run dev')
    process.exit(1)
  }
}

main()

