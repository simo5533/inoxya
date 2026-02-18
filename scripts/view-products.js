/**
 * Script pour voir tous les produits de la base de données
 */

const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')

function connectToDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Erreur connexion DB:', err.message)
        reject(err)
      } else {
        console.log('✅ Connexion à la base de données réussie')
        resolve(db)
      }
    })
  })
}

function viewAllProducts(db) {
  return new Promise((resolve, reject) => {
    console.log('\n💍 TOUS LES PRODUITS:')
    console.log('=' .repeat(60))
    
    const query = `
      SELECT 
        b.id,
        b.name,
        b.name_ar,
        b.price,
        b.original_price,
        b.category_id,
        b.image_url,
        b.rating,
        b.reviews_count,
        b.is_available,
        b.created_at,
        c.name as category_name
      FROM bijoux b
      LEFT JOIN categories c ON b.category_id = c.id
      ORDER BY b.created_at DESC
    `
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('❌ Erreur:', err.message)
        reject(err)
      } else {
        if (rows.length === 0) {
          console.log('📭 Aucun produit trouvé')
        } else {
          rows.forEach((product, index) => {
            console.log(`\n${index + 1}. 💍 ${product.name}`)
            if (product.name_ar) {
              console.log(`   🇲🇦 ${product.name_ar}`)
            }
            console.log(`   💰 Prix: ${product.price} MAD`)
            if (product.original_price && product.original_price !== product.price) {
              console.log(`   💸 Prix original: ${product.original_price} MAD`)
            }
            console.log(`   📂 Catégorie: ${product.category_name || 'Non définie'}`)
            console.log(`   ⭐ Note: ${product.rating}/5 (${product.reviews_count} avis)`)
            console.log(`   🖼️ Image: ${product.image_url || 'Aucune'}`)
            console.log(`   📦 Disponible: ${product.is_available ? 'Oui' : 'Non'}`)
            console.log(`   📅 Créé: ${product.created_at}`)
          })
        }
        resolve(rows)
      }
    })
  })
}

function viewProductStats(db) {
  return new Promise((resolve, reject) => {
    console.log('\n📊 STATISTIQUES PRODUITS:')
    console.log('=' .repeat(40))
    
    const queries = [
      {
        name: 'Total produits',
        query: 'SELECT COUNT(*) as count FROM bijoux'
      },
      {
        name: 'Produits disponibles',
        query: "SELECT COUNT(*) as count FROM bijoux WHERE is_available = 1"
      },
      {
        name: 'Produits en promotion',
        query: "SELECT COUNT(*) as count FROM bijoux WHERE original_price > price"
      },
      {
        name: 'Prix moyen',
        query: 'SELECT AVG(price) as avg_price FROM bijoux'
      }
    ]
    
    let completed = 0
    const results = {}
    
    queries.forEach(({ name, query }) => {
      db.get(query, [], (err, row) => {
        if (err) {
          console.error(`❌ Erreur ${name}:`, err.message)
        } else {
          results[name] = row.count || row.avg_price
          if (name === 'Prix moyen') {
            console.log(`📊 ${name}: ${Math.round(row.avg_price)} MAD`)
          } else {
            console.log(`📊 ${name}: ${row.count}`)
          }
        }
        
        completed++
        if (completed === queries.length) {
          resolve(results)
        }
      })
    })
  })
}

async function main() {
  console.log('💍 CONSULTATION DES PRODUITS INOXYA')
  console.log('=' .repeat(50))
  
  try {
    const db = await connectToDatabase()
    
    await viewAllProducts(db)
    await viewProductStats(db)
    
    db.close((err) => {
      if (err) {
        console.error('❌ Erreur fermeture DB:', err.message)
      } else {
        console.log('\n✅ Connexion fermée')
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
  }
}

if (require.main === module) {
  main()
}

module.exports = { viewAllProducts, viewProductStats }
