#!/usr/bin/env node
/**
 * Patch @eslint/eslintrc to use named import from minimatch (v10 has no default export).
 * Run after npm install so next lint / eslint work with minimatch ^10.2.1.
 */
const path = require('path');
const fs = require('fs');

const target = path.join(
  process.cwd(),
  'node_modules',
  '@eslint',
  'eslintrc',
  'lib',
  'config-array',
  'override-tester.js'
);

try {
  if (!fs.existsSync(target)) {
    process.exit(0);
  }
  let content = fs.readFileSync(target, 'utf8');
  const next = 'import { Minimatch } from "minimatch";';
  // Already patched
  if (content.includes('import { Minimatch } from "minimatch"')) {
    process.exit(0);
  }
  // Match with LF or CRLF
  const oldLF = 'import minimatch from "minimatch";\n\nconst { Minimatch } = minimatch;';
  const oldCRLF = 'import minimatch from "minimatch";\r\n\r\nconst { Minimatch } = minimatch;';
  if (content.includes(oldLF)) {
    content = content.replace(oldLF, next);
    fs.writeFileSync(target, content);
    console.log('[patch-eslint-minimatch] Patched override-tester.js for minimatch v10');
  } else if (content.includes(oldCRLF)) {
    content = content.replace(oldCRLF, next);
    fs.writeFileSync(target, content);
    console.log('[patch-eslint-minimatch] Patched override-tester.js for minimatch v10');
  }
} catch (err) {
  console.warn('[patch-eslint-minimatch] Skip:', err.message);
} finally {
  process.exitCode = 0;
}
