#!/usr/bin/env node
/**
 * Script pour trouver les bijoux sans stock et les packs
 */

import * as path from 'path'
import * as fs from 'fs'

// Utiliser sql.js car better-sqlite3 n'est pas compilé
const sqlJs = require('sql.js')
const dbPath = path.resolve(process.cwd(), 'data', 'inoxya_bijoux.db')

async function main() {
  try {
    console.log('🔍 Recherche des bijoux sans stock et des packs...\n')
    console.log('='.repeat(80))

    // Vérifier que le fichier existe
    if (!fs.existsSync(dbPath)) {
      console.error(`❌ Base de données non trouvée: ${dbPath}`)
      process.exit(1)
    }

    // Charger sql.js
    const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
    let SQL: any

    if (sqlJs.default && typeof sqlJs.default === 'function') {
      SQL = await sqlJs.default({
        locateFile: (file: string) => {
          if (file.endsWith('.wasm')) return wasmPath
          return file
        }
      })
    } else if (typeof sqlJs === 'function') {
      SQL = await sqlJs({
        locateFile: (file: string) => {
          if (file.endsWith('.wasm')) return wasmPath
          return file
        }
      })
    } else {
      SQL = sqlJs
    }

    // Charger la base de données
    const fileBuffer = fs.readFileSync(dbPath)
    const db = new SQL.Database(fileBuffer)

    // 1. Trouver les bijoux sans stock (stock = 0 ou NULL)
    console.log('\n📦 BIJOUX SANS STOCK (stock = 0 ou NULL)\n')
    console.log('-'.repeat(80))

    const productsWithoutStock = db.exec(`
      SELECT id, name, price, category, stock, is_active, image_url, created_at
      FROM products
      WHERE stock IS NULL OR stock = 0
      ORDER BY id
    `)

    if (productsWithoutStock.length > 0 && productsWithoutStock[0].values) {
      const columns = productsWithoutStock[0].columns
      const rows = productsWithoutStock[0].values

      console.log(`Total trouvé: ${rows.length} bijoux\n`)
      console.log('ID  | Nom                                    | Prix    | Catégorie      | Stock | Actif | Image')
      console.log('-'.repeat(80))

      rows.forEach((row: any[]) => {
        const product: any = {}
        columns.forEach((col: string, i: number) => {
          product[col] = row[i]
        })

        const name = (product.name || '').substring(0, 35).padEnd(35)
        const price = String(product.price || 0).padStart(8)
        const category = (product.category || '').substring(0, 14).padEnd(14)
        const stock = String(product.stock ?? 'NULL').padStart(5)
        const active = product.is_active ? 'Oui' : 'Non'
        const hasImage = product.image_url ? '✅' : '❌'

        console.log(
          `${String(product.id).padStart(3)} | ${name} | ${price} | ${category} | ${stock} | ${active.padEnd(5)} | ${hasImage}`
        )
      })

      // Afficher les détails complets
      console.log('\n📋 DÉTAILS COMPLETS DES BIJOUX SANS STOCK:\n')
      rows.forEach((row: any[]) => {
        const product: any = {}
        columns.forEach((col: string, i: number) => {
          product[col] = row[i]
        })

        console.log(`\n🔸 ID: ${product.id}`)
        console.log(`   Nom: ${product.name}`)
        console.log(`   Prix: ${product.price} MAD`)
        console.log(`   Catégorie: ${product.category || 'N/A'}`)
        console.log(`   Stock: ${product.stock ?? 'NULL'}`)
        console.log(`   Actif: ${product.is_active ? 'Oui' : 'Non'}`)
        console.log(`   Image: ${product.image_url || 'Aucune'}`)
        console.log(`   Créé le: ${product.created_at || 'N/A'}`)
      })
    } else {
      console.log('Aucun bijou sans stock trouvé')
    }

    // 2. Trouver tous les packs
    console.log('\n\n📦 TOUS LES PACKS\n')
    console.log('='.repeat(80))

    const packs = db.exec(`
      SELECT id, name, slug, description, price, image_url, is_featured, created_at
      FROM packs
      ORDER BY id
    `)

    if (packs.length > 0 && packs[0].values) {
      const columns = packs[0].columns
      const rows = packs[0].values

      console.log(`Total trouvé: ${rows.length} packs\n`)
      console.log('ID  | Nom                                    | Slug                    | Prix    | Vedette | Image')
      console.log('-'.repeat(80))

      rows.forEach((row: any[]) => {
        const pack: any = {}
        columns.forEach((col: string, i: number) => {
          pack[col] = row[i]
        })

        const name = (pack.name || '').substring(0, 35).padEnd(35)
        const slug = (pack.slug || '').substring(0, 23).padEnd(23)
        const price = String(pack.price || 0).padStart(8)
        const featured = pack.is_featured ? 'Oui' : 'Non'
        const hasImage = pack.image_url ? '✅' : '❌'

        console.log(
          `${String(pack.id).padStart(3)} | ${name} | ${slug} | ${price} | ${featured.padEnd(7)} | ${hasImage}`
        )
      })

      // Afficher les détails complets
      console.log('\n📋 DÉTAILS COMPLETS DES PACKS:\n')
      rows.forEach((row: any[]) => {
        const pack: any = {}
        columns.forEach((col: string, i: number) => {
          pack[col] = row[i]
        })

        console.log(`\n🔸 ID: ${pack.id}`)
        console.log(`   Nom: ${pack.name}`)
        console.log(`   Slug: ${pack.slug}`)
        console.log(`   Prix: ${pack.price} MAD`)
        console.log(`   Description: ${pack.description || 'Aucune'}`)
        console.log(`   Vedette: ${pack.is_featured ? 'Oui' : 'Non'}`)
        console.log(`   Image: ${pack.image_url || 'Aucune'}`)
        console.log(`   Créé le: ${pack.created_at || 'N/A'}`)
      })
    } else {
      console.log('Aucun pack trouvé')
    }

    // 3. Statistiques
    console.log('\n\n📊 STATISTIQUES\n')
    console.log('='.repeat(80))

    const stats = db.exec(`
      SELECT 
        (SELECT COUNT(*) FROM products WHERE stock IS NULL OR stock = 0) as products_without_stock,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM packs) as total_packs,
        (SELECT COUNT(*) FROM products WHERE is_active = 1) as active_products
    `)

    if (stats.length > 0 && stats[0].values && stats[0].values[0]) {
      const row = stats[0].values[0]
      const columns = stats[0].columns
      const statsObj: any = {}
      columns.forEach((col: string, i: number) => {
        statsObj[col] = row[i]
      })

      console.log(`Bijoux sans stock: ${statsObj.products_without_stock}`)
      console.log(`Total bijoux: ${statsObj.total_products}`)
      console.log(`Bijoux actifs: ${statsObj.active_products}`)
      console.log(`Total packs: ${statsObj.total_packs}`)
    }

    db.close()
    console.log('\n✅ Analyse terminée\n')

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main()

