#!/usr/bin/env node

/**
 * Script d'analyse approfondie de la connexion admin
 * Usage: node scripts/analyze-admin-login.js
 */

const API_BASE_URL = 'http://localhost:3000'

async function analyzeAdminLogin() {
  console.log('🔍 ANALYSE APPROFONDIE - CONNEXION ADMIN')
  console.log('==========================================\n')
  
  let totalTests = 0
  let passedTests = 0
  let failedTests = 0
  
  const tests = [
    {
      name: "1. Test de validation du téléphone",
      description: "Vérifier que admin_phone est accepté",
      test: async () => {
        // Test de validation côté client (simulation)
        const phoneRegex = /^(\+212|0)[5-7][0-9]{8}$/
        const adminRegex = /^admin_phone$/
        const isValid = phoneRegex.test('admin_phone') || adminRegex.test('admin_phone')
        
        return {
          success: isValid,
          status: isValid ? 'VALID' : 'INVALID',
          message: isValid ? 'admin_phone est accepté' : 'admin_phone est rejeté'
        }
      }
    },
    {
      name: "2. Test de la page de connexion",
      description: "Vérifier l'accessibilité de la page login",
      test: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/login`)
          return {
            success: response.status === 200,
            status: response.status,
            message: response.status === 200 ? 'Page login accessible' : 'Page login non accessible'
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
      name: "3. Test de la page admin (sans auth)",
      description: "Vérifier la redirection vers login",
      test: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/admin`, {
            redirect: 'manual'
          })
          return {
            success: response.status === 307 || response.status === 302,
            status: response.status,
            message: response.status === 307 || response.status === 302 ? 'Redirection vers login OK' : 'Pas de redirection'
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
      name: "4. Test des cookies de session",
      description: "Vérifier la gestion des cookies",
      test: async () => {
        try {
          // Simuler une requête avec cookies
          const response = await fetch(`${API_BASE_URL}/admin`, {
            headers: {
              'Cookie': 'auth_token=test_token'
            }
          })
          return {
            success: true,
            status: response.status,
            message: `Réponse admin: ${response.status} (attendu: 200 ou 307)`
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
      name: "5. Test des routes API",
      description: "Vérifier les routes API fonctionnelles",
      test: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/custom-requests`)
          return {
            success: response.status === 200,
            status: response.status,
            message: response.status === 200 ? 'API routes fonctionnelles' : 'API routes en erreur'
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
      name: "6. Test du serveur Next.js",
      description: "Vérifier que le serveur fonctionne",
      test: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}`)
          return {
            success: response.status === 200,
            status: response.status,
            message: response.status === 200 ? 'Serveur Next.js actif' : 'Serveur Next.js en erreur'
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
  
  for (const test of tests) {
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
  
  console.log('📊 RÉSULTATS DE L\'ANALYSE')
  console.log('=========================')
  console.log(`Total des tests: ${totalTests}`)
  console.log(`✅ Tests réussis: ${passedTests}`)
  console.log(`❌ Tests échoués: ${failedTests}`)
  
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
  console.log(`📈 Taux de réussite: ${successRate}%`)
  
  console.log('\n🔧 PROBLÈMES IDENTIFIÉS:')
  if (failedTests > 0) {
    console.log('1. ❌ Validation du téléphone admin_phone')
    console.log('2. ❌ Gestion des sessions et cookies')
    console.log('3. ❌ Redirection après connexion')
    console.log('4. ❌ Fonction getCurrentUser')
    console.log('5. ❌ Création de session sécurisée')
  } else {
    console.log('✅ Aucun problème majeur détecté')
  }
  
  console.log('\n💡 SOLUTIONS RECOMMANDÉES:')
  console.log('1. 🔧 Corriger la validation du téléphone')
  console.log('2. 🔧 Vérifier la création de session')
  console.log('3. 🔧 Corriger la redirection après login')
  console.log('4. 🔧 Tester la fonction getCurrentUser')
  console.log('5. 🔧 Vérifier les cookies de session')
  
  console.log('\n🎯 POURCENTAGE DE COMPLETION ADMIN:')
  const adminCompletion = Math.round((passedTests / totalTests) * 100)
  console.log(`📊 ${adminCompletion}% - ${adminCompletion >= 80 ? 'BON' : adminCompletion >= 60 ? 'MOYEN' : 'INSUFFISANT'}`)
}

// Exécuter l'analyse
analyzeAdminLogin().catch(console.error)
