/**
 * Crée le fichier .nft.json manquant pour app/_not-found si le dossier existe.
 * Corrige l'ENOENT sur .next/server/app/_not-found/page.js.nft.json (Next.js trace).
 * À appeler après un build qui a pu échouer à cause de cette erreur.
 */
const path = require('path')
const fs = require('fs')

const projectRoot = process.cwd()
const nftPath = path.join(projectRoot, '.next', 'server', 'app', '_not-found', 'page.js.nft.json')

const dir = path.dirname(nftPath)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}
if (!fs.existsSync(nftPath)) {
  fs.writeFileSync(nftPath, '[]', 'utf8')
  console.log('Created missing page.js.nft.json for _not-found')
}
