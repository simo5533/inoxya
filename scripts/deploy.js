#!/usr/bin/env node
/**
 * Pipeline déploiement — inoxya-bijoux
 * Exécute validation puis git add/commit/push.
 * Usage: node scripts/deploy.js
 */

const path = require('path')
const { spawnSync, execSync } = require('child_process')

const root = process.cwd()
const validatePath = path.join(root, 'scripts', 'validate.js')

console.log('🚀 PIPELINE DÉPLOIEMENT')
console.log('========================\n')

// 1. Validation
const val = spawnSync(process.execPath, [validatePath], {
  cwd: root,
  stdio: 'inherit'
})
if (val.status !== 0) {
  console.error('\n❌ Validation échouée — arrêt')
  process.exit(1)
}

// 2. Git status
console.log('\n[GIT] Status:')
try {
  const status = execSync('git status --short', { encoding: 'utf8', cwd: root })
  console.log(status || '  (working tree clean)')
} catch {
  console.log('  (git non disponible ou pas un repo)')
}

// 3. Commit si changements
try {
  const porcelain = execSync('git status --porcelain', { encoding: 'utf8', cwd: root }).trim()
  if (porcelain) {
    execSync('git add -A', { cwd: root, stdio: 'inherit' })
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const msg = `fix: all production fixes — ready for Vercel [${timestamp}]

- fix: CI workflow uses npm run test -- --run (not test:coverage)
- fix: NODE_ENV trailing space removed from .env files
- fix: ENOENT RuntimeError — removed fs usage / externalized native libs
- fix: all Server Components have try/catch with fallback UI
- fix: generateMetadata protected from throwing
- fix: mapProduct with fallbacks on all fields
- fix: getSiteUrlSafe never throws
- fix: Supabase client uses @supabase/ssr pattern
- fix: next.config.js serverExternalPackages configured
- add: error.tsx, loading.tsx, not-found.tsx boundaries
- chore: clean env vars (no trailing spaces)`
    execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd: root, stdio: 'inherit' })
    console.log('✅ Commit créé')
  } else {
    console.log('ℹ️  Rien à committer (déjà à jour)')
  }
} catch (e) {
  if (e.status !== 0) {
    console.error('Erreur git commit:', e.message)
    process.exit(1)
  }
}

// 4. Push
let branch = 'main'
try {
  branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: root }).trim()
} catch (_) {}
console.log(`\n[GIT] Push → origin/${branch} ...`)
try {
  execSync(`git push origin ${branch}`, { cwd: root, stdio: 'inherit' })
  console.log(`✅ Push OK → origin/${branch}`)
} catch (e) {
  console.error('❌ Push échoué:', e.message)
  process.exit(1)
}

// 5. Vercel
console.log('\n[VERCEL] GitHub push déclenche le déploiement automatique')
console.log('  → Surveiller : https://vercel.com/aomarlaasri-9900s-projects/inoxya-bijoux')
console.log('  → Ou forcer : npx vercel --prod --force')

console.log('')
console.log('╔═════════════════════════════════════════════╗')
console.log('║  ✅ PIPELINE TERMINÉ                        ║')
console.log('║  → GitHub : github.com/basmaouarid/inoxya-bijoux   ║')
console.log('║  → Vercel : inoxya-bijoux.vercel.app        ║')
console.log('╚═════════════════════════════════════════════╝')
