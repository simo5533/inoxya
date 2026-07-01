/**
 * Audit SEO produits — rapport console + JSON optionnel.
 * Usage: npx tsx scripts/audit-product-seo.ts
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import { buildProductSeo } from '../lib/seo/product/generator'
import type { ProductSeoInput } from '../lib/seo/product/types'

async function loadProducts(): Promise<ProductSeoInput[]> {
  try {
    const { selectRows } = await import('../lib/sqlite')
    const rows = selectRows(
      `SELECT id, name, name_ar, description, price, original_price, image_url, images, category, is_active, is_featured
       FROM products WHERE (is_active = 1 OR is_active IS NULL) ORDER BY created_at DESC`
    ) as Array<{
      id: number | string
      name: string
      name_ar?: string
      description?: string
      price: number
      original_price?: number
      image_url?: string
      images?: string
      category?: string
      is_active?: number
      is_featured?: number
    }>
    if (rows.length > 0) {
      return rows.map((p) => ({
        id: String(p.id),
        name: p.name,
        name_ar: p.name_ar,
        description: p.description,
        price: Number(p.price) || 0,
        original_price: p.original_price,
        category_id: p.category,
        category: p.category,
        is_available: p.is_active !== 0,
        is_featured: Boolean(p.is_featured),
        main_image: p.image_url,
      }))
    }
  } catch (e) {
    console.warn('[audit] SQLite indisponible…', e)
  }

  try {
    const { getAllBijoux } = await import('../lib/database')
    const rows = await getAllBijoux()
    return (rows || []).map((p) => ({
      id: String(p.id),
      name: p.name,
      name_ar: p.name_ar,
      description: p.description,
      price: Number(p.price) || 0,
      original_price: p.original_price,
      category_id: p.category_id,
      is_available: p.is_available,
      is_featured: p.is_featured,
      main_image: p.main_image || p.image_url,
    }))
  } catch (e) {
    console.warn('[audit] DB indisponible, tentative fallback images…', e)
    try {
      const { getAllFallbackProducts } = await import('../lib/fallback-products')
      return getAllFallbackProducts().map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        original_price: p.original_price,
        category_id: p.category_id,
        is_available: p.is_available,
        is_featured: p.is_featured,
        main_image: p.image_url,
      }))
    } catch {
      return []
    }
  }
}

async function main() {
  const products = await loadProducts()
  const report = {
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    optimized: 0,
    metadataPerProduct: {
      seoTitle: true,
      metaDescription: true,
      h1: true,
      shortDescription: true,
      longDescription: true,
      characteristics: true,
      advantages: true,
      usageTips: true,
      careTips: true,
      occasions: true,
      faq: true,
      keywordsPrimary: true,
      keywordsSecondary: true,
      searchVariants: true,
      synonyms: true,
      imageAlts: true,
      schemaProduct: true,
      schemaOffer: true,
      schemaBreadcrumb: true,
      openGraph: true,
      twitterCard: true,
    },
    wordCount: { min: Infinity, max: 0, avg: 0 },
    byCategory: {} as Record<string, { count: number; complete: number }>,
    incomplete: [] as Array<{ id: string; name: string; missing: string[]; wordCount: number }>,
    samples: [] as Array<{ id: string; seoTitle: string; metaDescription: string; wordCount: number }>,
    recommendations: [] as string[],
  }

  let wordSum = 0

  for (const product of products) {
    const seo = buildProductSeo(product)
    wordSum += seo.wordCount
    report.wordCount.min = Math.min(report.wordCount.min, seo.wordCount)
    report.wordCount.max = Math.max(report.wordCount.max, seo.wordCount)

    const cat = product.category_id || product.category || 'Non classé'
    if (!report.byCategory[cat]) report.byCategory[cat] = { count: 0, complete: 0 }
    report.byCategory[cat].count++
    if (seo.isComplete) {
      report.optimized++
      report.byCategory[cat].complete++
    } else {
      report.incomplete.push({
        id: product.id,
        name: product.name,
        missing: seo.missingFields,
        wordCount: seo.wordCount,
      })
    }
    if (report.samples.length < 5) {
      report.samples.push({
        id: product.id,
        seoTitle: seo.seoTitle,
        metaDescription: seo.metaDescription,
        wordCount: seo.wordCount,
      })
    }
  }

  report.wordCount.avg = products.length ? Math.round(wordSum / products.length) : 0
  if (report.wordCount.min === Infinity) report.wordCount.min = 0

  if (products.length === 0) {
    report.recommendations.push('Aucun produit détecté — configurer DATABASE_URL (Neon) ou SQLite locale')
  }
  if (report.incomplete.some((p) => p.missing.includes('image'))) {
    report.recommendations.push('Ajouter des images sur les fiches sans visuel principal')
  }
  if (report.incomplete.some((p) => p.missing.includes('price'))) {
    report.recommendations.push('Corriger les prix à 0 MAD sur certaines fiches')
  }
  report.recommendations.push('Version arabe (/ar/bijoux/[id]) : contenu premium FR uniquement pour l\'instant')
  report.recommendations.push('Packs (/packs) : appliquer le même générateur SEO si souhaité')
  report.recommendations.push('Soumettre sitemap.xml dans Google Search Console et Bing Webmaster après déploiement')
  report.recommendations.push('Demander des avis clients réels pour activer AggregateRating sur les best-sellers')

  const outDir = path.join(process.cwd(), 'data')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'product-seo-audit.json')
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8')

  console.log('\n=== RAPPORT SEO PRODUITS INOXYA ===\n')
  console.log(`Produits détectés     : ${report.totalProducts}`)
  console.log(`Fiches complètes      : ${report.optimized}`)
  console.log(`Fiches à compléter    : ${report.incomplete.length}`)
  console.log(`Mots (min / moy / max): ${report.wordCount.min} / ${report.wordCount.avg} / ${report.wordCount.max}`)
  console.log(`Rapport JSON          : ${outPath}`)
  console.log('\nPar catégorie:')
  Object.entries(report.byCategory).forEach(([cat, stats]) => {
    console.log(`  • ${cat}: ${stats.complete}/${stats.count} complètes`)
  })
  if (report.incomplete.length > 0) {
    console.log('\nFiches incomplètes (extrait):')
    report.incomplete.slice(0, 10).forEach((p) => {
      console.log(`  - [${p.id}] ${p.name} (${p.wordCount} mots) → ${p.missing.join(', ')}`)
    })
  }
  console.log('\nMétadonnées générées par fiche (automatique):')
  console.log('  Title SEO, Meta description, H1, Description courte/longue,')
  console.log('  Caractéristiques, Avantages, Entretien, Occasions, FAQ (8 Q),')
  console.log('  Mots-clés (primaires/secondaires/variantes/synonymes), ALT images,')
  console.log('  Schema Product + Offer + Breadcrumb + FAQPage, Open Graph + Twitter Card')
  console.log('\nRecommandations restantes:')
  report.recommendations.forEach((r) => console.log(`  • ${r}`))
  console.log('')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
