#!/usr/bin/env node
/**
 * Supprime .next et caches Next liés (évite MODULE_NOT_FOUND vendor-chunks / webpack .call undefined).
 * Sous Windows : arrêter npm run dev avant, sinon certains fichiers peuvent rester verrouillés.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const targets = [
  path.join(root, '.next'),
  path.join(root, 'node_modules', '.cache'),
]

let ok = true
for (const dir of targets) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true })
      console.log('Supprimé:', path.relative(root, dir))
    }
  } catch (e) {
    ok = false
    console.error('Échec:', dir, e instanceof Error ? e.message : e)
    console.error('→ Arrêtez le serveur dev (Ctrl+C), fermez les éditeurs qui verrouillent .next, réessayez.')
  }
}

if (ok) {
  console.log('OK — relancez: npm run dev')
}

process.exit(ok ? 0 : 1)
