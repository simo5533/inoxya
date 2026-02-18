/**
 * Script pour voir les utilisateurs qui se connectent
 * Affiche les données de connexion et les sessions actives
 */

const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Chemin vers la base de données
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')

/**
 * Connexion à la base de données
 */
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

/**
 * Voir tous les utilisateurs
 */
function viewAllUsers(db) {
  return new Promise((resolve, reject) => {
    console.log('\n👥 TOUS LES UTILISATEURS:')
    console.log('=' .repeat(50))
    
    const query = `
      SELECT 
        id,
        phone,
        first_name,
        last_name,
        role,
        created_at,
        last_login
      FROM users 
      ORDER BY created_at DESC
    `
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('❌ Erreur:', err.message)
        reject(err)
      } else {
        if (rows.length === 0) {
          console.log('📭 Aucun utilisateur trouvé')
        } else {
          rows.forEach((user, index) => {
            console.log(`\n${index + 1}. 👤 ${user.first_name} ${user.last_name}`)
            console.log(`   📱 Téléphone: ${user.phone}`)
            console.log(`   🔑 Rôle: ${user.role}`)
            console.log(`   📅 Créé: ${user.created_at}`)
            console.log(`   🕐 Dernière connexion: ${user.last_login || 'Jamais'}`)
          })
        }
        resolve(rows)
      }
    })
  })
}

/**
 * Voir les sessions actives
 */
function viewActiveSessions(db) {
  return new Promise((resolve, reject) => {
    console.log('\n🔐 SESSIONS ACTIVES:')
    console.log('=' .repeat(50))
    
    const query = `
      SELECT 
        us.id,
        us.user_id,
        u.phone,
        u.first_name,
        u.last_name,
        us.session_token,
        us.created_at,
        us.expires_at
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.expires_at > datetime('now')
      ORDER BY us.created_at DESC
    `
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('❌ Erreur:', err.message)
        reject(err)
      } else {
        if (rows.length === 0) {
          console.log('📭 Aucune session active')
        } else {
          rows.forEach((session, index) => {
            console.log(`\n${index + 1}. 🔑 Session ${session.id}`)
            console.log(`   👤 Utilisateur: ${session.first_name} ${session.last_name}`)
            console.log(`   📱 Téléphone: ${session.phone}`)
            console.log(`   🕐 Créée: ${session.created_at}`)
            console.log(`   ⏰ Expire: ${session.expires_at}`)
            console.log(`   🎫 Token: ${session.session_token.substring(0, 20)}...`)
          })
        }
        resolve(rows)
      }
    })
  })
}

/**
 * Voir les tentatives de connexion
 */
function viewLoginAttempts(db) {
  return new Promise((resolve, reject) => {
    console.log('\n📊 TENTATIVES DE CONNEXION:')
    console.log('=' .repeat(50))
    
    const query = `
      SELECT 
        phone,
        success,
        ip_address,
        user_agent,
        created_at
      FROM login_attempts 
      ORDER BY created_at DESC 
      LIMIT 20
    `
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('❌ Erreur:', err.message)
        reject(err)
      } else {
        if (rows.length === 0) {
          console.log('📭 Aucune tentative de connexion enregistrée')
        } else {
          rows.forEach((attempt, index) => {
            const status = attempt.success ? '✅' : '❌'
            console.log(`\n${index + 1}. ${status} ${attempt.phone}`)
            console.log(`   🌐 IP: ${attempt.ip_address || 'Non enregistrée'}`)
            console.log(`   🕐 Date: ${attempt.created_at}`)
            if (attempt.user_agent) {
              console.log(`   💻 Navigateur: ${attempt.user_agent.substring(0, 50)}...`)
            }
          })
        }
        resolve(rows)
      }
    })
  })
}

/**
 * Statistiques de connexion
 */
function viewLoginStats(db) {
  return new Promise((resolve, reject) => {
    console.log('\n📈 STATISTIQUES DE CONNEXION:')
    console.log('=' .repeat(50))
    
    const queries = [
      {
        name: 'Total utilisateurs',
        query: 'SELECT COUNT(*) as count FROM users'
      },
      {
        name: 'Sessions actives',
        query: "SELECT COUNT(*) as count FROM user_sessions WHERE expires_at > datetime('now')"
      },
      {
        name: 'Connexions réussies (24h)',
        query: "SELECT COUNT(*) as count FROM login_attempts WHERE success = 1 AND created_at > datetime('now', '-1 day')"
      },
      {
        name: 'Échecs de connexion (24h)',
        query: "SELECT COUNT(*) as count FROM login_attempts WHERE success = 0 AND created_at > datetime('now', '-1 day')"
      }
    ]
    
    let completed = 0
    const results = {}
    
    queries.forEach(({ name, query }) => {
      db.get(query, [], (err, row) => {
        if (err) {
          console.error(`❌ Erreur ${name}:`, err.message)
        } else {
          results[name] = row.count
          console.log(`📊 ${name}: ${row.count}`)
        }
        
        completed++
        if (completed === queries.length) {
          resolve(results)
        }
      })
    })
  })
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 SCRIPT DE CONSULTATION DES UTILISATEURS INOXYA')
  console.log('=' .repeat(60))
  
  try {
    const db = await connectToDatabase()
    
    // Voir tous les utilisateurs
    await viewAllUsers(db)
    
    // Voir les sessions actives
    await viewActiveSessions(db)
    
    // Voir les tentatives de connexion
    await viewLoginAttempts(db)
    
    // Voir les statistiques
    await viewLoginStats(db)
    
    // Fermer la connexion
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

// Exécuter le script
if (require.main === module) {
  main()
}

module.exports = { 
  viewAllUsers, 
  viewActiveSessions, 
  viewLoginAttempts, 
  viewLoginStats 
}
