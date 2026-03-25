import { NextRequest, NextResponse } from 'next/server'
import { getBetterSqlite3Db, getDbPath, initializeDatabase } from '@/lib/sqlite'
import { getSqlJsDb } from '@/lib/sqljs-singleton'
import { logger } from '@/lib/logger'
import { requireAdminApi } from '@/lib/admin-auth'
import * as fs from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Types pour l'analyse de la base de données
interface DatabaseAnalysis {
  timestamp: string
  connection: {
    status: boolean
    method: string | null
    error: string | null
  }
  database: {
    path: string | null
    exists: boolean
    size: number
  }
  tables: {
    list: string[]
    structure: Record<string, Array<{
      cid: number
      name: string
      type: string
      notnull: number
      dflt_value: unknown
      pk: number
    }>>
    counts: Record<string, number>
    problems: Array<{
      table?: string
      error: string
    }>
  }
  products: {
    total: number
    active: number
    inactive: number
    list: Array<{
      id: number | string
      name: string
      name_ar?: string | null
      price: number
      original_price?: number | null
      category: string
      stock: number
      is_active: boolean
      is_featured: boolean
      image_url?: string | null
      has_images: boolean
      created_at?: string | null
      created_by?: string | null
    }>
    problems: Array<{
      product_id?: number | string
      name?: string
      problems?: string[]
      error?: string
    }>
  }
  packs: {
    total: number
    list: Array<{
      id: number | string
      name: string
      slug: string
      price: number
      image_url?: string | null
      is_featured: boolean
      created_at?: string | null
    }>
    problems: Array<{
      pack_id?: number | string
      name?: string
      problems?: string[]
      error?: string
    }>
  }
  categories: {
    total: number
    list: Array<{
      id: number | string
      name: string
      slug: string
      description?: string | null
      image_url?: string | null
    }>
    problems: Array<{
      category_id?: number | string
      name?: string
      problems?: string[]
      error?: string
    }>
  }
  integrity: {
    foreignKeys: unknown[]
    orphaned: Array<{
      type: string
      count: number
      items: Array<{
        id: number | string
        name: string
        category?: string
      }>
    }>
    duplicates: Array<{
      type: string
      items: Array<{
        slug: string
        count: number
      }>
    }>
  }
  recommendations: string[]
}

interface TableRow {
  name: string
}

interface ProductRow {
  id: number | string
  name: string
  name_ar?: string | null
  description?: string | null
  price: number
  original_price?: number | null
  category?: string | null
  stock?: number | null
  is_active?: number | boolean
  is_featured?: number | boolean
  image_url?: string | null
  images?: string | null
  created_at?: string | null
  updated_at?: string | null
  created_by?: string | null
}

interface PackRow {
  id: number | string
  name: string
  slug: string
  description?: string | null
  price: number
  image_url?: string | null
  is_featured?: number | boolean
  created_at?: string | null
}

interface CategoryRow {
  id: number | string
  name: string
  slug: string
  description?: string | null
  image_url?: string | null
  created_at?: string | null
}

interface OrphanedProductRow {
  id: number | string
  name: string
  category?: string | null
}

interface DuplicateSlugRow {
  slug: string
  count: number
}

/**
 * Analyse approfondie de la base de données SQLite
 * Détecte tous les problèmes et affiche les produits réels
 */
export async function GET(_request: NextRequest) {
  const auth = await requireAdminApi()
  if ('error' in auth) {
    return auth.error
  }

  try {
    const analysis: DatabaseAnalysis = {
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
    // Type union pour better-sqlite3 Database ou sql.js Database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let db: any = null // better-sqlite3 Database ou sql.js Database - types incompatibles
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
      } catch {
        db = null
      }
    }

    // Fallback sur sql.js
    if (!analysis.connection.status) {
      try {
        const sqlJsDb = await getSqlJsDb()
        db = sqlJsDb.db
        // Utiliser une copie pour éviter les race conditions
        const updatedAnalysis = {
          ...analysis,
          connection: {
            ...analysis.connection,
            status: true,
            method: 'sql.js'
          }
        }
        analysis.connection.status = updatedAnalysis.connection.status
        analysis.connection.method = updatedAnalysis.connection.method
        useSqlJs = true
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        analysis.connection.error = errorMessage
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
      let tablesResult: TableRow[] = []
      
      if (useSqlJs) {
        const result = db.exec(`
          SELECT name 
          FROM sqlite_master 
          WHERE type='table' AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `)
        if (result.length > 0 && result[0].values) {
          tablesResult = (result[0].values as Array<Array<unknown>>).map((row) => ({ name: String(row[0]) }))
        }
      } else {
        tablesResult = db.prepare(`
          SELECT name 
          FROM sqlite_master 
          WHERE type='table' AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `).all() as TableRow[]
      }

      analysis.tables.list = tablesResult.map((t) => t.name)

      // 4. Analyser la structure de chaque table
      for (const tableName of analysis.tables.list) {
        try {
          let columnsResult: Array<{
            cid: number
            name: string
            type: string
            notnull: number
            dflt_value: unknown
            pk: number
          }> = []
          
          if (useSqlJs) {
            const result = db.exec(`PRAGMA table_info(${tableName})`)
            if (result.length > 0 && result[0].values) {
              columnsResult = (result[0].values as Array<Array<unknown>>).map((row) => ({
                cid: Number(row[0]),
                name: String(row[1]),
                type: String(row[2]),
                notnull: Number(row[3]),
                dflt_value: row[4],
                pk: Number(row[5])
              }))
            }
          } else {
            columnsResult = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
              cid: number
              name: string
              type: string
              notnull: number
              dflt_value: unknown
              pk: number
            }>
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
      let productsResult: ProductRow[] = []
      
      if (useSqlJs) {
        const result = db.exec(`
          SELECT id, name, name_ar, description, price, original_price, 
                 category, stock, is_active, is_featured, image_url, images,
                 created_at, updated_at, created_by
          FROM products
          ORDER BY id
        `)
        if (result.length > 0 && result[0].values) {
          const columns = result[0].columns as string[]
          productsResult = (result[0].values as Array<Array<unknown>>).map((row) => {
            const obj: Record<string, unknown> = {}
            columns.forEach((col: string, i: number) => {
              obj[col] = row[i]
            })
            // Conversion sécurisée vers ProductRow
            return {
              id: obj['id'] as number | string,
              name: String(obj['name'] || ''),
              name_ar: obj['name_ar'] as string | null | undefined,
              description: obj['description'] as string | null | undefined,
              price: Number(obj['price'] || 0),
              original_price: obj['original_price'] as number | null | undefined,
              category: obj['category'] as string | null | undefined,
              stock: obj['stock'] as number | null | undefined,
              is_active: obj['is_active'] as number | boolean | undefined,
              is_featured: obj['is_featured'] as number | boolean | undefined,
              image_url: obj['image_url'] as string | null | undefined,
              images: obj['images'] as string | null | undefined,
              created_at: obj['created_at'] as string | null | undefined,
              updated_at: obj['updated_at'] as string | null | undefined,
              created_by: obj['created_by'] as string | null | undefined
            } as ProductRow
          })
        }
      } else {
        productsResult = db.prepare(`
          SELECT id, name, name_ar, description, price, original_price, 
                 category, stock, is_active, is_featured, image_url, images,
                 created_at, updated_at, created_by
          FROM products
          ORDER BY id
        `).all() as ProductRow[]
      }

      analysis.products.total = productsResult.length
      analysis.products.active = productsResult.filter((p) => p.is_active === 1 || p.is_active === true).length
      analysis.products.inactive = analysis.products.total - analysis.products.active

      // Détecter les problèmes dans les produits
      productsResult.forEach((product) => {
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
      analysis.products.list = productsResult.slice(0, 1000).map((p) => ({
        id: p.id,
        name: p.name,
        name_ar: p.name_ar,
        price: p.price,
        original_price: p.original_price,
        category: p.category || '', // Convertir null/undefined en string vide
        stock: p.stock || 0,
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
      let packsResult: PackRow[] = []
      
      if (useSqlJs) {
        const result = db.exec(`
          SELECT id, name, slug, description, price, image_url, is_featured, created_at
          FROM packs
          ORDER BY id
        `)
        if (result.length > 0 && result[0].values) {
          const columns = result[0].columns as string[]
          packsResult = (result[0].values as Array<Array<unknown>>).map((row) => {
            const obj: Record<string, unknown> = {}
            columns.forEach((col: string, i: number) => {
              obj[col] = row[i]
            })
            // Conversion sécurisée vers PackRow
            return {
              id: obj['id'] as number | string,
              name: String(obj['name'] || ''),
              slug: String(obj['slug'] || ''),
              description: obj['description'] as string | null | undefined,
              price: Number(obj['price'] || 0),
              image_url: obj['image_url'] as string | null | undefined,
              is_featured: obj['is_featured'] as number | boolean | undefined,
              created_at: obj['created_at'] as string | null | undefined
            } as PackRow
          })
        }
      } else {
        packsResult = db.prepare(`
          SELECT id, name, slug, description, price, image_url, is_featured, created_at
          FROM packs
          ORDER BY id
        `).all() as PackRow[]
      }

      analysis.packs.total = packsResult.length

      // Détecter les problèmes dans les packs
      packsResult.forEach((pack) => {
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

      analysis.packs.list = packsResult.map((p) => ({
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
      let categoriesResult: CategoryRow[] = []
      
      if (useSqlJs) {
        const result = db.exec(`
          SELECT id, name, slug, description, image_url, created_at
          FROM categories
          ORDER BY name
        `)
        if (result.length > 0 && result[0].values) {
          const columns = result[0].columns as string[]
          categoriesResult = (result[0].values as Array<Array<unknown>>).map((row) => {
            const obj: Record<string, unknown> = {}
            columns.forEach((col: string, i: number) => {
              obj[col] = row[i]
            })
            // Conversion sécurisée vers CategoryRow
            return {
              id: obj['id'] as number | string,
              name: String(obj['name'] || ''),
              slug: String(obj['slug'] || ''),
              description: obj['description'] as string | null | undefined,
              image_url: obj['image_url'] as string | null | undefined,
              created_at: obj['created_at'] as string | null | undefined
            } as CategoryRow
          })
        }
      } else {
        categoriesResult = db.prepare(`
          SELECT id, name, slug, description, image_url, created_at
          FROM categories
          ORDER BY name
        `).all() as CategoryRow[]
      }

      analysis.categories.total = categoriesResult.length

      // Détecter les problèmes dans les catégories
      categoriesResult.forEach((cat) => {
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

      analysis.categories.list = categoriesResult.map((c) => ({
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
        let orphanedProducts: OrphanedProductRow[] = []
        
        if (useSqlJs) {
          const result = db.exec(`
            SELECT p.id, p.name, p.category
            FROM products p
            LEFT JOIN categories c ON p.category = c.name OR p.category = c.slug
            WHERE c.id IS NULL AND p.category IS NOT NULL
          `)
          if (result.length > 0 && result[0].values) {
            const columns = result[0].columns as string[]
            orphanedProducts = (result[0].values as Array<Array<unknown>>).map((row) => {
              const obj: Record<string, unknown> = {}
              columns.forEach((col: string, i: number) => {
                obj[col] = row[i]
              })
              // Conversion sécurisée vers OrphanedProductRow
              return {
                id: obj['id'] as number | string,
                name: String(obj['name'] || ''),
                category: obj['category'] ? String(obj['category']) : undefined // Convertir null en undefined
              } as OrphanedProductRow
            })
          }
        } else {
          orphanedProducts = db.prepare(`
            SELECT p.id, p.name, p.category
            FROM products p
            LEFT JOIN categories c ON p.category = c.name OR p.category = c.slug
            WHERE c.id IS NULL AND p.category IS NOT NULL
          `).all() as OrphanedProductRow[]
        }

        if (orphanedProducts.length > 0) {
          analysis.integrity.orphaned.push({
            type: 'products_with_invalid_category',
            count: orphanedProducts.length,
            items: orphanedProducts.slice(0, 10).map(p => ({
              id: p.id,
              name: p.name,
              category: p.category ?? undefined // Convertir null en undefined
            }))
          })
        }
      }

      // Vérifier les doublons de slugs dans packs
      if (analysis.tables.list.includes('packs')) {
        let duplicateSlugs: DuplicateSlugRow[] = []
        
        if (useSqlJs) {
          const result = db.exec(`
            SELECT slug, COUNT(*) as count
            FROM packs
            GROUP BY slug
            HAVING COUNT(*) > 1
          `)
          if (result.length > 0 && result[0].values) {
            const columns = result[0].columns as string[]
            duplicateSlugs = (result[0].values as Array<Array<unknown>>).map((row) => {
              const obj: Record<string, unknown> = {}
              columns.forEach((col: string, i: number) => {
                obj[col] = row[i]
              })
              // Conversion sécurisée vers DuplicateSlugRow
              return {
                slug: String(obj['slug'] || ''),
                count: Number(obj['count'] || 0)
              } as DuplicateSlugRow
            })
          }
        } else {
          duplicateSlugs = db.prepare(`
            SELECT slug, COUNT(*) as count
            FROM packs
            GROUP BY slug
            HAVING COUNT(*) > 1
          `).all() as DuplicateSlugRow[]
        }

        if (duplicateSlugs.length > 0) {
          analysis.integrity.duplicates.push({
            type: 'duplicate_pack_slugs',
            items: duplicateSlugs
          })
        }
      }
    } catch {
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

