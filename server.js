/**
 * Serveur HTTPS personnalisé pour Next.js en développement
 * Utilise des certificats auto-signés pour HTTPS local
 */

const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)
const httpsPort = parseInt(process.env.HTTPS_PORT || '3443', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Chemins des certificats SSL
const certDir = path.join(__dirname, 'certs')
const keyPath = path.join(certDir, 'localhost-key.pem')
const certPath = path.join(certDir, 'localhost.pem')

// Vérifier si les certificats existent
const certsExist = fs.existsSync(keyPath) && fs.existsSync(certPath)

if (!certsExist) {
  console.warn('⚠️  Certificats SSL non trouvés dans ./certs/')
  console.warn('📝 Exécutez: npm run ssl:generate pour générer les certificats')
  console.warn('🔒 Le serveur démarrera en HTTP uniquement')
  console.warn('')
}

app.prepare().then(() => {
  if (certsExist) {
    // Démarrer le serveur HTTPS
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }

    createServer(httpsOptions, async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error('Erreur lors du traitement de la requête:', err)
        res.statusCode = 500
        res.end('Erreur interne du serveur')
      }
    }).listen(httpsPort, (err) => {
      if (err) throw err
      console.log('')
      console.log('🔒 Serveur HTTPS démarré')
      console.log(`   Local:   https://${hostname}:${httpsPort}`)
      console.log(`   Network: https://${hostname}:${httpsPort}`)
      console.log('')
      console.log('⚠️  Certificat auto-signé: votre navigateur affichera un avertissement')
      console.log('   Cliquez sur "Avancé" puis "Continuer vers le site"')
      console.log('')
    })
  } else {
    // Fallback: démarrer en HTTP si pas de certificats
    console.log('')
    console.log('⚠️  Serveur HTTP démarré (certificats SSL non trouvés)')
    console.log(`   Local:   http://${hostname}:${port}`)
    console.log('')
    console.log('💡 Pour activer HTTPS, exécutez: npm run ssl:generate')
    console.log('')
  }
})

