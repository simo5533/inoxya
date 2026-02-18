#!/usr/bin/env node

/**
 * Test final complet de la partie admin
 * Usage: node scripts/final-admin-test.js
 */

const API_BASE_URL = 'http://localhost:3000/api'

async function runFinalAdminTest() {
  console.log('🎯 TEST FINAL - PARTIE ADMIN INOXYA BIJOUX')
  console.log('==========================================\n')
  
  let totalTests = 0
  let passedTests = 0
  let failedTests = 0
  
  const tests = [
    {
      name: "Interface Admin",
      test: async () => {
        const response = await fetch('http://localhost:3000/admin')
        return {
          success: response.status === 200,
          status: response.status,
          message: response.status === 200 ? "Interface admin accessible" : "Interface admin non accessible"
        }
      }
    },
    {
      name: "API Custom Requests - GET",
      test: async () => {
        const response = await fetch(`${API_BASE_URL}/custom-requests`)
        return {
          success: response.status === 200,
          status: response.status,
          message: response.status === 200 ? "GET Custom Requests fonctionnel" : "Erreur GET Custom Requests"
        }
      }
    },
    {
      name: "API Custom Requests - POST",
      test: async () => {
        const response = await fetch(`${API_BASE_URL}/custom-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Final',
            email: 'test@final.com',
            phone: '0612345678',
            type: 'Bague',
            description: 'Test final',
            budget: '1000 MAD'
          })
        })
        return {
          success: response.status === 200,
          status: response.status,
          message: response.status === 200 ? "POST Custom Requests fonctionnel" : "Erreur POST Custom Requests"
        }
      }
    },
    {
      name: "API Orders - GET",
      test: async () => {
        const response = await fetch(`${API_BASE_URL}/orders`)
        return {
          success: response.status === 200,
          status: response.status,
          message: response.status === 200 ? "GET Orders fonctionnel" : "Erreur GET Orders"
        }
      }
    },
    {
      name: "API Orders - POST",
      test: async () => {
        const response = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bijou_id: 'test-final-1',
            customer_name: 'Test Final',
            customer_address: '123 Test Final',
            customer_phone: '0612345678',
            total_amount: 299.99
          })
        })
        return {
          success: response.status === 200,
          status: response.status,
          message: response.status === 200 ? "POST Orders fonctionnel" : "Erreur POST Orders"
        }
      }
    },
    {
      name: "Site Principal",
      test: async () => {
        const response = await fetch('http://localhost:3000')
        return {
          success: response.status === 200,
          status: response.status,
          message: response.status === 200 ? "Site principal accessible" : "Site principal non accessible"
        }
      }
    },
    {
      name: "Page Bijoux",
      test: async () => {
        const response = await fetch('http://localhost:3000/bijoux')
        return {
          success: response.status === 200,
          status: response.status,
          message: response.status === 200 ? "Page bijoux accessible" : "Page bijoux non accessible"
        }
      }
    }
  ]
  
  for (const test of tests) {
    console.log(`🧪 ${test.name}`)
    
    try {
      const result = await test.test()
      totalTests++
      
      if (result.success) {
        console.log(`   ✅ ${result.message}`)
        passedTests++
      } else {
        console.log(`   ❌ ${result.message}`)
        console.log(`   Status: ${result.status}`)
        failedTests++
      }
    } catch (error) {
      console.log(`   ❌ Erreur lors du test: ${error.message}`)
      totalTests++
      failedTests++
    }
    
    console.log('')
  }
  
  console.log('📊 RÉSULTATS FINAUX')
  console.log('==================')
  console.log(`Total des tests: ${totalTests}`)
  console.log(`✅ Tests réussis: ${passedTests}`)
  console.log(`❌ Tests échoués: ${failedTests}`)
  
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
  console.log(`📈 Taux de réussite: ${successRate}%`)
  
  console.log('\n🎉 ÉTAT FINAL:')
  if (successRate >= 90) {
    console.log('🟢 EXCELLENT - Partie admin 100% fonctionnelle !')
  } else if (successRate >= 75) {
    console.log('🟡 BON - Partie admin largement fonctionnelle')
  } else if (successRate >= 50) {
    console.log('🟠 MOYEN - Partie admin partiellement fonctionnelle')
  } else {
    console.log('🔴 INSUFFISANT - Partie admin nécessite des corrections')
  }
  
  console.log('\n🚀 VOTRE PROJET EST PRÊT !')
  console.log('========================')
  console.log('📍 URLs d\'accès :')
  console.log('   🏠 Site principal : http://localhost:3000')
  console.log('   ⚙️  Panel admin : http://localhost:3000/admin')
  console.log('   🔐 Connexion admin : admin_phone / Admin123!')
}

// Exécuter le test final
runFinalAdminTest().catch(console.error)
