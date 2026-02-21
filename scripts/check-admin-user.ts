/**
 * Script pour vérifier l'utilisateur admin dans Supabase
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

async function checkAdminUser() {
  console.log('🔍 Vérification de l\'utilisateur admin dans Supabase...\n')
  console.log('='.repeat(60))

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables Supabase manquantes !')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Récupérer tous les utilisateurs admin
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')

    if (adminError) {
      console.error('❌ Erreur lors de la récupération des admins:', adminError.message)
      process.exit(1)
    }

    console.log(`\n📋 Utilisateurs admin trouvés: ${adminUsers?.length || 0}\n`)

    if (!adminUsers || adminUsers.length === 0) {
      console.log('⚠️  Aucun utilisateur admin trouvé dans Supabase !')
      console.log('\n💡 Pour créer un utilisateur admin:')
      console.log('   1. Allez sur Supabase Dashboard → Table Editor → users')
      console.log('   2. Cliquez sur "Insert row"')
      console.log('   3. Remplissez:')
      console.log('      - phone: Votre numéro (ex: 0612345678)')
      console.log('      - password_hash: Hash bcrypt du mot de passe')
      console.log('      - role: admin')
      console.log('   4. Pour générer le hash, utilisez: npm run hash-password <password>')
      process.exit(1)
    }

    // Afficher les admins
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.phone || 'N/A'}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Nom: ${user.first_name || ''} ${user.last_name || ''}`)
      console.log(`   Rôle: ${user.role}`)
      console.log(`   Créé: ${user.created_at || 'N/A'}\n`)
    })

    // Vérifier les numéros de téléphone
    console.log('📱 Numéros de téléphone admin:')
    adminUsers.forEach((user) => {
      const phone = user.phone || 'N/A'
      console.log(`   - ${phone}`)
    })

    console.log('\n✅ Utilisateurs admin trouvés !')
    console.log('\n💡 Pour vous connecter:')
    console.log('   - Utilisez le numéro de téléphone affiché ci-dessus')
    console.log('   - Le mot de passe doit correspondre au hash stocké dans Supabase')

  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

checkAdminUser().catch(console.error)
