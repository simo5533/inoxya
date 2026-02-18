#!/usr/bin/env node

/**
 * Script de diagnostic complet pour vérifier les erreurs Next.js
 * Usage: node scripts/check-nextjs-errors.js
 */

const API_BASE_URL = 'http://localhost:3001' // Port 3001 car 3000 est occupé

async function checkNextJSErrors() {
  console.log('🔍 DIAGNOSTIC COMPLET - ERREURS NEXT.JS')
  console.log('========================================\n')
  
  let totalTests = 0
  let passedTests = 0
  let failedTests = 0
  let warnings = 0
  
  const tests = [
    {
      name: "1. Test du serveur Next.js",
      description: "Vérifier que le serveur fonctionne",
      test: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}`)
          return {
            success: response.status === 200,
            status: response.status,
            message: response.status === 200 ? 'Serveur Next.js actif' : `Erreur serveur: ${response.status}`
          }
        } catch (error) {
          return {
            success: false,
            status: 'ERROR',
            message: `Serveur non accessible: ${error.message}`
          }
        }
      }
    },
    {
      name: "2. Test de la page d'accueil",
      description: "Vérifier le chargement de la page principale",
      test: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}`)
          const html = await response.text()
          const hasTitle = html.includes('INOXYA')
          const hasContent = html.includes('bijoux') || html.includes('Bijoux')
          
          return {
            success: response.status === 200 && hasTitle && hasContent,
            status: response.status,
            message: response.status === 200 && hasTitle && hasContent ? 'Page d\'accueil chargée correctement' : 'Problème de chargement de la page'
          }
        } catch (error) {
          return {
            success: false,
            status: 'ERROR',
            message: `Erreur page d'accueil: ${error.message}`
          }
        }
      }
    },
    {
      name: "3. Test de la page de connexion",
      description: "Vérifier le formulaire de connexion",
      test: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/login`)
          const html = await response.text()
          const hasForm = html.includes('type="tel"') && html.includes('type="password"')
          const hasSubmit = html.includes('Se connecter')
          
          return {
            success: response.status === 200 && hasForm && hasSubmit,
            status: response.status,
            message: response.status === 200 && hasForm && hasSubmit ? 'Formulaire de connexion OK' : 'Problème avec le formulaire de connexion'
          }
        } catch (error) {
          return {
            success: false,
            status: 'ERROR',
            message: `Erreur page login: ${error.message}`
          }
        }
      }
    },
    {
      name: "4. Test de la page admin",
      description: "Vérifier la redirection admin",
      test: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/admin`, {
            redirect: 'manual'
          })
          
          const isRedirect = response.status === 307 || response.status === 302
          const isAccessible = response.status === 200
          
          return {
            success: isRedirect || isAccessible,
            status: response.status,
            message: isRedirect ? 'Redirection admin OK' : isAccessible ? 'Page admin accessible' : 'Problème avec la page admin'
          }
        } catch (error) {
          return {
            success: false,
            status: 'ERROR',
            message: `Erreur page admin: ${error.message}`
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
          const isWorking = response.status === 200 || response.status === 401 || response.status === 403
          
          return {
            success: isWorking,
            status: response.status,
            message: isWorking ? 'Routes API fonctionnelles' : 'Erreur dans les routes API'
          }
        } catch (error) {
          return {
            success: false,
            status: 'ERROR',
            message: `Erreur routes API: ${error.message}`
          }
        }
      }
    },
    {
      name: "6. Test des pages bijoux",
      description: "Vérifier les pages de produits",
      test: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/bijoux`)
          const html = await response.text()
          const hasContent = html.includes('bijoux') || html.includes('Bijoux')
          
          return {
            success: response.status === 200 && hasContent,
            status: response.status,
            message: response.status === 200 && hasContent ? 'Pages bijoux OK' : 'Problème avec les pages bijoux'
          }
        } catch (error) {
          return {
            success: false,
            status: 'ERROR',
            message: `Erreur pages bijoux: ${error.message}`
          }
        }
      }
    },
    {
      name: "7. Test des pages packs",
      description: "Vérifier les pages de collections",
      test: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/packs`)
          const html = await response.text()
          const hasContent = html.includes('pack') || html.includes('Pack') || html.includes('collection')
          
          return {
            success: response.status === 200 && hasContent,
            status: response.status,
            message: response.status === 200 && hasContent ? 'Pages packs OK' : 'Problème avec les pages packs'
          }
        } catch (error) {
          return {
            success: false,
            status: 'ERROR',
            message: `Erreur pages packs: ${error.message}`
          }
        }
      }
    },
    {
      name: "8. Test des erreurs 404",
      description: "Vérifier la gestion des pages non trouvées",
      test: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/page-inexistante`)
          const is404 = response.status === 404
          
          return {
            success: is404,
            status: response.status,
            message: is404 ? 'Gestion 404 OK' : 'Problème avec la gestion 404'
          }
        } catch (error) {
          return {
            success: false,
            status: 'ERROR',
            message: `Erreur test 404: ${error.message}`
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
      
      // Détecter les avertissements (status 401, 403)
      if (result.status === 401 || result.status === 403) {
        warnings++
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur lors du test: ${error.message}`)
      totalTests++
      failedTests++
    }
    
    console.log('')
  }
  
  console.log('📊 RÉSULTATS DU DIAGNOSTIC')
  console.log('==========================')
  console.log(`Total des tests: ${totalTests}`)
  console.log(`✅ Tests réussis: ${passedTests}`)
  console.log(`❌ Tests échoués: ${failedTests}`)
  console.log(`⚠️  Avertissements: ${warnings}`)
  
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
  console.log(`📈 Taux de réussite: ${successRate}%`)
  
  console.log('\n🔍 ANALYSE DES ERREURS:')
  if (failedTests === 0) {
    console.log('✅ Aucune erreur critique détectée')
    if (warnings > 0) {
      console.log(`⚠️  ${warnings} avertissement(s) détecté(s) (authentification requise)`)
    }
  } else {
    console.log(`❌ ${failedTests} erreur(s) critique(s) détectée(s)`)
    console.log('💡 Vérifiez:')
    console.log('   - Les imports de composants')
    console.log('   - La configuration des routes')
    console.log('   - Les erreurs de compilation')
    console.log('   - Les dépendances manquantes')
  }
  
  console.log('\n🎯 ÉTAT DU PROJET:')
  if (successRate >= 90) {
    console.log('🟢 EXCELLENT - Projet Next.js en bon état')
  } else if (successRate >= 70) {
    console.log('🟡 BON - Quelques problèmes mineurs')
  } else if (successRate >= 50) {
    console.log('🟠 MOYEN - Problèmes modérés détectés')
  } else {
    console.log('🔴 CRITIQUE - Problèmes majeurs détectés')
  }
  
  console.log('\n🌐 URLs D\'ACCÈS:')
  console.log(`   🏠 Site principal : ${API_BASE_URL}`)
  console.log(`   🔐 Connexion : ${API_BASE_URL}/login`)
  console.log(`   ⚙️  Admin : ${API_BASE_URL}/admin`)
  console.log(`   💎 Bijoux : ${API_BASE_URL}/bijoux`)
  console.log(`   📦 Packs : ${API_BASE_URL}/packs`)
  
  console.log('\n🔧 RECOMMANDATIONS:')
  if (successRate >= 90) {
    console.log('✅ Votre projet Next.js fonctionne correctement')
    console.log('✅ Vous pouvez continuer le développement')
  } else {
    console.log('🔧 Corrigez les erreurs identifiées ci-dessus')
    console.log('🔧 Vérifiez les logs du serveur Next.js')
    console.log('🔧 Testez chaque page individuellement')
  }
}

// Exécuter le diagnostic
checkNextJSErrors().catch(console.error)
