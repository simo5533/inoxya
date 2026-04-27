/**
 * Vérifie la présence et le format des variables utiles (sans afficher les secrets).
 * Usage: npx tsx scripts/verify-env.ts
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

function looksLikeJwt(s: string): boolean {
  return s.startsWith('eyJ') && s.length > 40
}

function looksLikeSupabaseUrl(s: string): boolean {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(s.replace(/\/$/, ''))
}

interface Row {
  name: string
  ok: boolean
  detail?: string
}

const rows: Row[] = []

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']?.trim()
let urlHint: string | undefined
if (!supabaseUrl) urlHint = 'non défini'
else if (looksLikeJwt(supabaseUrl) || supabaseUrl.startsWith('sb_secret_') || supabaseUrl.startsWith('sb_publishable_')) {
  urlHint = 'valeur incorrecte : ressemble à une clé, pas à l’URL projet (https://xxxx.supabase.co)'
} else if (!/^https?:\/\//i.test(supabaseUrl)) {
  urlHint = 'doit commencer par https://'
} else if (!looksLikeSupabaseUrl(supabaseUrl)) {
  urlHint = 'attendu : https://(ref).supabase.co (Project URL, onglet API Supabase)'
}
rows.push({
  name: 'NEXT_PUBLIC_SUPABASE_URL',
  ok: Boolean(supabaseUrl && looksLikeSupabaseUrl(supabaseUrl)),
  detail: urlHint,
})

const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']?.trim()
rows.push({
  name: 'SUPABASE_SERVICE_ROLE_KEY',
  ok: Boolean(serviceKey && serviceKey.length >= 20),
  detail:
    !serviceKey
      ? 'non défini'
      : serviceKey.length < 20
        ? 'trop court'
        : undefined,
})

const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']?.trim()
if (anonKey && anonKey.length < 20) {
  rows.push({ name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', ok: false, detail: 'trop court' })
} else {
  rows.push({
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ok: true,
    detail: anonKey ? '(présent — pour le navigateur / auth client)' : 'non défini — ajoute la clé anon (API) pour le client',
  })
}

const blob = process.env['BLOB_READ_WRITE_TOKEN']?.trim()
rows.push({
  name: 'BLOB_READ_WRITE_TOKEN',
  ok: Boolean(blob && blob.length > 10),
  detail: !blob ? 'manquant — requis pour db:sync:local-images (pas pour --dry-run)' : undefined,
})

const access = (process.env['BLOB_STORE_ACCESS'] || 'private').trim().toLowerCase()
const accessOk = access === 'public' || access === 'private'
rows.push({
  name: 'BLOB_STORE_ACCESS',
  ok: accessOk,
  detail: accessOk ? `(${access})` : 'utiliser public ou private',
})

const siteUrl = process.env['NEXT_PUBLIC_SITE_URL']?.trim()
const needSiteForPrivate = access === 'private'
rows.push({
  name: 'NEXT_PUBLIC_SITE_URL',
  ok: needSiteForPrivate ? Boolean(siteUrl && /^https:\/\//i.test(siteUrl)) : Boolean(!needSiteForPrivate || siteUrl),
  detail: needSiteForPrivate
    ? siteUrl && !/^https:\/\//i.test(siteUrl)
      ? 'en prod utiliser https://ton-domaine.vercel.app'
      : !siteUrl
        ? 'recommandé si BLOB_STORE_ACCESS=private (URLs /api/shop-blob)'
        : '(OK pour proxy Blob)'
    : '(optionnel si store public)',
})

console.log('\n🔐 Vérification des variables (.env.local / .env) — valeurs secrètes masquées\n')
let allOk = true
for (const r of rows) {
  const icon = r.ok ? '✅' : '❌'
  console.log(`${icon} ${r.name}`)
  if (r.detail) console.log(`   → ${r.detail}`)
  if (!r.ok) allOk = false
}

console.log('')
if (allOk) {
  console.log('Résumé : les clés attendues sont présentes et le format URL Supabase est cohérent.')
  console.log('Étape suivante : npm run db:test-supabase puis npm run db:deploy:local:dry\n')
  process.exit(0)
} else {
  console.log('Résumé : corrige les lignes marquées ❌ dans .env.local puis relance.\n')
  process.exit(1)
}
