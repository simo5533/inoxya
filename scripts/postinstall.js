#!/usr/bin/env node
/**
 * Wrapper postinstall: skip en CI/Vercel, sinon run fix-opentelemetry puis patch ESLint/minimatch.
 * Ne fait jamais échouer le build (exit 0 toujours).
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const skip =
  process.env.SKIP_POSTINSTALL === '1' ||
  process.env.CI === 'true' ||
  process.env.VERCEL === '1' ||
  process.env.VERCEL_ENV;

if (skip) {
  console.log('[postinstall] Skipped (CI/Vercel/build environment)');
  process.exitCode = 0;
  process.exit(0);
}

const root = path.join(__dirname, '..');
const run = (script) => {
  const p = path.join(__dirname, script);
  if (!fs.existsSync(p)) return;
  try {
    execSync(`node "${p}"`, { stdio: 'inherit', cwd: root });
  } catch (e) {
    console.warn('[postinstall]', script, ':', e.message || e);
  }
};

try {
  run('fix-opentelemetry.js');
  run('patch-eslint-minimatch.js');
} catch (e) {
  console.warn('[postinstall]', e.message || e);
}
process.exitCode = 0;
