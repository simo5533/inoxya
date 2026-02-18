import { NextRequest, NextResponse } from 'next/server'
import { getBetterSqlite3Db, getDbPath, initializeDatabase } from '@/lib/sqlite'
import { getSqlJsDb } from '@/lib/sqljs-singleton'
import { logger } from '@/lib/logger'
import * as fs from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Analyse approfondie de la base de données SQLite
 * Détecte tous les problèmes et affiche les produits réels
 */
export async function GET(_request: NextRequest) {
  try {
    const analysis: any = {
      timestamp: new Date().toISOString(),
      connection: { status: false, method: null, error: null },
      database: { path: null, exists: false, size: 0 },
      tables: { list: [], structure: {}, counts: {}, problems: [] },
      products: { total: 0, active: 0, inactive: 0, list: [], problems: [] },
      packs: { total: 0, list: [], problems: [] },
      categories: { total: 0, list: [], problems: [] },
      integrity: { foreignKeys: [], orphaned: [], duplicates: [] },
      recommendations: []
    }

    // 1. Vérifier le chemin de la base de données
    const dbPath = getDbPath()
    analysis.database.path = dbPath
    analysis.database.exists = fs.existsSync(dbPath)
    
    if (analysis.database.exists) {
      const stats = fs.statSync(dbPath)
      analysis.database.size = stats.size
    } else {
      analysis.connection.error = `Fichier DB non trouvé: ${dbPath}`
      return NextResponse.json(analysis, { status: 200 })
    }

    // 2. Tester la connexion
    let db: any = null
    let useSqlJs = false

    // Essayer better-sqlite3 d'abord
    db = getBetterSqlite3Db()
    if (db) {
      try {
        const test = db.prepare('SELECT 1 as test').get()
        if (test) {
          analysis.connection.status = true
          analysis.connection.method = 'better-sqlite3'
        }
      } catch (e) {
        db = null
      }
    }

    // Fallback sur sql.js
    if (!analysis.connection.status) {
      try {
        const sqlJsDb = await getSqlJsDb()
        db = sqlJsDb.db
        analysis.connection.status = true
        analysis.connection.method = 'sql.js'
        useSqlJs = true
      } catch (e) {
        analysis.connection.error = e instanceof Error ? e.message : String(e)
        return NextResponse.json(analysis, { status: 200 })
      }
    }

    if (!analysis.connection.status) {
      return NextResponse.json(analysis, { status: 200 })
    }

    // Initialiser la base de données si nécessaire
    if (!useSqlJs) {
      initializeDatabase()
    }

    // 3. Lister toutes les tables
    try {
      let tablesResult: any[] = []
      
      if (useSqlJs) {
        const result = db.exec(`
          SELECT name 
          FROM sqlite_master 
          WHERE type='table' AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `)
        if (result.length > 0 && result[0].values) {
          tablesResult = result[0].values.map((row: any[]) => ({ name: row[0] }))
        }
      } else {
        tablesResult = db.prepare(`
          SELECT name 
          FROM sqlite_master 
          WHERE type='table' AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `).all() as { name: string }[]
      }

      analysis.tables.list = tablesResult.map((t: any) => t.name)

      // 4. Analyser la structure de chaque table
      for (const tableName of analysis.tables.list) {
        try {
          let columnsResult: any[] = []
          
          if (useSqlJs) {
            const result = db.exec(`PRAGMA table_info(${tableName})`)
            if (result.length > 0 && result[0].values) {
              columnsResult = result[0].values.map((row: any[]) => ({
                cid: row[0],
                name: row[1],
                type: row[2],
                notnull: row[3],
                dflt_value: row[4],
                pk: row[5]
              }))
            }
          } else {
            columnsResult = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[]
          }

          analysis.tables.structure[tableName] = columnsResult

          // Compter les enregistrements
          let count = 0
          if (useSqlJs) {
            const result = db.exec(`SELECT COUNT(*) as count FROM ${tableName}`)
            if (result.length > 0 && result[0].values && result[0].values[0]) {
              count = result[0].values[0][0] as number
            }
          } else {
            const row = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as { count: number }
            count = row.count
          }
          
          analysis.tables.counts[tableName] = count
        } catch (e) {
          analysis.tables.problems.push({
            table: tableName,
            error: e instanceof Error ? e.message : String(e)
          })
        }
      }
    } catch (e) {
      analysis.tables.problems.push({
        error: e instanceof Error ? e.message : String(e)
      })
    }

    // 5. Analyser les PRODUITS en détail
    try {
      let productsResult: any[] = []
      
      if (useSqlJs) {
        const result = db.exec(`
          SELECT id, name, name_ar, description, price, original_price, 
                 category, stock, is_active, is_featured, image_url, images,
                 created_at, updated_at, created_by
          FROM products
          ORDER BY id
        `)
        if (result.length > 0 && result[0].values) {
          const columns = result[0].columns
          productsResult = result[0].values.map((row: any[]) => {
            const obj: any = {}
            columns.forEach((col: string, i: number) => {
              obj[col] = row[i]
            })
            return obj
          })
        }
      } else {
        productsResult = db.prepare(`
          SELECT id, name, name_ar, description, price, original_price, 
                 category, stock, is_active, is_featured, image_url, images,
                 created_at, updated_at, created_by
          FROM products
          ORDER BY id
        `).all() as any[]
      }

      analysis.products.total = productsResult.length
      analysis.products.active = productsResult.filter((p: any) => p.is_active === 1 || p.is_active === true).length
      analysis.products.inactive = analysis.products.total - analysis.products.active

      // Détecter les problèmes dans les produits
      productsResult.forEach((product: any) => {
        const problems: string[] = []
        
        if (!product.name || product.name.trim() === '') {
          problems.push('Nom manquant')
        }
        if (!product.price || product.price <= 0) {
          problems.push('Prix invalide ou manquant')
        }
        if (!product.category || product.category.trim() === '') {
          problems.push('Catégorie manquante')
        }
        if (!product.image_url || product.image_url.trim() === '') {
          problems.push('Image principale manquante')
        }
        if (product.original_price && product.original_price <= product.price) {
          problems.push('Prix original invalide (doit être > prix actuel)')
        }
        if (product.stock === null || product.stock === undefined) {
          problems.push('Stock non défini')
        }

        if (problems.length > 0) {
          analysis.products.problems.push({
            product_id: product.id,
            name: product.name,
            problems
          })
        }
      })

      // Liste complète des produits (limité à 1000 pour éviter les réponses trop lourdes)
      analysis.products.list = productsResult.slice(0, 1000).map((p: any) => ({
        id: p.id,
        name: p.name,
        name_ar: p.name_ar,
        price: p.price,
        original_price: p.original_price,
        category: p.category,
        stock: p.stock,
        is_active: Boolean(p.is_active),
        is_featured: Boolean(p.is_featured),
        image_url: p.image_url,
        has_images: !!(p.images && p.images.trim() !== '' && p.images !== '[]'),
        created_at: p.created_at,
        created_by: p.created_by
      }))

    } catch (e) {
      analysis.products.problems.push({
        error: e instanceof Error ? e.message : String(e)
      })
    }

    // 6. Analyser les PACKS
    try {
      let packsResult: any[] = []
      
      if (useSqlJs) {
        const result = db.exec(`
          SELECT id, name, slug, description, price, image_url, is_featured, created_at
          FROM packs
          ORDER BY id
        `)
        if (result.length > 0 && result[0].values) {
          const columns = result[0].columns
          packsResult = result[0].values.map((row: any[]) => {
            const obj: any = {}
            columns.forEach((col: string, i: number) => {
              obj[col] = row[i]
            })
            return obj
          })
        }
      } else {
        packsResult = db.prepare(`
          SELECT id, name, slug, description, price, image_url, is_featured, created_at
          FROM packs
          ORDER BY id
        `).all() as any[]
      }

      analysis.packs.total = packsResult.length

      // Détecter les problèmes dans les packs
      packsResult.forEach((pack: any) => {
        const problems: string[] = []
        
        if (!pack.name || pack.name.trim() === '') {
          problems.push('Nom manquant')
        }
        if (!pack.slug || pack.slug.trim() === '') {
          problems.push('Slug manquant')
        }
        if (!pack.price || pack.price <= 0) {
          problems.push('Prix invalide ou manquant')
        }

        if (problems.length > 0) {
          analysis.packs.problems.push({
            pack_id: pack.id,
            name: pack.name,
            problems
          })
        }
      })

      analysis.packs.list = packsResult.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image_url: p.image_url,
        is_featured: Boolean(p.is_featured),
        created_at: p.created_at
      }))

    } catch (e) {
      analysis.packs.problems.push({
        error: e instanceof Error ? e.message : String(e)
      })
    }

    // 7. Analyser les CATÉGORIES
    try {
      let categoriesResult: any[] = []
      
      if (useSqlJs) {
        const result = db.exec(`
          SELECT id, name, slug, description, image_url, created_at
          FROM categories
          ORDER BY name
        `)
        if (result.length > 0 && result[0].values) {
          const columns = result[0].columns
          categoriesResult = result[0].values.map((row: any[]) => {
            const obj: any = {}
            columns.forEach((col: string, i: number) => {
              obj[col] = row[i]
            })
            return obj
          })
        }
      } else {
        categoriesResult = db.prepare(`
          SELECT id, name, slug, description, image_url, created_at
          FROM categories
          ORDER BY name
        `).all() as any[]
      }

      analysis.categories.total = categoriesResult.length

      // Détecter les problèmes dans les catégories
      categoriesResult.forEach((cat: any) => {
        const problems: string[] = []
        
        if (!cat.name || cat.name.trim() === '') {
          problems.push('Nom manquant')
        }
        if (!cat.slug || cat.slug.trim() === '') {
          problems.push('Slug manquant')
        }

        if (problems.length > 0) {
          analysis.categories.problems.push({
            category_id: cat.id,
            name: cat.name,
            problems
          })
        }
      })

      analysis.categories.list = categoriesResult.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image_url: c.image_url
      }))

    } catch (e) {
      analysis.categories.problems.push({
        error: e instanceof Error ? e.message : String(e)
      })
    }

    // 8. Vérifier l'intégrité des données
    try {
      // Vérifier les produits avec catégories invalides
      if (analysis.tables.list.includes('products') && analysis.tables.list.includes('categories')) {
        let orphanedProducts: any[] = []
        
        if (useSqlJs) {
          const result = db.exec(`
            SELECT p.id, p.name, p.category
            FROM products p
            LEFT JOIN categories c ON p.category = c.name OR p.category = c.slug
            WHERE c.id IS NULL AND p.category IS NOT NULL
          `)
          if (result.length > 0 && result[0].values) {
            const columns = result[0].columns
            orphanedProducts = result[0].values.map((row: any[]) => {
              const obj: any = {}
              columns.forEach((col: string, i: number) => {
                obj[col] = row[i]
              })
              return obj
            })
          }
        } else {
          orphanedProducts = db.prepare(`
            SELECT p.id, p.name, p.category
            FROM products p
            LEFT JOIN categories c ON p.category = c.name OR p.category = c.slug
            WHERE c.id IS NULL AND p.category IS NOT NULL
          `).all() as any[]
        }

        if (orphanedProducts.length > 0) {
          analysis.integrity.orphaned.push({
            type: 'products_with_invalid_category',
            count: orphanedProducts.length,
            items: orphanedProducts.slice(0, 10) // Limiter à 10 exemples
          })
        }
      }

      // Vérifier les doublons de slugs dans packs
      if (analysis.tables.list.includes('packs')) {
        let duplicateSlugs: any[] = []
        
        if (useSqlJs) {
          const result = db.exec(`
            SELECT slug, COUNT(*) as count
            FROM packs
            GROUP BY slug
            HAVING COUNT(*) > 1
          `)
          if (result.length > 0 && result[0].values) {
            const columns = result[0].columns
            duplicateSlugs = result[0].values.map((row: any[]) => {
              const obj: any = {}
              columns.forEach((col: string, i: number) => {
                obj[col] = row[i]
              })
              return obj
            })
          }
        } else {
          duplicateSlugs = db.prepare(`
            SELECT slug, COUNT(*) as count
            FROM packs
            GROUP BY slug
            HAVING COUNT(*) > 1
          `).all() as any[]
        }

        if (duplicateSlugs.length > 0) {
          analysis.integrity.duplicates.push({
            type: 'duplicate_pack_slugs',
            items: duplicateSlugs
          })
        }
      }
    } catch (e) {
      // Ignorer les erreurs d'intégrité si les tables n'existent pas
    }

    // 9. Générer des recommandations
    if (analysis.products.total === 0) {
      analysis.recommendations.push('Aucun produit dans la base de données. Créez des produits via l\'interface admin.')
    }
    if (analysis.products.problems.length > 0) {
      analysis.recommendations.push(`${analysis.products.problems.length} produit(s) ont des problèmes. Corrigez-les pour améliorer la qualité des données.`)
    }
    if (analysis.packs.total === 0) {
      analysis.recommendations.push('Aucun pack dans la base de données. Créez des packs via l\'interface admin.')
    }
    if (analysis.integrity.orphaned.length > 0) {
      analysis.recommendations.push('Certains produits ont des catégories invalides. Vérifiez les catégories des produits.')
    }
    if (analysis.integrity.duplicates.length > 0) {
      analysis.recommendations.push('Des doublons de slugs ont été détectés. Assurez-vous que chaque pack a un slug unique.')
    }

    return NextResponse.json(analysis, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    logger.error('Erreur lors de l\'analyse de la base de données:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'analyse',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

