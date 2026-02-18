import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'

async function main() {
  console.log('\n=== VÉRIFICATION DB AVEC SQL.JS ===\n')

  const dbPath = path.resolve(process.cwd(), 'data', 'inoxya_bijoux.db')
  console.log(`📁 Chemin DB: ${dbPath}`)
  console.log(`📁 Existe: ${fs.existsSync(dbPath)}`)

  if (!fs.existsSync(dbPath)) {
    console.error('❌ Fichier DB non trouvé')
    process.exit(1)
  }

  try {
    // Initialiser sql.js de manière asynchrone
    console.log('\n🔌 Initialisation de sql.js...')
    const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        if (file.endsWith('.wasm')) {
          return wasmPath
        }
        return file
      }
    })

    console.log('✅ sql.js initialisé')

    // Charger la DB
    console.log('\n📂 Chargement de la base de données...')
    const fileBuffer = fs.readFileSync(dbPath)
    const db = new SQL.Database(fileBuffer)
    console.log('✅ Base de données chargée')

    // Lister les tables
    console.log('\n📋 Tables dans la base de données:')
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    if (tables.length > 0 && tables[0]) {
      const tableNames = tables[0].values?.map((row: any[]) => row[0]) || []
      tableNames.forEach((name: string) => {
        console.log(`   - ${name}`)
      })
    } else {
      console.log('   ⚠️  Aucune table trouvée')
    }

    // Compter les produits
    console.log('\n📦 Comptage des produits:')
    const productsResult = db.exec('SELECT COUNT(*) as count FROM products')
    if (productsResult.length > 0 && productsResult[0] && productsResult[0].values && productsResult[0].values[0]) {
      const count = productsResult[0].values[0][0]
      const countNum = typeof count === 'number' ? count : Number(count) || 0
      console.log(`   ✅ Produits: ${countNum}`)

      if (countNum > 0) {
        // Afficher quelques exemples
        const samples = db.exec('SELECT id, name, price, category, image_url FROM products LIMIT 5')
        if (samples.length > 0 && samples[0] && samples[0].columns && samples[0].values) {
          console.log('   Exemples:')
          const cols = samples[0].columns
          samples[0].values.forEach((row: any[]) => {
            const obj: any = {}
            cols.forEach((col: string, i: number) => {
              obj[col] = row[i]
            })
            console.log(`     - ID ${obj.id}: ${obj.name} (${obj.price}€, ${obj.category})`)
            if (obj.image_url) {
              console.log(`       Image: ${obj.image_url}`)
            }
          })
        }
      }
    }

    // Compter les packs
    console.log('\n📦 Comptage des packs:')
    const packsResult = db.exec('SELECT COUNT(*) as count FROM packs')
    if (packsResult.length > 0 && packsResult[0] && packsResult[0].values && packsResult[0].values[0]) {
      const count = packsResult[0].values[0][0]
      const countNum = typeof count === 'number' ? count : Number(count) || 0
      console.log(`   ✅ Packs: ${countNum}`)

      if (countNum > 0) {
        // Afficher quelques exemples
        const samples = db.exec('SELECT id, name, price, image_url FROM packs LIMIT 5')
        if (samples.length > 0 && samples[0] && samples[0].columns && samples[0].values) {
          console.log('   Exemples:')
          const cols = samples[0].columns
          samples[0].values.forEach((row: any[]) => {
            const obj: any = {}
            cols.forEach((col: string, i: number) => {
              obj[col] = row[i]
            })
            console.log(`     - ID ${obj.id}: ${obj.name} (${obj.price}€)`)
            if (obj.image_url) {
              console.log(`       Image: ${obj.image_url}`)
            }
          })
        }
      }
    }

    db.close()
    console.log('\n✅ VÉRIFICATION TERMINÉE\n')

  } catch (error: any) {
    console.error('\n❌ ERREUR:', error.message || String(error))
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main().catch(console.error)

