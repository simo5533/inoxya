/**
 * Script pour tester l'API des produits
 */

const http = require('http')

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/products',
  method: 'GET'
}

const req = http.request(options, (res) => {
  let data = ''

  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    try {
      const products = JSON.parse(data)
      console.log('📦 Produits retournés par l\'API:')
      console.log('='.repeat(60))
      
      products.forEach((product, index) => {
        console.log(`\n${index + 1}. Produit ID: ${product.id}`)
        console.log(`   Nom: ${product.name}`)
        console.log(`   Prix: ${product.price} MAD`)
        console.log(`   Image principale: ${product.main_image || 'Aucune'}`)
        console.log(`   Images secondaires: ${product.images ? product.images.length : 0} image(s)`)
        if (product.images && product.images.length > 0) {
          product.images.forEach((img, idx) => {
            console.log(`     - ${idx + 1}: ${img}`)
          })
        }
      })
      
      console.log(`\n✅ Total: ${products.length} produit(s)`)
    } catch (error) {
      console.error('❌ Erreur lors du parsing JSON:', error.message)
      console.log('Réponse brute:', data)
    }
  })
})

req.on('error', (error) => {
  console.error('❌ Erreur de requête:', error.message)
  console.log('\n💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)')
})

req.end()

