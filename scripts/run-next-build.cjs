/**
 * Lance `next build` avec NEXT_TELEMETRY_DISABLED=1 (pas de bannière télémétrie Next.js).
 * Patch ESLint/minimatch ici aussi : si le hook prebuild n’est pas exécuté, le lint de next build ne casse pas.
 */
const { execSync, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const patch = path.join(__dirname, 'patch-eslint-minimatch.js')
if (fs.existsSync(patch)) {
  try {
    execSync(`node "${patch}"`, { stdio: 'inherit', cwd: root })
  } catch (e) {
    console.warn('[run-next-build] patch-eslint-minimatch:', e.message)
  }
}

const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
const isWin = process.platform === 'win32'

const r = spawnSync(isWin ? 'npx.cmd' : 'npx', ['next', 'build'], {
  stdio: 'inherit',
  env,
  shell: isWin,
  cwd: root,
})

process.exit(r.status == null ? 1 : r.status)
