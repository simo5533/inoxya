/**
 * Script pour voir toutes les commandes de la base de données
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

function viewAllOrders(db) {
  return new Promise((resolve, reject) => {
    console.log('\n📦 TOUTES LES COMMANDES:')
    console.log('=' .repeat(60))
    
    const query = `
      SELECT 
        o.id,
        o.user_id,
        u.phone,
        u.first_name,
        u.last_name,
        o.total_amount,
        o.status,
        o.shipping_address,
        o.phone as order_phone,
        o.notes,
        o.created_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('❌ Erreur:', err.message)
        reject(err)
      } else {
        if (rows.length === 0) {
          console.log('📭 Aucune commande trouvée')
        } else {
          rows.forEach((order, index) => {
            console.log(`\n${index + 1}. 📦 Commande ${order.id}`)
            console.log(`   👤 Client: ${order.first_name || ''} ${order.last_name || ''}`)
            console.log(`   📱 Téléphone: ${order.phone || order.order_phone}`)
            console.log(`   💰 Montant: ${order.total_amount} MAD`)
            console.log(`   📊 Statut: ${order.status}`)
            console.log(`   📅 Date: ${order.created_at}`)
            if (order.shipping_address) {
              try {
                const address = JSON.parse(order.shipping_address)
                console.log(`   🏠 Adresse: ${address.address || 'Non renseignée'}`)
              } catch (e) {
                console.log(`   🏠 Adresse: ${order.shipping_address}`)
              }
            }
            if (order.notes) {
              console.log(`   📝 Notes: ${order.notes}`)
            }
          })
        }
        resolve(rows)
      }
    })
  })
}

function viewOrderDetails(db, orderId) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 DÉTAILS COMMANDE ${orderId}:`)
    console.log('=' .repeat(50))
    
    const query = `
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.shipping_address,
        o.notes,
        o.created_at,
        oi.bijou_id,
        b.name as bijou_name,
        b.price as bijou_price,
        oi.quantity,
        oi.price as item_price
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN bijoux b ON oi.bijou_id = b.id
      WHERE o.id = ?
    `
    
    db.all(query, [orderId], (err, rows) => {
      if (err) {
        console.error('❌ Erreur:', err.message)
        reject(err)
      } else {
        if (rows.length === 0) {
          console.log('📭 Commande non trouvée')
        } else {
          const order = rows[0]
          console.log(`📦 Commande: ${order.id}`)
          console.log(`💰 Total: ${order.total_amount} MAD`)
          console.log(`📊 Statut: ${order.status}`)
          console.log(`📅 Date: ${order.created_at}`)
          
          if (order.shipping_address) {
            try {
              const address = JSON.parse(order.shipping_address)
              console.log(`🏠 Adresse: ${address.address || 'Non renseignée'}`)
            } catch (e) {
              console.log(`🏠 Adresse: ${order.shipping_address}`)
            }
          }
          
          console.log('\n📋 Articles:')
          rows.forEach((item, index) => {
            if (item.bijou_id) {
              console.log(`   ${index + 1}. ${item.bijou_name}`)
              console.log(`      💰 Prix unitaire: ${item.bijou_price} MAD`)
              console.log(`      📦 Quantité: ${item.quantity}`)
              console.log(`      💵 Sous-total: ${item.item_price} MAD`)
            }
          })
        }
        resolve(rows)
      }
    })
  })
}

function viewOrderStats(db) {
  return new Promise((resolve, reject) => {
    console.log('\n📊 STATISTIQUES COMMANDES:')
    console.log('=' .repeat(40))
    
    const queries = [
      {
        name: 'Total commandes',
        query: 'SELECT COUNT(*) as count FROM orders'
      },
      {
        name: 'Commandes en attente',
        query: "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"
      },
      {
        name: 'Commandes expédiées',
        query: "SELECT COUNT(*) as count FROM orders WHERE status = 'shipped'"
      },
      {
        name: 'Commandes livrées',
        query: "SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'"
      },
      {
        name: 'Chiffre d\'affaires total',
        query: 'SELECT SUM(total_amount) as total FROM orders'
      },
      {
        name: 'Chiffre d\'affaires (30 derniers jours)',
        query: "SELECT SUM(total_amount) as total FROM orders WHERE created_at >= datetime('now', '-30 days')"
      }
    ]
    
    let completed = 0
    const results = {}
    
    queries.forEach(({ name, query }) => {
      db.get(query, [], (err, row) => {
        if (err) {
          console.error(`❌ Erreur ${name}:`, err.message)
        } else {
          results[name] = row.count || row.total
          if (name.includes('Chiffre')) {
            console.log(`📊 ${name}: ${Math.round(row.total || 0)} MAD`)
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

function viewRecentOrders(db) {
  return new Promise((resolve, reject) => {
    console.log('\n🕐 COMMANDES RÉCENTES (7 derniers jours):')
    console.log('=' .repeat(50))
    
    const query = `
      SELECT 
        o.id,
        u.first_name,
        u.last_name,
        o.total_amount,
        o.status,
        o.created_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.created_at >= datetime('now', '-7 days')
      ORDER BY o.created_at DESC
      LIMIT 10
    `
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('❌ Erreur:', err.message)
        reject(err)
      } else {
        if (rows.length === 0) {
          console.log('📭 Aucune commande récente')
        } else {
          rows.forEach((order, index) => {
            console.log(`${index + 1}. ${order.id} - ${order.first_name} ${order.last_name} - ${order.total_amount} MAD - ${order.status}`)
          })
        }
        resolve(rows)
      }
    })
  })
}

async function main() {
  console.log('📦 CONSULTATION DES COMMANDES INOXYA')
  console.log('=' .repeat(50))
  
  try {
    const db = await connectToDatabase()
    
    await viewAllOrders(db)
    await viewOrderStats(db)
    await viewRecentOrders(db)
    
    // Si un ID de commande est fourni en argument
    const orderId = process.argv[2]
    if (orderId) {
      await viewOrderDetails(db, orderId)
    }
    
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

module.exports = { viewAllOrders, viewOrderDetails, viewOrderStats, viewRecentOrders }
