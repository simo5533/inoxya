#!/usr/bin/env node
/**
 * Postinstall: patch ESLint/minimatch toujours (Vercel/CI compris) — requis car minimatch v10+ n’a pas
 * d’export default et `next build` lance ESLint. fix-opentelemetry: comme avant, ignoré en CI/Vercel.
 */
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')

const runScript = (name) => {
  const p = path.join(__dirname, name)
  if (!fs.existsSync(p)) return
  try {
    execSync(`node "${p}"`, { stdio: 'inherit', cwd: root })
  } catch (e) {
    console.warn('[postinstall]', name, ':', e.message || e)
  }
}

// Toujours (y compris Vercel/CI) : sans ce patch, "next build" échoue sur ESLint + minimatch ESM
runScript('patch-eslint-minimatch.js')

const skipOpenTelemetry =
  process.env.SKIP_POSTINSTALL === '1' ||
  process.env.CI === 'true' ||
  process.env.VERCEL === '1' ||
  process.env.VERCEL_ENV

if (skipOpenTelemetry) {
  console.log('[postinstall] Skipped fix-opentelemetry (CI/Vercel/skip flag)')
  process.exit(0)
}

try {
  runScript('fix-opentelemetry.js')
} catch (e) {
  console.warn('[postinstall]', e.message || e)
}
process.exitCode = 0
