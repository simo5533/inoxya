#!/usr/bin/env node

/**
 * Script pour tester l'API de login directement
 */

const http = require('http')

const testData = JSON.stringify({
  phone: '0612345678',
  password: 'Admin123!'
})

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
}

console.log('🧪 Test de l\'API de login...\n')
console.log('📋 Données envoyées:')
console.log('   Téléphone:', '0612345678')
console.log('   Mot de passe:', 'Admin123!')
console.log('')

const req = http.request(options, (res) => {
  let data = ''
  
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    console.log('📥 Réponse du serveur:')
    console.log('   Status:', res.statusCode)
    console.log('   Headers:', JSON.stringify(res.headers, null, 2))
    console.log('   Body:', data)
    
    try {
      const response = JSON.parse(data)
      if (response.success) {
        console.log('\n✅ Connexion réussie!')
        console.log('   Utilisateur:', JSON.stringify(response.user, null, 2))
      } else {
        console.log('\n❌ Connexion échouée!')
        console.log('   Erreur:', response.error)
      }
    } catch (e) {
      console.log('\n⚠️  Impossible de parser la réponse JSON')
    }
  })
})

req.on('error', (error) => {
  console.error('❌ Erreur lors de la requête:', error.message)
  console.log('\n💡 Assurez-vous que le serveur est démarré: npm run dev')
})

req.write(testData)
req.end()

