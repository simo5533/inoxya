/**
 * Script de diagnostic pour vérifier l'utilisateur admin dans la DB
 * Usage: npx tsx scripts/check-admin-user.ts [phone]
 */

import { forceConnection, initSqlJsAsync } from '../lib/sqlite'

async function checkAdminUser(phone?: string) {
  console.log('🔍 Vérification de l\'utilisateur admin...\n')

  // Forcer la connexion
  let connected = forceConnection()
  if (!connected) {
    console.log('⚠️ better-sqlite3 non disponible, tentative avec sql.js...')
    connected = await initSqlJsAsync()
  }

  if (!connected) {
    console.error('❌ Impossible de se connecter à la base de données')
    return
  }

  const { selectRows } = await import('../lib/sqlite')
  
  try {
    // Récupérer tous les utilisateurs
    const allUsers = selectRows('SELECT id, phone, role, first_name, last_name FROM users ORDER BY id', [])
    
    console.log(`📊 Total utilisateurs dans la DB: ${allUsers.length}\n`)
    
    if (allUsers.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé dans la base de données!')
      console.log('💡 Vous devez créer un utilisateur admin d\'abord.')
      return
    }

    console.log('👥 Liste de tous les utilisateurs:')
    console.log('─'.repeat(80))
    allUsers.forEach((user: any) => {
      const isAdmin = user.role === 'admin'
      const marker = isAdmin ? '👑' : '👤'
      console.log(`${marker} ID: ${user.id} | Téléphone: ${user.phone} | Rôle: ${user.role} | Nom: ${user.first_name || ''} ${user.last_name || ''}`)
    })
    console.log('─'.repeat(80))
    console.log()

    // Vérifier les admins
    const admins = allUsers.filter((u: any) => u.role === 'admin')
    console.log(`👑 Utilisateurs admin: ${admins.length}`)
    if (admins.length > 0) {
      admins.forEach((admin: any) => {
        console.log(`   - ${admin.phone} (ID: ${admin.id})`)
      })
    } else {
      console.log('   ⚠️ Aucun utilisateur admin trouvé!')
    }
    console.log()

    // Si un téléphone est fourni, chercher cet utilisateur spécifique
    if (phone) {
      const normalizedPhone = phone.replace(/[\s\-\.]/g, '').trim()
      console.log(`🔍 Recherche de l'utilisateur avec le téléphone: ${normalizedPhone}`)
      
      // Essayer plusieurs formats
      const formats = [
        normalizedPhone,
        normalizedPhone.startsWith('0') ? '+212' + normalizedPhone.substring(1) : null,
        normalizedPhone.startsWith('+212') ? '0' + normalizedPhone.substring(4) : null,
      ].filter(Boolean) as string[]

      console.log(`   Formats à tester: ${formats.join(', ')}`)
      
      for (const format of formats) {
        const users = selectRows('SELECT id, phone, role, first_name, last_name FROM users WHERE phone = ?', [format])
        if (users && users.length > 0) {
          const foundUser = users[0] as any
          console.log(`   ✅ Trouvé avec le format: ${format}`)
          console.log(`      ID: ${foundUser.id}`)
          console.log(`      Téléphone en DB: ${foundUser.phone}`)
          console.log(`      Rôle: ${foundUser.role}`)
          console.log(`      Nom: ${foundUser.first_name || ''} ${foundUser.last_name || ''}`)
          console.log(`      ${foundUser.role === 'admin' ? '✅ C\'est un admin!' : '❌ Ce n\'est PAS un admin'}`)
          return
        }
      }
      
      console.log(`   ❌ Aucun utilisateur trouvé avec ce téléphone (formats testés: ${formats.join(', ')})`)
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

// Récupérer le téléphone depuis les arguments
const phone = process.argv[2]

checkAdminUser(phone)
  .then(() => {
    console.log('\n✅ Diagnostic terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

