#!/usr/bin/env node
/**
 * Applique scripts/supabase-complete-schema.sql sur le Postgres Supabase (comme le SQL Editor).
 * Prérequis .env.local (ou env) : une des options suivantes :
 *  - SUPABASE_APPLY_CONNECTION_STRING= (recommandé si échec réseau : copie intégrale depuis Supabase → Settings → Database)
 *  - DATABASE_URL= postgresql://… (URI cloud uniquement, pas localhost pour ce script)
 *  - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD (mot de passe "Database" du dashboard)
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const dns = require('dns').promises
const net = require('net')
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

function loadEnv() {
  try {
    require('dotenv').config({ path: path.join(process.cwd(), '.env.local') })
  } catch {
    // dotenv optionnel
  }
  try {
    require('dotenv').config({ path: path.join(process.cwd(), '.env') })
  } catch {
    // ignore
  }
}

/**
 * Ne pas utiliser un DATABASE_URL local (localhost) pour appliquer le schéma sur le cloud.
 * Priorité : mot de passe DB Supabase + URL projet → puis URI qui contient supabase.co → autres non locaux.
 */
function getConnectionString() {
  const direct =
    (process.env.SUPABASE_APPLY_CONNECTION_STRING && String(process.env.SUPABASE_APPLY_CONNECTION_STRING).trim()) || ''
  if (direct) {
    return direct
  }
  const pass = process.env.SUPABASE_DB_PASSWORD
  const pub = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (pass && pub) {
    const m = String(pub).match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i)
    if (m) {
      const ref = m[1]
      return `postgresql://postgres:${encodeURIComponent(pass)}@db.${ref}.supabase.co:5432/postgres?sslmode=require`
    }
  }
  const dbUrl = process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim()
  if (dbUrl) {
    if (dbUrl.includes('supabase.co')) {
      return dbUrl
    }
    if (!/localhost|127\.0\.0\.1|host\.docker\.internal/i.test(dbUrl)) {
      return dbUrl
    }
  }
  return null
}

/** Aide au diagnostic (sans mot de passe) : hôte:port cible. */
function connectionTargetForLog(connStr) {
  try {
    const normalized = String(connStr).replace(/^postgres(ql)?:\/\//i, 'https://')
    const u = new URL(normalized)
    return `${u.hostname || ''}:${u.port || 5432}`
  } catch {
    return ':(invalide)'
  }
}

function hasPostgresHost(connStr) {
  try {
    const normalized = String(connStr).replace(/^postgres(ql)?:\/\//i, 'https://')
    return Boolean(new URL(normalized).hostname)
  } catch {
    return false
  }
}

/**
 * Sous Windows, `dns.lookup` / `pg` échouent souvent en ENOTFOUND si le DNS ne fournit que des AAAA.
 * On résout en AAAA et on met l’IPv6 littérale dans l’URI (les clés A fonctionnent sans changement).
 */
async function expandPostgresUriForNodeDns(connStr) {
  try {
    const raw = String(connStr)
    const normalized = raw.replace(/^postgres(ql)?:/i, 'https:')
    const u = new URL(normalized)
    const host = u.hostname
    if (!host || net.isIP(host)) {
      return raw
    }
    let v4 = []
    try {
      v4 = await dns.resolve4(host)
    } catch {
      v4 = []
    }
    if (v4.length) {
      return raw
    }
    let v6 = []
    try {
      v6 = await dns.resolve6(host)
    } catch {
      return raw
    }
    if (!v6.length) {
      return raw
    }
    u.hostname = `[${v6[0]}]`
    return u.toString().replace(/^https:/i, 'postgres:')
  } catch {
    return connStr
  }
}

async function main() {
  loadEnv()
  const conn = getConnectionString()
  if (!conn) {
    console.error('❌ Aucune connexion Postgres.')
    console.error('   Option A (la plus fiable) :')
    console.error('   SUPABASE_APPLY_CONNECTION_STRING= (copie la chaîne "URI" depuis Supabase → Settings → Database, mode Direct 5432)')
    console.error('   Option B :')
    console.error('   NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_REF.supabase.co')
    console.error('   SUPABASE_DB_PASSWORD= (mot de passe "Database" indiqué dans Supabase → Settings → Database)')
    process.exit(1)
  }
  if (!hasPostgresHost(conn)) {
    console.error('❌ L’URI Postgres n’a pas d’hôte (souvent DATABASE_URL copié incomplet, ou [YOUR-PASSWORD] non remplacé).')
    console.error('   → Node se rabat sur 127.0.0.1. Collez la chaîne complète du dashboard, ou remplissez NEXT_PUBLIC + SUPABASE_DB_PASSWORD (non vides).')
    process.exit(1)
  }

  const sqlPath = path.join(__dirname, 'supabase-complete-schema.sql')
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Fichier introuvable:', sqlPath)
    process.exit(1)
  }
  const sql = fs.readFileSync(sqlPath, 'utf8')

  const connResolved = await expandPostgresUriForNodeDns(conn)

  const useSsl =
    /supabase\.(co|com)|pooler\.|amazonaws\.com/i.test(conn) || /sslmode=require/i.test(conn)

  // `pg` fusionne process.env (PGHOST, etc.) : un PGHOST=127.0.0.1 dans .env force localhost même avec une URI Supabase
  const pgEnvKeys = ['PGHOST', 'PGPORT', 'PGUSER', 'PGDATABASE', 'PGPASSWORD', 'PGSSLMODE', 'PGSERVICE', 'PGAPPNAME']
  const savedPgEnv = {}
  for (const k of pgEnvKeys) {
    if (k in process.env) {
      savedPgEnv[k] = process.env[k]
      delete process.env[k]
    }
  }

  const client = new Client({
    connectionString: connResolved,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  })

  const restorePgEnv = () => {
    for (const k of Object.keys(savedPgEnv)) {
      if (savedPgEnv[k] !== undefined) process.env[k] = savedPgEnv[k]
    }
  }

  if (connResolved !== conn) {
    console.log('ℹ️  DNS IPv6-only détecté : connexion via adresse littérale (Windows / Node).')
  }
  const target = connectionTargetForLog(connResolved)
  console.log('🔌 Connexion à Postgres (Supabase)…  →  ' + target)
  if (/127\.0\.0\.1|localhost|::1/i.test(target)) {
    console.error('❌ L’URI pointe vers la machine locale, pas vers Supabase (db.REF.supabase.co).')
    console.error('   Vérifiez .env : pas de 127.0.0.1 dans DATABASE_URL / SUPABASE_APPLY pour ce script, et un NEXT_PUBLIC_SUPABASE_URL = https://REF.supabase.co .')
    restorePgEnv()
    process.exit(1)
  }
  try {
    await client.connect()
  } catch (e) {
    restorePgEnv()
    const err = e && typeof e === 'object' ? e : {}
    const msg = err.message || err.toString?.() || JSON.stringify(e) || 'erreur inconnue'
    console.error('❌ Échec connexion:', msg)
    if (err.code) console.error('   code:', err.code)
    if (err.name === 'AggregateError' && Array.isArray(err.errors)) {
      err.errors.forEach((sub, i) => {
        console.error(`   cause[${i}]:`, sub && sub.message ? sub.message : sub)
      })
    }
    if (err.code === 'ECONNREFUSED' || (err.name === 'AggregateError' && String(msg).includes('ECONNREFUSED'))) {
      console.error('   → Connexion refusée (souvent pare-feu / FAI / port 5432 bloqué, ou mauvaise URI).')
      console.error('   → Testez : coller SUPABASE_APPLY_CONNECTION_STRING depuis le dashboard, ou exécuter le SQL à la main (SQL Editor).')
    }
    if (err.code === 'ENOTFOUND' || /ENOTFOUND/i.test(String(msg))) {
      console.error('   → DNS : copiez la chaîne « Session pooler » (port 5432) depuis Supabase → Database, dans SUPABASE_APPLY_CONNECTION_STRING.')
    }
    if (err.code === 'ETIMEDOUT' || /ETIMEDOUT/i.test(String(msg))) {
      console.error('   → Délai dépassé (IPv6 souvent bloqué en sortie). Utilisez la connexion « Session pooler » du dashboard (IPv4) ou exécutez le SQL dans l’éditeur Supabase.')
    }
    if (err.code === '28P01' || /password|authentication/i.test(String(msg))) {
      console.error('   → Vérifiez le mot de passe Base (Settings → Database), ce n’est pas la clé API service_role.')
    }
    process.exit(1)
  }

  try {
    console.log('📝 Exécution de supabase-complete-schema.sql (peut prendre 10–30 s)…')
    await client.query(sql)
    console.log('✅ Schéma appliqué : tables public.* créées (dont products).')
  } catch (e) {
    console.error('❌ Erreur SQL:', e.message)
    process.exit(1)
  } finally {
    try {
      await client.end()
    } catch {
      // ignore
    }
    restorePgEnv()
  }
}

main()
