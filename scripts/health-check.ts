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
  ]
  const important = [
    'NEXT_PUBLIC_SITE_URL',
    'JWT_SECRET',
  ]
  critical.forEach((v) => {
    if (process.env[v]) pass('ENV', v, 'Définie', true)
    else fail('ENV', v, 'MANQUANTE — BLOQUANT', true)
  })
  important.forEach((v) => {
    if (process.env[v]) pass('ENV', v, 'Définie')
    else warn('ENV', v, 'Manquante — peut causer des bugs')
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
    const tables = ['products', 'packs', 'categories']
    for (const table of tables) {
      const { count, error: e } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      if (e) fail('DATABASE', `Table: ${table}`, e.message)
      else pass('DATABASE', `Table: ${table}`, `${count ?? 0} enregistrements`)
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    fail('DATABASE', 'Connexion', msg, true)
  }
}

function testFiles() {
  const critical = ['app/layout.tsx', 'next.config.mjs', 'tsconfig.json']
  const recommended = ['app/error.tsx', 'app/not-found.tsx', 'app/loading.tsx']
  critical.forEach((f) => {
    if (fs.existsSync(f)) pass('FILES', f, 'Présent', true)
    else fail('FILES', f, 'MANQUANT', true)
  })
  recommended.forEach((f) => {
    if (fs.existsSync(f)) pass('FILES', f, 'Présent')
    else warn('FILES', f, 'Manquant — recommandé')
  })
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
