/**
 * Script pour générer des certificats SSL auto-signés pour le développement local
 * Nécessite OpenSSL installé sur le système
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const certDir = path.join(process.cwd(), 'certs')
const keyPath = path.join(certDir, 'localhost-key.pem')
const certPath = path.join(certDir, 'localhost.pem')

console.log('🔐 Génération de certificats SSL pour HTTPS local...\n')

// Créer le dossier certs s'il n'existe pas
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true })
  console.log('✅ Dossier certs/ créé')
}

// Vérifier si OpenSSL est installé
try {
  execSync('openssl version', { stdio: 'ignore' })
} catch (error) {
  console.error('❌ OpenSSL n\'est pas installé sur votre système')
  console.error('')
  console.error('📥 Installation:')
  console.error('   Windows: Téléchargez depuis https://slproweb.com/products/Win32OpenSSL.html')
  console.error('   macOS: brew install openssl')
  console.error('   Linux: sudo apt-get install openssl')
  console.error('')
  process.exit(1)
}

// Générer la clé privée
if (!fs.existsSync(keyPath)) {
  console.log('📝 Génération de la clé privée...')
  try {
    execSync(
      `openssl genrsa -out "${keyPath}" 2048`,
      { stdio: 'inherit' }
    )
    console.log('✅ Clé privée générée')
  } catch (error) {
    console.error('❌ Erreur lors de la génération de la clé privée')
    process.exit(1)
  }
} else {
  console.log('✅ Clé privée existe déjà')
}

// Générer le certificat auto-signé
if (!fs.existsSync(certPath)) {
  console.log('📝 Génération du certificat auto-signé...')
  try {
    // Créer un fichier de configuration OpenSSL temporaire
    const configPath = path.join(certDir, 'openssl.conf')
    const configContent = `[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C=FR
ST=France
L=Paris
O=INOXYA BIJOUX
OU=Development
CN=localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
`

    fs.writeFileSync(configPath, configContent)

    execSync(
      `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -config "${configPath}"`,
      { stdio: 'inherit' }
    )

    // Supprimer le fichier de configuration temporaire
    fs.unlinkSync(configPath)

    console.log('✅ Certificat auto-signé généré')
  } catch (error) {
    console.error('❌ Erreur lors de la génération du certificat')
    process.exit(1)
  }
} else {
  console.log('✅ Certificat existe déjà')
}

console.log('')
console.log('🎉 Certificats SSL générés avec succès!')
console.log('')
console.log('📁 Fichiers créés:')
console.log(`   - ${keyPath}`)
console.log(`   - ${certPath}`)
console.log('')
console.log('🚀 Vous pouvez maintenant démarrer le serveur HTTPS:')
console.log('   npm run dev:https')
console.log('')
console.log('⚠️  Note: Les certificats auto-signés génèrent un avertissement dans le navigateur')
console.log('   C\'est normal pour le développement local. Cliquez sur "Avancé" puis "Continuer"')
console.log('')

