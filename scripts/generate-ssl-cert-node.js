/**
 * Script pour générer des certificats SSL auto-signés en utilisant Node.js uniquement
 * Alternative à OpenSSL pour Windows
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const certDir = path.join(process.cwd(), 'certs')
const keyPath = path.join(certDir, 'localhost-key.pem')
const certPath = path.join(certDir, 'localhost.pem')

console.log('🔐 Génération de certificats SSL pour HTTPS local (Node.js)...\n')

// Créer le dossier certs s'il n'existe pas
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true })
  console.log('✅ Dossier certs/ créé')
}

// Vérifier si les certificats existent déjà
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ Certificats SSL existent déjà')
  console.log(`   - ${keyPath}`)
  console.log(`   - ${certPath}`)
  console.log('\n💡 Pour régénérer, supprimez les fichiers existants dans ./certs/')
  process.exit(0)
}

// Essayer d'utiliser OpenSSL d'abord
try {
  console.log('📝 Tentative de génération avec OpenSSL...')
  
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

  // Générer la clé privée
  execSync(
    `openssl genrsa -out "${keyPath}" 2048`,
    { stdio: 'inherit' }
  )

  // Générer le certificat
  execSync(
    `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -config "${configPath}"`,
    { stdio: 'inherit' }
  )

  // Supprimer le fichier de configuration temporaire
  fs.unlinkSync(configPath)

  console.log('✅ Certificats SSL générés avec succès avec OpenSSL!')
  console.log(`\n📁 Fichiers créés:`)
  console.log(`   - ${keyPath}`)
  console.log(`   - ${certPath}`)
  console.log('\n🚀 Vous pouvez maintenant démarrer le serveur HTTPS:')
  console.log('   npm run dev:https')
  process.exit(0)
} catch (error) {
  console.log('⚠️  OpenSSL non disponible, utilisation d\'une méthode alternative...\n')
  
  // Méthode alternative: créer des certificats basiques avec Node.js
  // Note: Ces certificats seront très basiques mais fonctionneront pour le développement
  console.log('📝 Génération de certificats basiques...')
  
  // Pour Windows, on peut utiliser PowerShell pour générer un certificat auto-signé
  try {
    const psScript = `
$cert = New-SelfSignedCertificate -DnsName "localhost", "*.localhost", "127.0.0.1" -CertStoreLocation "cert:\\CurrentUser\\My" -NotAfter (Get-Date).AddYears(1) -KeyUsage DigitalSignature, KeyEncipherment -KeyAlgorithm RSA -KeyLength 2048
$pwd = ConvertTo-SecureString -String "temp" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "${path.join(certDir, 'localhost.pfx')}" -Password $pwd | Out-Null
$cert | Export-Certificate -FilePath "${certPath}" -Type CERT | Out-Null
$key = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
$keyBytes = $key.Export([System.Security.Cryptography.CngKeyBlobFormat]::Pkcs8PrivateBlob)
[System.IO.File]::WriteAllBytes("${keyPath}", $keyBytes)
Remove-Item "cert:\\CurrentUser\\My\\$($cert.Thumbprint)" -Force
Write-Host "Certificats generes"
`
    
    execSync(`powershell -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, '; ')}"`, { stdio: 'inherit' })
    
    console.log('✅ Certificats SSL générés avec succès avec PowerShell!')
    console.log(`\n📁 Fichiers créés:`)
    console.log(`   - ${keyPath}`)
    console.log(`   - ${certPath}`)
    console.log('\n🚀 Vous pouvez maintenant démarrer le serveur HTTPS:')
    console.log('   npm run dev:https')
    process.exit(0)
  } catch (psError) {
    console.error('❌ Erreur lors de la génération avec PowerShell:', psError.message)
    console.error('\n💡 Solutions alternatives:')
    console.error('   1. Installer OpenSSL: https://slproweb.com/products/Win32OpenSSL.html')
    console.error('   2. Utiliser mkcert: https://github.com/FiloSottile/mkcert')
    console.error('   3. Utiliser un certificat existant')
    process.exit(1)
  }
}

