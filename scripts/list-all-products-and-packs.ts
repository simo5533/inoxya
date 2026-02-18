#!/usr/bin/env node
/**
 * Script pour lister TOUS les bijoux et packs avec leurs détails
 */

import * as path from 'path'
import * as fs from 'fs'

const sqlJs = require('sql.js')
const dbPath = path.resolve(process.cwd(), 'data', 'inoxya_bijoux.db')

async function main() {
  try {
    console.log('🔍 Liste complète des bijoux et packs\n')
    console.log('='.repeat(100))

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

    const fileBuffer = fs.readFileSync(dbPath)
    const db = new SQL.Database(fileBuffer)

    // TOUS LES BIJOUX
    console.log('\n📦 TOUS LES BIJOUX (avec stock)\n')
    console.log('-'.repeat(100))

    const allProducts = db.exec(`
      SELECT id, name, price, category, stock, is_active, is_featured, image_url, created_at
      FROM products
      ORDER BY id
    `)

    if (allProducts.length > 0 && allProducts[0].values) {
      const columns = allProducts[0].columns
      const rows = allProducts[0].values

      console.log(`Total: ${rows.length} bijoux\n`)
      
      // Compter ceux sans stock
      const withoutStock = rows.filter((row: any[]) => {
        const stock = row[columns.indexOf('stock')]
        return stock === null || stock === 0 || stock === undefined
      })

      console.log(`⚠️  Bijoux sans stock (0 ou NULL): ${withoutStock.length}\n`)

      console.log('ID  | Nom                                    | Prix    | Catégorie      | Stock | Actif | Vedette')
      console.log('-'.repeat(100))

      rows.forEach((row: any[]) => {
        const product: any = {}
        columns.forEach((col: string, i: number) => {
          product[col] = row[i]
        })

        const name = (product.name || '').substring(0, 35).padEnd(35)
        const price = String(product.price || 0).padStart(8)
        const category = (product.category || '').substring(0, 14).padEnd(14)
        const stock = product.stock === null || product.stock === undefined 
          ? 'NULL'.padStart(5) 
          : String(product.stock).padStart(5)
        const active = product.is_active ? 'Oui' : 'Non'
        const featured = product.is_featured ? '⭐' : '  '

        // Marquer ceux sans stock
        const stockMark = (product.stock === null || product.stock === 0 || product.stock === undefined) ? '⚠️' : '  '

        console.log(
          `${String(product.id).padStart(3)} | ${name} | ${price} | ${category} | ${stockMark} ${stock} | ${active.padEnd(5)} | ${featured}`
        )
      })

      // Détails des bijoux sans stock
      if (withoutStock.length > 0) {
        console.log('\n\n⚠️  DÉTAILS DES BIJOUX SANS STOCK:\n')
        console.log('='.repeat(100))
        
        withoutStock.forEach((row: any[]) => {
          const product: any = {}
          columns.forEach((col: string, i: number) => {
            product[col] = row[i]
          })

          console.log(`\n🔸 ID: ${product.id}`)
          console.log(`   Nom: ${product.name}`)
          console.log(`   Prix: ${product.price} MAD`)
          console.log(`   Catégorie: ${product.category || 'N/A'}`)
          console.log(`   Stock: ${product.stock === null ? 'NULL' : product.stock}`)
          console.log(`   Actif: ${product.is_active ? 'Oui' : 'Non'}`)
          console.log(`   Vedette: ${product.is_featured ? 'Oui' : 'Non'}`)
          console.log(`   Image: ${product.image_url || 'Aucune'}`)
          console.log(`   Créé le: ${product.created_at || 'N/A'}`)
        })
      }
    }

    // TOUS LES PACKS
    console.log('\n\n📦 TOUS LES PACKS\n')
    console.log('='.repeat(100))

    const allPacks = db.exec(`
      SELECT id, name, slug, description, price, image_url, is_featured, created_at
      FROM packs
      ORDER BY id
    `)

    if (allPacks.length > 0 && allPacks[0].values) {
      const columns = allPacks[0].columns
      const rows = allPacks[0].values

      console.log(`Total: ${rows.length} packs\n`)

      console.log('ID  | Nom                                    | Slug                    | Prix    | Vedette')
      console.log('-'.repeat(100))

      rows.forEach((row: any[]) => {
        const pack: any = {}
        columns.forEach((col: string, i: number) => {
          pack[col] = row[i]
        })

        const name = (pack.name || '').substring(0, 35).padEnd(35)
        const slug = (pack.slug || '').substring(0, 23).padEnd(23)
        const price = String(pack.price || 0).padStart(8)
        const featured = pack.is_featured ? '⭐' : '  '

        console.log(
          `${String(pack.id).padStart(3)} | ${name} | ${slug} | ${price} | ${featured}`
        )
      })

      // Détails complets
      console.log('\n\n📋 DÉTAILS COMPLETS DES PACKS:\n')
      console.log('='.repeat(100))
      
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
    }

    // Statistiques finales
    console.log('\n\n📊 STATISTIQUES FINALES\n')
    console.log('='.repeat(100))

    const stats = db.exec(`
      SELECT 
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM products WHERE stock IS NULL OR stock = 0) as products_no_stock,
        (SELECT COUNT(*) FROM products WHERE is_active = 1) as active_products,
        (SELECT COUNT(*) FROM products WHERE is_featured = 1) as featured_products,
        (SELECT COUNT(*) FROM packs) as total_packs,
        (SELECT COUNT(*) FROM packs WHERE is_featured = 1) as featured_packs
    `)

    if (stats.length > 0 && stats[0].values && stats[0].values[0]) {
      const row = stats[0].values[0]
      const columns = stats[0].columns
      const statsObj: any = {}
      columns.forEach((col: string, i: number) => {
        statsObj[col] = row[i]
      })

      console.log(`Total bijoux: ${statsObj.total_products}`)
      console.log(`Bijoux sans stock: ${statsObj.products_no_stock}`)
      console.log(`Bijoux actifs: ${statsObj.active_products}`)
      console.log(`Bijoux vedettes: ${statsObj.featured_products}`)
      console.log(`Total packs: ${statsObj.total_packs}`)
      console.log(`Packs vedettes: ${statsObj.featured_packs}`)
    }

    db.close()
    console.log('\n✅ Analyse terminée\n')

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main()

