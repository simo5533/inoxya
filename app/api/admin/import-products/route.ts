import { NextRequest, NextResponse } from 'next/server'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { initializeDatabase, execute } from '@/lib/sqlite'
import { logger } from '@/lib/logger'
import { requireCSRF } from '@/lib/security'
import { requireAdminApi } from '@/lib/admin-auth'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

const productsDir = join(process.cwd(), 'public', 'images', 'products')
const packsDir = join(process.cwd(), 'public', 'images', 'packs')

function extractProductName(filename: string): string {
  const name = filename
    .replace(/-main\.(jpeg|jpg|png|webp)/i, '')
    .replace(/-secondary-\d+\.(jpeg|jpg|png|webp)/i, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return name
}

function detectCategory(name: string): string {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('gourmette')) return 'Bracelets'
  if (lowerName.includes('bague')) return 'Bagues'
  return 'Bagues'
}

export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    // SÉCURITÉ: Vérifier les permissions admin
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error

    // TIMEOUT: Route longue, timeout de 60 secondes
    const timeoutMs = 60000 // 60 secondes
    const timeoutPromise = new Promise<NextResponse>((resolve) => {
      setTimeout(() => {
        logger.error('[POST /api/admin/import-products] Timeout après 60 secondes')
        resolve(NextResponse.json(
          { error: 'Import timeout: opération trop longue. Veuillez réessayer avec moins de fichiers.' },
          { status: 504 }
        ))
      }, timeoutMs)
    })

    const importPromise = (async () => {
      try {
        logger.info('[POST /api/admin/import-products] Début de l\'import')
        // Initialiser la base de données
        initializeDatabase()

    // Scanner les produits
    if (!existsSync(productsDir)) {
      return NextResponse.json({ error: 'Dossier products non trouvé' }, { status: 404 })
    }

    const files = readdirSync(productsDir)
    const productsMap = new Map<string, { name: string; main: string; secondary: string[]; category: string }>()

    files.forEach(file => {
      const match = file.match(/^(.+?)-(main|secondary-\d+)\.(jpeg|jpg|png|webp)$/i)
      if (!match) return

      const baseName = match[1]
      const type = match[2]
      
      if (!baseName || !type) return

      const imagePath = `/images/products/${file}`

      if (!productsMap.has(baseName)) {
        productsMap.set(baseName, {
          name: extractProductName(baseName),
          main: '',
          secondary: [],
          category: detectCategory(baseName)
        })
      }

      const product = productsMap.get(baseName)
      if (!product) return
      
      if (type === 'main') {
        product.main = imagePath
      } else if (type.startsWith('secondary')) {
        product.secondary.push(imagePath)
      }
    })

    const products = Array.from(productsMap.values()).filter(p => p.main !== '')
    let added = 0
    let errors = 0

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      if (!product) continue
      
      try {
        const price = Math.floor(Math.random() * 1800) + 200
        const originalPrice = price + Math.floor(Math.random() * 500) + 100
        const imagesJson = JSON.stringify([product.main, ...product.secondary])

        execute(`
          INSERT INTO products (
            name, description, price, original_price, category, 
            image_url, images, is_active, is_featured, stock,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          product.name,
          `Magnifique ${product.name.toLowerCase()} en acier inoxydable de qualité supérieure.`,
          price,
          originalPrice,
          product.category,
          product.main,
          imagesJson,
          1, // is_active
          i < 9 ? 1 : 0, // Les 9 premiers sont vedettes
          10, // stock
          new Date().toISOString(),
          new Date().toISOString()
        ])

        added++
      } catch (error: unknown) {
        console.error(`Erreur pour ${product.name}:`, error)
        errors++
      }
    }

    // Scanner et insérer les packs
    let packsAdded = 0
    if (existsSync(packsDir)) {
      const packFiles = readdirSync(packsDir)
      
      for (const file of packFiles) {
        if (file.includes('.')) {
          const match = file.match(/^pack-(.+)\.(jpg|jpeg|png|webp)$/i)
          if (match) {
            const slug = match[1]
            if (!slug) continue
            const name = slug
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
            
            try {
              const price = Math.floor(Math.random() * 1000) + 500
              execute(`
                INSERT INTO packs (
                  name, slug, description, price, image_url, is_featured, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
              `, [
                `Pack ${name}`,
                `pack-${slug}`,
                `Pack exclusif ${name.toLowerCase()} avec plusieurs bijoux coordonnés.`,
                price,
                `/images/packs/${file}`,
                packsAdded < 3 ? 1 : 0,
                new Date().toISOString()
              ])
              packsAdded++
            } catch (error: unknown) {
              console.error(`Erreur pour pack ${name}:`, error)
            }
          }
        } else {
          // Dossier de pack
          const mainImage = join(packsDir, file, 'main.jpg')
          if (existsSync(mainImage)) {
            const name = file
              .replace('pack-', '')
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
            
            try {
              const price = Math.floor(Math.random() * 1000) + 500
              execute(`
                INSERT INTO packs (
                  name, slug, description, price, image_url, is_featured, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
              `, [
                `Pack ${name}`,
                file,
                `Pack exclusif ${name.toLowerCase()} avec plusieurs bijoux coordonnés.`,
                price,
                `/images/packs/${file}/main.jpg`,
                packsAdded < 3 ? 1 : 0,
                new Date().toISOString()
              ])
              packsAdded++
            } catch (error: unknown) {
              console.error(`Erreur pour pack ${name}:`, error)
            }
          }
        }
      }
    }

      logger.info(`[POST /api/admin/import-products] Import terminé: ${added} produits, ${packsAdded} packs`)
      return NextResponse.json({
        success: true,
        message: 'Import terminé',
        products: { added, errors, total: products.length },
        packs: { added: packsAdded }
      })
    } catch (error: unknown) {
      logger.error('[POST /api/admin/import-products] Erreur lors de l\'import:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'import', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      )
    }
  })()

    // Race entre l'import et le timeout
    return await Promise.race([importPromise, timeoutPromise])
  } catch (error) {
    logger.error('[POST /api/admin/import-products] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'import' },
      { status: 500 }
    )
  }
}

