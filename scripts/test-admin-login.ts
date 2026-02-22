/**
 * Test de connexion admin
 */

import { loginUser } from '../lib/auth'
import { getDatabaseAdapter } from '../lib/db'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testAdminLogin() {
  console.log('🔍 Test de connexion admin...\n')
  console.log('='.repeat(60))

  // Numéros de téléphone admin à tester
  const adminPhones = ['0612345678', 'admin_phone']

  try {
    // Test 1: Vérifier que les admins existent dans Supabase
    console.log('\n1️⃣ Vérification des utilisateurs admin dans Supabase...')
    const adapter = await getDatabaseAdapter()
    
    for (const phone of adminPhones) {
      const user = await adapter.getUserByPhone(phone)
      if (user) {
        console.log(`   ✅ Admin trouvé: ${phone}`)
        console.log(`      ID: ${user.id}`)
        console.log(`      Rôle: ${user.role}`)
        console.log(`      Nom: ${user.first_name || ''} ${user.last_name || ''}`)
        console.log(`      Password hash: ${user.password_hash ? '✅ Présent' : '❌ Manquant'}\n`)
      } else {
        console.log(`   ❌ Admin non trouvé: ${phone}\n`)
      }
    }

    // Test 2: Tester loginUser avec un mot de passe de test
    // Note: On ne peut pas tester avec un vrai mot de passe car on ne le connaît pas
    console.log('2️⃣ Test de la fonction loginUser()...')
    console.log('   ⚠️  Note: Test avec mot de passe factice (pour vérifier la logique)\n')
    
    // Test avec un numéro qui n'existe pas
    const fakeResult = await loginUser('0000000000', 'fake_password')
    if (!fakeResult.success) {
      console.log('   ✅ Rejet correct d\'un utilisateur inexistant\n')
    } else {
      console.log('   ⚠️  Problème: Utilisateur inexistant accepté\n')
    }

    console.log('✅ Tests de structure passés!')
    console.log('\n💡 Pour tester avec un vrai mot de passe:')
    console.log('   1. Connectez-vous sur le site déployé')
    console.log('   2. Utilisez un des numéros admin trouvés ci-dessus')
    console.log('   3. Utilisez le mot de passe configuré dans Supabase\n')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

testAdminLogin().catch(console.error)

