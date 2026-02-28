/**
 * HEALTH CHECK — À exécuter avant déploiement
 * Usage: npx tsx scripts/health-check.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

interface Result {
  category: string
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  critical: boolean
}

const results: Result[] = []

function pass(category: string, name: string, msg: string, critical = false) {
  results.push({ category, name, status: 'pass', message: msg, critical })
}

function fail(category: string, name: string, msg: string, critical = false) {
  results.push({ category, name, status: 'fail', message: msg, critical })
}

function warn(category: string, name: string, msg: string) {
  results.push({ category, name, status: 'warn', message: msg, critical: false })
}

function testEnvVars() {
  const critical = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]
  const optional = ['JWT_SECRET']
  critical.forEach((v) => {
    const val = process.env[v]
    if (!val) {
      fail('ENV', v, 'MANQUANTE — BLOQUANT', true)
      return
    }
    if (val !== val.trim()) {
      fail('ENV', v, 'ESPACE PARASITE en début/fin', true)
      return
    }
    // Supabase: JWT legacy (eyJ...) ou nouveau format secret (sb_secret_...)
    if (v === 'SUPABASE_SERVICE_ROLE_KEY' && !val.startsWith('eyJ') && !val.startsWith('sb_secret_')) {
      warn('ENV', v, 'Format inattendu — vérifier que c’est bien la clé service_role (pas anon)')
    }
    pass('ENV', v, 'Définie', true)
  })
  // NEXT_PUBLIC_SITE_URL: obligatoire sauf si VERCEL_URL (Option A)
  if (process.env['NEXT_PUBLIC_SITE_URL']) {
    pass('ENV', 'NEXT_PUBLIC_SITE_URL', 'Définie', true)
  } else if (process.env['VERCEL_URL']) {
    pass('ENV', 'NEXT_PUBLIC_SITE_URL', 'Non défini — VERCEL_URL utilisé (Option A)', true)
  } else {
    fail('ENV', 'NEXT_PUBLIC_SITE_URL', 'MANQUANTE — BLOQUANT (ou déployer sur Vercel)', true)
  }
  optional.forEach((v) => {
    if (process.env[v]) pass('ENV', v, 'Définie')
    else warn('ENV', v, 'Manquante — optionnel')
  })
}

async function testDatabase() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!url || !key) {
    warn('DATABASE', 'Connexion', 'Variables Supabase manquantes — test skippé')
    return
  }
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(url, key)
    const { error } = await supabase.from('products').select('id').limit(1)
    if (error) {
      fail('DATABASE', 'Connexion', error.message, true)
      return
    }
    pass('DATABASE', 'Connexion', 'Supabase connecté', true)
    const tables = ['products', 'users', 'categories', 'packs', 'orders', 'order_items', 'cart_items', 'favorites', 'payments', 'notifications']
    for (const table of tables) {
      const { count, error: e } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      if (e) {
        if (e.code === '42P01') fail('DATABASE', `Table: ${table}`, 'Table inexistante')
        else fail('DATABASE', `Table: ${table}`, e.message)
      } else pass('DATABASE', `Table: ${table}`, `${count ?? 0} enregistrements`)
    }
    const { data: activeProducts } = await supabase.from('products').select('id, name, price').or('is_active.is.null,is_active.eq.true').limit(5)
    if (!activeProducts?.length) warn('DATABASE', 'Produits actifs', 'Aucun produit actif — ajouter des produits dans Supabase')
    else pass('DATABASE', 'Produits actifs', `${activeProducts.length} produit(s) actif(s)`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    fail('DATABASE', 'Connexion', msg, true)
  }
}

function testFiles() {
  const critical = [
    'app/layout.tsx',
    'next.config.mjs',
    'tsconfig.json',
    'lib/db/index.ts',
    'lib/db/supabase-adapter.ts',
    'lib/database.ts',
    'middleware.ts',
    'i18n/routing.ts',
  ]
  const recommended = ['app/error.tsx', 'app/not-found.tsx', 'app/loading.tsx', 'app/[locale]/error.tsx']
  critical.forEach((f) => {
    if (fs.existsSync(f)) pass('FILES', f, 'Présent', true)
    else fail('FILES', f, 'MANQUANT', true)
  })
  recommended.forEach((f) => {
    if (fs.existsSync(f)) pass('FILES', f, 'Présent')
    else warn('FILES', f, 'Manquant — recommandé')
  })
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      // Bloquer uniquement si espace parasite (cause erreurs Vercel)
      if (content.match(/NODE_ENV\s*=\s*production\s+/)) fail('FILES', '.env.local', 'NODE_ENV avec espace parasite', true)
      // NODE_ENV défini sans espace : pas de warning (recommandation dans docs/ENV_ET_CLES.md)
    }
  } catch {
    // ignore
  }
}

function printReport() {
  console.log('\n' + '═'.repeat(60))
  console.log('  🎯 HEALTH CHECK REPORT')
  console.log('═'.repeat(60))
  const categories = [...new Set(results.map((r) => r.category))]
  for (const cat of categories) {
    console.log(`\n📂 ${cat}`)
    results
      .filter((r) => r.category === cat)
      .forEach((r) => {
        const icon = r.status === 'pass' ? '✅' : r.status === 'warn' ? '⚠️ ' : '❌'
        console.log(`  ${icon} ${r.name}: ${r.message}`)
      })
  }
  const failed = results.filter((r) => r.status === 'fail')
  const criticalFails = results.filter((r) => r.status === 'fail' && r.critical)
  console.log('\n' + '═'.repeat(60))
  console.log(`  ✅ ${results.filter((r) => r.status === 'pass').length} succès  ❌ ${failed.length} échecs  ⚠️  ${results.filter((r) => r.status === 'warn').length} warnings`)
  if (criticalFails.length > 0) {
    console.log('\n🔴 BLOCANTS CRITIQUES — Corriger avant déploiement')
    process.exit(1)
  }
  if (failed.length > 0) {
    console.log('\n🟠 Erreurs non-critiques — recommandé de corriger')
  } else {
    console.log('\n🎉 PROJET PRÊT POUR LE DÉPLOIEMENT')
  }
  console.log('═'.repeat(60) + '\n')
}

async function main() {
  console.log('🚀 Health check...\n')
  testEnvVars()
  await testDatabase()
  testFiles()
  printReport()
}

main().catch((e) => {
  console.error('Health check failed:', e)
  process.exit(1)
})
