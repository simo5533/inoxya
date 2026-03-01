#!/usr/bin/env node
/**
 * Patch ESLint-related code to use named imports from minimatch (v10+ ESM has no default export).
 * Ensures next lint / eslint work with minimatch >=10.2.3 (secure).
 * Idempotent, tolerant (missing file => exit 0), never throws.
 */
const path = require('path');
const fs = require('fs');

const targets = [
  {
    file: path.join(process.cwd(), 'node_modules', '@eslint', 'eslintrc', 'lib', 'config-array', 'override-tester.js'),
    replacements: [
      { from: 'import minimatch from "minimatch";\n\nconst { Minimatch } = minimatch;', to: 'import { Minimatch } from "minimatch";' },
      { from: 'import minimatch from "minimatch";\r\n\r\nconst { Minimatch } = minimatch;', to: 'import { Minimatch } from "minimatch";' },
    ],
    done: (c) => c.includes('import { Minimatch } from "minimatch"'),
  },
  {
    file: path.join(process.cwd(), 'node_modules', '@eslint', 'config-array', 'dist', 'esm', 'index.js'),
    replacements: [
      { from: "import minimatch from 'minimatch';", to: "import { minimatch, Minimatch } from 'minimatch';" },
      { from: 'const Minimatch = minimatch.Minimatch;', to: '// Minimatch from named import above' },
    ],
    done: (c) => c.includes("import { minimatch, Minimatch } from 'minimatch'"),
  },
];

let anyPatched = false;
for (const { file, replacements, done } of targets) {
  try {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    if (done(content)) continue;
    let changed = false;
    for (const { from, to } of replacements) {
      if (content.includes(from)) {
        content = content.replace(from, to);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(file, content);
      anyPatched = true;
    }
  } catch (err) {
    console.warn('[patch-eslint-minimatch] Skip', path.relative(process.cwd(), file), err.message);
  }
}
if (anyPatched) console.log('[patch-eslint-minimatch] Patched for minimatch ESM (no default export)');
process.exitCode = 0;
