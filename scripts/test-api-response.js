/**
 * Script pour tester la réponse de l'API produits
 */

const http = require('http')

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/products',
  method: 'GET'
}

console.log('🔍 Test de l\'API /api/products...\n')

const req = http.request(options, (res) => {
  let data = ''
  
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    try {
      const products = JSON.parse(data)
      
      if (products.length === 0) {
        console.log('⚠️  Aucun produit trouvé')
        return
      }
      
      const product = products[0]
      
      console.log('✅ Produit récupéré:\n')
      console.log(`   ID: ${product.id}`)
      console.log(`   Nom: ${product.name}`)
      console.log(`\n🖼️  Structure des images:`)
      console.log(`   main_image: ${product.main_image || 'NON DÉFINI'}`)
      console.log(`   images: ${JSON.stringify(product.images || [])}`)
      
      if (product.main_image && product.images && product.images.length > 0) {
        console.log('\n✅ Structure correcte!')
        console.log(`   - Image principale: ${product.main_image}`)
        console.log(`   - Images de galerie: ${product.images.length}`)
        
        // Vérifier que les chemins sont différents
        const allPaths = [product.main_image, ...product.images].filter(Boolean)
        const uniquePaths = [...new Set(allPaths)]
        
        if (allPaths.length === uniquePaths.length) {
          console.log('   ✅ Tous les chemins sont différents')
        } else {
          console.log('   ⚠️  Certains chemins sont dupliqués')
        }
      } else {
        console.log('\n⚠️  Structure incomplète')
      }
      
    } catch (error) {
      console.error('❌ Erreur parsing JSON:', error.message)
      console.log('Réponse brute:', data.substring(0, 200))
    }
  })
})

req.on('error', (error) => {
  console.error('❌ Erreur requête:', error.message)
  console.log('\n💡 Assurez-vous que le serveur est démarré: npm run dev')
})

req.end()


