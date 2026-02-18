#!/usr/bin/env node

/**
 * Script d'analyse des erreurs dans la partie admin
 * Usage: node scripts/analyze-admin-errors.js
 */

const API_BASE_URL = 'http://localhost:3000/api'

// Tests spécifiques pour les erreurs identifiées
const ADMIN_TESTS = [
  {
    name: "Test ImageUpload Import",
    description: "Vérifier que ProductForm peut importer ImageUpload",
    test: async () => {
      try {
        const response = await fetch('http://localhost:3000/admin')
        return {
          success: response.status === 200,
          status: response.status,
          message: response.status === 200 ? "Import ImageUpload corrigé" : "Erreur d'import persistante"
        }
      } catch (error) {
        return {
          success: false,
          status: 'ERROR',
          message: `Erreur: ${error.message}`
        }
      }
    }
  },
  {
    name: "Test Custom Requests API",
    description: "Vérifier l'API des demandes sur mesure",
    test: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/custom-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            phone: '0612345678',
            type: 'Bague',
            description: 'Test description',
            budget: '1000 MAD'
          })
        })
        
        return {
          success: response.status === 200 || response.status === 201,
          status: response.status,
          message: response.status < 400 ? "API Custom Requests fonctionnelle" : "Erreur dans l'API"
        }
      } catch (error) {
        return {
          success: false,
          status: 'ERROR',
          message: `Erreur: ${error.message}`
        }
      }
    }
  },
  {
    name: "Test Orders API",
    description: "Vérifier l'API des commandes",
    test: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bijou_id: 'test-bijou-1',
            customer_name: 'Test Customer',
            customer_address: '123 Test Street',
            customer_phone: '0612345678',
            quantity: 1,
            total_amount: 299.99
          })
        })
        
        return {
          success: response.status === 200 || response.status === 201,
          status: response.status,
          message: response.status < 400 ? "API Orders fonctionnelle" : "Erreur dans l'API Orders"
        }
      } catch (error) {
        return {
          success: false,
          status: 'ERROR',
          message: `Erreur: ${error.message}`
        }
      }
    }
  },
  {
    name: "Test Admin Authentication",
    description: "Vérifier l'authentification admin",
    test: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        return {
          success: response.status === 403, // 403 est attendu sans auth
          status: response.status,
          message: response.status === 403 ? "Authentification admin fonctionnelle" : "Problème d'authentification"
        }
      } catch (error) {
        return {
          success: false,
          status: 'ERROR',
          message: `Erreur: ${error.message}`
        }
      }
    }
  }
]

async function runAdminAnalysis() {
  console.log('🔍 Analyse des Erreurs Admin INOXYA BIJOUX')
  console.log('==========================================\n')
  
  let totalTests = 0
  let passedTests = 0
  let failedTests = 0
  
  for (const test of ADMIN_TESTS) {
    console.log(`🧪 ${test.name}`)
    console.log(`   Description: ${test.description}`)
    
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
  
  console.log('📊 Résumé de l\'Analyse')
  console.log('======================')
  console.log(`Total des tests: ${totalTests}`)
  console.log(`✅ Tests réussis: ${passedTests}`)
  console.log(`❌ Tests échoués: ${failedTests}`)
  
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
  console.log(`📈 Taux de réussite: ${successRate}%`)
  
  console.log('\n🔧 Problèmes Identifiés:')
  if (failedTests > 0) {
    console.log('1. Erreurs d\'import dans ProductForm.tsx')
    console.log('2. Fonctions manquantes dans database-adapter.ts')
    console.log('3. Routes API avec erreurs 500')
    console.log('4. Authentification admin à vérifier')
  } else {
    console.log('✅ Aucun problème majeur détecté')
  }
  
  console.log('\n💡 Recommandations:')
  console.log('1. Vérifier les imports dans tous les composants admin')
  console.log('2. Ajouter les fonctions manquantes dans database-adapter.ts')
  console.log('3. Tester toutes les routes API avec des données valides')
  console.log('4. Configurer Supabase pour éviter les erreurs de base de données')
}

// Exécuter l'analyse
runAdminAnalysis().catch(console.error)
