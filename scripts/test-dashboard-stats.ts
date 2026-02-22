/**
 * Test des statistiques du dashboard admin
 * Vérifie que getDashboardStats() récupère bien les données depuis Supabase
 */

import * as dotenv from 'dotenv'
import { getDashboardStats } from '../lib/database'

dotenv.config({ path: '.env.local' })

async function testDashboardStats() {
  console.log('🔍 Test des statistiques du dashboard admin...\n')

  try {
    console.log('1️⃣ Appel de getDashboardStats()...')
    const stats = await getDashboardStats()

    console.log('\n📊 Statistiques récupérées:')
    console.log(`   ✅ Total Bijoux: ${stats.totalBijoux}`)
    console.log(`   ✅ Total Packs: ${stats.totalPacks}`)
    console.log(`   ✅ Total Catégories: ${stats.totalCategories}`)
    console.log(`   ✅ Total Utilisateurs: ${stats.totalUsers}`)
    console.log(`   ✅ Total Commandes: ${stats.totalOrders}`)
    console.log(`   ✅ Revenus Totaux: ${stats.totalRevenue} MAD`)

    console.log('\n✅ Test réussi !')
    
    if (stats.totalBijoux === 0 && stats.totalPacks === 0) {
      console.log('\n⚠️  ATTENTION: Les totaux sont à 0')
      console.log('   Vérifiez que:')
      console.log('   1. Les produits sont bien dans Supabase')
      console.log('   2. Les packs sont bien dans Supabase')
      console.log('   3. L\'adapter Supabase est bien utilisé')
    } else {
      console.log('\n🎉 Les statistiques sont correctes !')
    }
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
    process.exit(1)
  }
}

testDashboardStats()

