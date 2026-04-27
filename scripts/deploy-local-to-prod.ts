/**
 * Enchaîne la migration SQLite → Supabase puis l’envoi des fichiers locaux vers Vercel Blob
 * (mise à jour des URL image_url / images dans Supabase).
 *
 * À lancer sur ton PC (là où sont `data/*.db` et `public/`).
 *
 * Prérequis .env.local :
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   BLOB_READ_WRITE_TOKEN (sauf --dry-run ou --only-migrate)
 *   NEXT_PUBLIC_SITE_URL = URL prod (ex. https://xxx.vercel.app) si store Blob private
 *   BLOB_STORE_ACCESS = public | private
 *
 * Usage:
 *   npx tsx scripts/deploy-local-to-prod.ts
 *   npx tsx scripts/deploy-local-to-prod.ts --only-migrate
 *   npx tsx scripts/deploy-local-to-prod.ts --only-images
 *   npx tsx scripts/deploy-local-to-prod.ts --dry-run-images
 */
import { execSync } from 'child_process'

const argv = process.argv.slice(2)
const onlyMigrate = argv.includes('--only-migrate')
const onlyImages = argv.includes('--only-images')
const dryImages = argv.includes('--dry-run-images')

if (onlyMigrate && onlyImages) {
  console.error('❌ Choisir soit --only-migrate, soit --only-images, pas les deux.')
  process.exit(1)
}

const root = process.cwd()
const isWin = process.platform === 'win32'
const runNpm = (script: string) => {
  const cmd = isWin ? `cmd.exe /c npm run ${script}` : `npm run ${script}`
  execSync(cmd, { stdio: 'inherit', cwd: root, env: process.env })
}

async function main() {
  console.log(
    '\n⚠️  Les variables Supabase ci-dessous (.env.local) doivent pointer vers le MÊME projet que sur Vercel\n' +
      '   (Dashboard Vercel → Settings → Environment Variables → NEXT_PUBLIC_SUPABASE_URL).\n' +
      '   Sinon la base « prod » restera vide alors que ta copie locale est pleine.\n'
  )
  if (!onlyImages) {
    console.log('\n════════ Étape 1/2 : migration SQLite → Supabase (npm run db:migrate) ════════\n')
    runNpm('db:migrate')
  }

  if (!onlyMigrate) {
    const label = dryImages
      ? '\n════════ Étape 2/2 : simulation upload images (dry-run) ════════\n'
      : '\n════════ Étape 2/2 : images → Vercel Blob + URL Supabase ════════\n'
    console.log(label)
    runNpm(dryImages ? 'db:sync:local-images:dry' : 'db:sync:local-images')
  }

  console.log('\n✅ deploy-local-to-prod terminé.\n')
  console.log('Vérifie sur Vercel : NEXT_PUBLIC_SUPABASE_*, BLOB_*, NEXT_PUBLIC_SITE_URL, puis teste le site en prod.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
