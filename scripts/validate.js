#!/usr/bin/env node
/**
 * Validation pré-déploiement — inoxya-bijoux
 * Compatible Windows / Linux / macOS (Node.js)
 * Usage: node scripts/validate.js
 */

const fs = require('fs')
const path = require('path')
const { execSync, spawnSync } = require('child_process')

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const BOLD = '\x1b[1m'
const NC = '\x1b[0m'

let errors = 0
let warnings = 0

function pass (msg) {
  console.log(`${GREEN}  ✅ ${msg}${NC}`)
}
function fail (msg) {
  console.log(`${RED}  ❌ ${msg}${NC}`)
  errors++
}
function warn (msg) {
  console.log(`${YELLOW}  ⚠️  ${msg}${NC}`)
  warnings++
}
function section (title) {
  console.log(`\n${BOLD}${BLUE}▶ ${title}${NC}`)
}

function run (cmd, opts = {}) {
  try {
    const r = spawnSync(cmd, { shell: true, stdio: 'pipe', ...opts })
    return r.status === 0
  } catch {
    return false
  }
}

function runOut (cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
  } catch {
    return ''
  }
}

console.log(`${BLUE}${BOLD}`)
console.log('╔═════════════════════════════════════════════╗')
console.log('║   VALIDATION FINALE PRÉ-DÉPLOIEMENT         ║')
console.log('║   inoxya-bijoux                             ║')
console.log('╚═════════════════════════════════════════════╝')
console.log(NC)

// 1. Variables d'environnement
section("Variables d'environnement")
const envPath = path.join(process.cwd(), '.env.local')
const critical = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL'
]
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  const lines = content.split('\n')
  const env = {}
  for (const line of lines) {
    if (!line.includes('=') || line.startsWith('#') || line.trim() === '') continue
    const eq = line.indexOf('=')
    const key = line.substring(0, eq).trim()
    const value = line.substring(eq + 1).trim()
    env[key] = value
  }
  for (const v of critical) {
    const val = env[v]
    if (!val) fail(`MANQUANTE: ${v}`)
    else if (val !== val.trim()) fail(`ESPACE PARASITE: ${v}`)
    else pass(v)
  }
} else {
  for (const v of critical) {
    warn(`${v} (fichier .env.local absent — à définir sur Vercel)`)
  }
}

// 2. NODE_ENV dans .env
section('NODE_ENV')
const envFiles = ['.env', '.env.local', '.env.production']
for (const f of envFiles) {
  const fp = path.join(process.cwd(), f)
  if (fs.existsSync(fp)) {
    const content = fs.readFileSync(fp, 'utf8')
    if (content.includes('NODE_ENV')) {
      if (/\bNODE_ENV\s*=\s*["']?production\s+["']?/.test(content) || /NODE_ENV=production\s+$/.test(content)) {
        fail(`Espace dans NODE_ENV (${f})`)
      } else {
        pass(`NODE_ENV propre dans ${f}`)
      }
    }
  }
}

// 3. Accès fs dans app/ et lib/
section('Accès fichiers (ENOENT)')
function grep (dir, pattern) {
  const results = []
  if (!fs.existsSync(dir)) return results
  const walk = (d) => {
    try {
      const entries = fs.readdirSync(d, { withFileTypes: true })
      for (const e of entries) {
        const full = path.join(d, e.name)
        if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.next') walk(full)
        else if (e.isFile() && /\.(ts|tsx|js|jsx)$/.test(e.name)) {
          const text = fs.readFileSync(full, 'utf8')
          if (pattern.test(text)) results.push(full)
        }
      }
    } catch (_) {}
  }
  walk(dir)
  return results
}
const appDir = path.join(process.cwd(), 'app')
const libDir = path.join(process.cwd(), 'lib')
const allowedFs = [
  'lib' + path.sep + 'sqlite.ts',
  'lib' + path.sep + 'sqljs-singleton.ts',
  'app' + path.sep + 'api' + path.sep
]
const isAllowed = (filePath) => allowedFs.some(a => filePath.includes(a))
const fsApp = grep(appDir, /readFileSync|createReadStream|writeFileSync/).filter(f => !isAllowed(f))
const fsLib = grep(libDir, /readFileSync|createReadStream|writeFileSync/).filter(f => !isAllowed(f))
const fsUsage = fsApp.concat(fsLib)
if (fsUsage.length > 0) {
  fail('fs.readFileSync / createReadStream trouvé: ' + fsUsage.slice(0, 5).join(', '))
} else {
  pass('Aucun accès fs interdit dans app/ et lib/ (DB adapter et app/api autorisés)')
}

// 4. Error boundaries
section('Error Boundaries')
const appRoot = path.join(process.cwd(), 'app')
const has = (file) => fs.existsSync(path.join(appRoot, file))
if (has('error.tsx')) pass('error.tsx')
else warn('error.tsx manquant')
if (has('loading.tsx')) pass('loading.tsx')
else warn('loading.tsx manquant')
if (has('not-found.tsx')) pass('not-found.tsx')
else warn('not-found.tsx manquant')

// 5. TypeScript
section('TypeScript')
if (run('npx tsc --noEmit')) {
  pass('TypeScript — 0 erreurs')
} else {
  fail('TypeScript — erreurs')
  const out = runOut('npx tsc --noEmit 2>&1')
  const lines = out.split('\n').filter(l => l.includes('error TS')).slice(0, 5)
  lines.forEach(l => console.log(`     ${l}`))
}

// 6. Tests
section('Tests unitaires')
if (run('npm run test -- --run')) {
  pass('Tests — tous passent')
} else {
  fail('Tests — échecs')
}

// 7. Build
section('Build production')
const nextDir = path.join(process.cwd(), '.next')
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true })
  } catch (_) {}
}
const buildOk = spawnSync('npm', ['run', 'build'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PATH: [path.join(process.cwd(), 'node_modules', '.bin'), process.env.PATH].filter(Boolean).join(path.delimiter) }
}).status === 0
if (buildOk) {
  pass('Build — succès')
} else {
  fail('Build — ÉCHEC')
}

// Rapport final
console.log('')
console.log(`${BOLD}${BLUE}`)
console.log('╔═════════════════════════════════════════════╗')
console.log('║              RÉSULTAT FINAL                 ║')
console.log('╠═════════════════════════════════════════════╣')
if (errors === 0 && warnings === 0) {
  console.log(`║  ${GREEN}✅ 0 erreurs | 0 warnings${NC}${BOLD}${BLUE}               ║`)
  console.log(`║  ${GREEN}🚀 PRÊT POUR DÉPLOIEMENT VERCEL${NC}${BOLD}${BLUE}          ║`)
} else if (errors === 0) {
  console.log(`║  ${YELLOW}⚠️  0 erreurs | ${warnings} warnings${NC}${BOLD}${BLUE}              ║`)
  console.log(`║  ${YELLOW}Déploiement possible — vérifier warnings${NC}${BOLD}${BLUE}  ║`)
} else {
  console.log(`║  ${RED}❌ ${errors} erreurs | ${warnings} warnings${NC}${BOLD}${BLUE}               ║`)
  console.log(`║  ${RED}🔴 CORRIGER AVANT DE DÉPLOYER${NC}${BOLD}${BLUE}            ║`)
}
console.log('╚═════════════════════════════════════════════╝')
console.log(NC)

process.exit(errors > 0 ? 1 : 0)
