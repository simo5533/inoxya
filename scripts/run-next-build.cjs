/**
 * Lance `next build` avec NEXT_TELEMETRY_DISABLED=1 (pas de bannière télémétrie Next.js).
 * Compatible Windows / macOS / Linux (Vercel inclusivement).
 */
const { spawnSync } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
const isWin = process.platform === 'win32'

const r = spawnSync(isWin ? 'npx.cmd' : 'npx', ['next', 'build'], {
  stdio: 'inherit',
  env,
  shell: isWin,
  cwd: root,
})

process.exit(r.status == null ? 1 : r.status)
