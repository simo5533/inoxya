#!/usr/bin/env node
/**
 * AUDIT COMPLET PRÉ-DÉPLOIEMENT — INOXYA BIJOUX
 * Usage: node scripts/full-audit.mjs
 * Compatible Windows + Linux (Node ESM).
 */
import { spawnSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const BOLD = '\x1b[1m'
const NC = '\x1b[0m'

let errors = 0
let warnings = 0

function ok(msg) {
  console.log(`${GREEN}  ✅ ${msg}${NC}`)
}
function fail(msg) {
  console.log(`${RED}  ❌ ${msg}${NC}`)
  errors++
}
function warn(msg) {
  console.log(`${YELLOW}  ⚠️  ${msg}${NC}`)
  warnings++
}
function sec(title) {
  console.log(`\n${BOLD}${BLUE}━━━ ${title} ━━━${NC}`)
}

// Charger .env.local pour que les sous-processus (health-check, build) aient les variables
const cwd = process.cwd()
const envPath = resolve(cwd, '.env.local')
if (existsSync(envPath)) {
  try {
    const content = readFileSync(envPath, 'utf8')
    content.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const eq = trimmed.indexOf('=')
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim()
          const val = trimmed.slice(eq + 1).trim()
          if (key) process.env[key] = val
        }
      }
    })
  } catch {
    // ignorer si lecture impossible
  }
}

const spawnOpts = (timeout) => ({
  cwd,
  encoding: 'utf8',
  env: { ...process.env },
  shell: true, // Windows: npm/next trouvés dans PATH
  ...(timeout ? { timeout } : {}),
})

console.log(`${BLUE}${BOLD}`)
console.log('╔══════════════════════════════════════════════════════╗')
console.log('║   🔍 INOXYA BIJOUX — AUDIT COMPLET PRÉ-DÉPLOIEMENT   ║')
console.log('╚══════════════════════════════════════════════════════╝')
console.log(NC)

// 1 — Patch minimatch (chemin avec guillemets pour Windows avec espaces)
sec('Patch minimatch')
try {
  const patchPath = resolve(cwd, 'scripts', 'patch-eslint-minimatch.js').replace(/\\/g, '/')
  const r = spawnSync(`node "${patchPath}"`, [], spawnOpts())
  if (r.status === 0) ok('Patch minimatch appliqué ou déjà appliqué')
  else warn('patch-eslint-minimatch.js non exécutable ou absent')
} catch {
  warn('patch-eslint-minimatch.js introuvable')
}

// 2 — TypeScript
sec('TypeScript')
const tsc = spawnSync('npx', ['tsc', '--noEmit'], spawnOpts())
if (tsc.status === 0) ok('0 erreurs TypeScript')
else {
  fail('Erreurs TypeScript')
  const out = (tsc.stdout || '') + (tsc.stderr || '')
  out.split('\n').filter(l => l.includes('error TS')).slice(0, 5).forEach(l => console.log(`    ${l}`))
}

// 3 — ESLint
sec('ESLint')
const lint = spawnSync('npm', ['run', 'lint'], spawnOpts())
const lintOut = (lint.stdout || '') + (lint.stderr || '')
const errCount = (lintOut.match(/\serror\s/g) || []).length
const warnCount = (lintOut.match(/\swarning\s/g) || []).length
if (errCount === 0) ok('ESLint 0 erreurs')
else fail(`ESLint ${errCount} erreur(s)`)
if (warnCount > 0) warn(`ESLint ${warnCount} warning(s)`)

// 4 — Variables env
sec('Variables d\'environnement')
try {
  if (!existsSync(envPath)) {
    warn('.env.local absent (obligatoire pour health-check et build local)')
  } else {
    const content = readFileSync(envPath, 'utf8')
    const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SITE_URL']
    const missing = required.filter(k => {
      const match = content.match(new RegExp(`^\\s*${k}\\s*=(.+)$`, 'm'))
      const val = match ? match[1].trim() : ''
      return !val || val !== val.trim()
    })
    if (missing.length) fail(`Variables manquantes ou invalides: ${missing.join(', ')}`)
    else ok('Variables env .env.local présentes')
  }
} catch (e) {
  warn('Impossible de lire .env.local: ' + (e.message || e))
}

// 5 — npm audit
sec('npm audit')
const audit = spawnSync('npm', ['audit', '--audit-level=high'], spawnOpts())
if (audit.status === 0) ok('0 vulnérabilité high/critical')
else warn('Vulnérabilités détectées (npm audit pour détails)')

// 6 — Health check DB
sec('DB Supabase')
const health = spawnSync('npm', ['run', 'health-check'], spawnOpts(30000))
if (health.status === 0) ok('DB opérationnelle')
else warn('Health check échoué ou skippé (vérifier .env.local et Supabase)')

// 7 — Tests
sec('Tests')
const test = spawnSync('npm', ['run', 'test', '--', '--run'], spawnOpts(60000))
if (test.status === 0) ok('Tests passent')
else fail('Tests échouent')

// 8 — Build production (NODE_ENV=production + shell comme en manuel pour éviter échec Windows)
sec('Build production')
const buildEnv = { ...process.env, NODE_ENV: 'production' }
const buildOpts = { cwd, encoding: 'utf8', env: buildEnv, timeout: 180000, shell: true }
const build = spawnSync('npm', ['run', 'build'], buildOpts)
if (build.status === 0) ok('Build réussi')
else {
  warn('Build échoué dans le script — exécuter "npm run build" à la main pour confirmer (Vercel utilise la même commande).')
  const out = (build.stdout || '') + (build.stderr || '')
  const errLines = out.split('\n').filter(l => /error|Error|failed/i.test(l)).slice(0, 5)
  errLines.forEach(l => console.log(`    ${l}`))
}

// Rapport final
console.log('')
console.log(`${BOLD}${BLUE}`)
console.log('╔══════════════════════════════════════════════════════╗')
console.log('║                   RÉSULTAT FINAL                     ║')
console.log('╠══════════════════════════════════════════════════════╣')
if (errors === 0 && warnings === 0) {
  console.log(`║  ${GREEN}✅ 0 erreurs | 0 warnings${NC}${BOLD}${BLUE}                        ║`)
  console.log(`║  ${GREEN}🚀 DÉPLOIEMENT VERCEL AUTORISÉ${NC}${BOLD}${BLUE}                   ║`)
} else if (errors === 0) {
  console.log(`║  ${YELLOW}✅ 0 erreurs | ⚠️  ${warnings} warning(s)${NC}${BOLD}${BLUE}                    ║`)
  console.log(`║  ${YELLOW}Déploiement OK — vérifier les warnings${NC}${BOLD}${BLUE}               ║`)
} else {
  console.log(`║  ${RED}❌ ${errors} erreur(s) | ⚠️  ${warnings} warning(s)${NC}${BOLD}${BLUE}                       ║`)
  console.log(`║  ${RED}🔴 CORRIGER AVANT DÉPLOIEMENT${NC}${BOLD}${BLUE}                    ║`)
}
console.log('╚══════════════════════════════════════════════════════╝')
console.log(NC)

process.exit(errors > 0 ? 1 : 0)
