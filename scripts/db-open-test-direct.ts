/**
 * PHASE 2: Script de test DIRECT pour ouvrir la DB sans passer par le logger
 * Affiche les erreurs réelles pour diagnostic
 */

import path from 'path'
import fs from 'fs'

function serializeError(err: unknown): any {
  if (err instanceof Error) {
    const serialized: any = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    }
    
    if ('code' in err) serialized.code = (err as any).code
    if ('errno' in err) serialized.errno = (err as any).errno
    if ('syscall' in err) serialized.syscall = (err as any).syscall
    if ('cause' in err) serialized.cause = err.cause
    
    Object.getOwnPropertyNames(err).forEach(key => {
      if (!['name', 'message', 'stack', 'code', 'errno', 'syscall', 'cause'].includes(key)) {
        try {
          serialized[key] = (err as any)[key]
        } catch {
          // Ignorer
        }
      }
    })
    
    return serialized
  }
  
  try {
    return {
      message: String(err),
      raw: JSON.stringify(err, Object.getOwnPropertyNames(err instanceof Object ? err : {}), 2)
    }
  } catch {
    return {
      message: String(err)
    }
  }
}

async function main() {
  console.log('\n=== PHASE 2: TEST DIRECT D\'OUVERTURE DE LA BASE DE DONNÉES ===\n')
  
  // Chemin DB
  const envDbPath = process.env['SQLITE_DB_PATH']
  const dbPath = envDbPath
    ? path.isAbsolute(envDbPath)
      ? envDbPath
      : path.resolve(process.cwd(), envDbPath)
    : path.resolve(process.cwd(), 'data', 'inoxya_bijoux.db')
  
  const absDbPath = path.resolve(dbPath)
  
  console.log(`📁 Chemin DB résolu: ${absDbPath}`)
  console.log(`📁 CWD: ${process.cwd()}`)
  console.log(`📁 Existe: ${fs.existsSync(absDbPath)}`)
  
  if (fs.existsSync(absDbPath)) {
    const stats = fs.statSync(absDbPath)
    console.log(`📁 Taille: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`)
  } else {
    console.error('❌ Le fichier DB n\'existe pas!')
    process.exit(1)
  }
  
  // Test 1: better-sqlite3
  console.log('\n🔌 Test 1: better-sqlite3...')
  let betterSqlite3Error: any = null
  try {
    const Database = require('better-sqlite3')
    const db = new Database(absDbPath)
    db.pragma('foreign_keys = ON')
    db.pragma('journal_mode = WAL')
    db.pragma('busy_timeout = 5000')
    db.pragma('synchronous = NORMAL')
    
    // Test connexion
    db.prepare('SELECT 1 as test').get()
    
    // Lister tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as Array<{ name: string }>
    console.log(`   ✅ Connecté avec better-sqlite3`)
    console.log(`   📋 Tables: ${tables.length}`)
    tables.forEach(t => console.log(`      - ${t.name}`))
    
    // Compter produits
    const productsCount = db.prepare('SELECT COUNT(*) AS c FROM products').get() as { c: number }
    console.log(`   📦 Produits: ${productsCount.c}`)
    
    // Compter packs
    const packsCount = db.prepare('SELECT COUNT(*) AS c FROM packs').get() as { c: number }
    console.log(`   📦 Packs: ${packsCount.c}`)
    
    db.close()
    console.log('\n✅✅✅ SUCCÈS: better-sqlite3 fonctionne parfaitement!\n')
    process.exit(0)
    
  } catch (e) {
    betterSqlite3Error = e
    const errorDetails = serializeError(e)
    console.log('   ❌ better-sqlite3 a échoué:')
    console.log('   📋 Détails de l\'erreur:')
    console.log(JSON.stringify(errorDetails, null, 2))
  }
  
  // Test 2: sql.js (peut nécessiter initialisation async)
  console.log('\n🔌 Test 2: sql.js fallback...')
  try {
    let sqlJsInit: any = null
    
    // Essayer différentes méthodes de chargement
    try {
      const sqlJs = require('sql.js')
      console.log('   📦 sql.js chargé, format:', typeof sqlJs, sqlJs.Database ? 'Database présent' : 'Database absent')
      
      if (sqlJs.Database) {
        sqlJsInit = sqlJs
        console.log('   ✅ Format: sqlJs.Database direct')
      } else if (sqlJs.default && sqlJs.default.Database) {
        sqlJsInit = sqlJs.default
        console.log('   ✅ Format: sqlJs.default.Database')
      } else if (typeof sqlJs === 'function') {
        // Initialisation async possible
        console.log('   ⚠️  sql.js est une fonction (peut nécessiter await)')
        try {
          sqlJsInit = sqlJs()
          if (sqlJsInit && sqlJsInit.Database) {
            console.log('   ✅ Initialisation synchrone réussie')
          }
        } catch (syncError) {
          console.log('   ⚠️  Initialisation synchrone échouée, essai async...')
          // Pour un script synchrone, on ne peut pas faire await, donc on échoue
          throw new Error('sql.js nécessite une initialisation asynchrone (non supportée dans ce script)')
        }
      } else {
        console.log('   ⚠️  Format sql.js non reconnu:', Object.keys(sqlJs))
      }
    } catch (requireError) {
      const errorDetails = serializeError(requireError)
      console.log('   ❌ Erreur lors du require sql.js:')
      console.log(JSON.stringify(errorDetails, null, 2))
      throw requireError
    }
    
    if (!sqlJsInit || !sqlJsInit.Database) {
      throw new Error('sql.js Database non disponible après chargement')
    }
    
    console.log('   ✅ sql.js initialisé, ouverture de la DB...')
    const fileBuffer = fs.readFileSync(absDbPath)
    const db = new sqlJsInit.Database(fileBuffer)
    
    // Lister tables
    const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    const tables = tablesResult.length > 0 ? tablesResult[0].values.map((row: any[]) => row[0]) : []
    console.log(`   ✅ Connecté avec sql.js`)
    console.log(`   📋 Tables: ${tables.length}`)
    tables.forEach((t: string) => console.log(`      - ${t}`))
    
    // Compter produits
    const productsResult = db.exec('SELECT COUNT(*) AS c FROM products')
    const productsCount = productsResult.length > 0 && productsResult[0].values.length > 0 ? productsResult[0].values[0][0] : 0
    console.log(`   📦 Produits: ${productsCount}`)
    
    // Compter packs
    const packsResult = db.exec('SELECT COUNT(*) AS c FROM packs')
    const packsCount = packsResult.length > 0 && packsResult[0].values.length > 0 ? packsResult[0].values[0][0] : 0
    console.log(`   📦 Packs: ${packsCount}`)
    
    console.log('\n✅✅✅ SUCCÈS: sql.js fonctionne!\n')
    process.exit(0)
    
  } catch (e) {
    const errorDetails = serializeError(e)
    console.log('   ❌ sql.js a également échoué:')
    console.log('   📋 Détails de l\'erreur:')
    console.log(JSON.stringify(errorDetails, null, 2))
  }
  
  console.error('\n❌❌❌ ÉCHEC: Aucun driver SQLite ne fonctionne\n')
  console.error('📋 Résumé des erreurs:')
  console.error('better-sqlite3:', betterSqlite3Error ? serializeError(betterSqlite3Error) : 'N/A')
  process.exit(1)
}

main().catch(console.error)

