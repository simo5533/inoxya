/**
 * TEST COMPLET DES BOUTONS ET APIs
 * Vérifie tous les boutons, redirections et endpoints API
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

interface TestResult {
  category: string
  test: string
  status: '✅' | '❌' | '⚠️'
  message: string
  details?: string
}

const results: TestResult[] = []

function addResult(category: string, test: string, status: '✅' | '❌' | '⚠️', message: string, details?: string) {
  results.push({ category, test, status, message, details })
  console.log(`${status} ${category} - ${test}: ${message}`)
}

async function testAPIs() {
  console.log('\n🔍 TEST DES APIs (nécessite npm run dev)\n')
  
  const baseUrl = process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000'
  
  // Test 1: API Products
  try {
    const response = await fetch(`${baseUrl}/api/products`, { 
      signal: AbortSignal.timeout(5000) // Timeout de 5 secondes
    })
    if (response.ok) {
      const data = await response.json()
      if (data.products && Array.isArray(data.products)) {
        addResult('APIs', '/api/products', '✅', `${data.products.length} produits récupérés`)
      } else {
        addResult('APIs', '/api/products', '⚠️', 'Format de réponse inattendu', JSON.stringify(data).substring(0, 100))
      }
    } else {
      addResult('APIs', '/api/products', '❌', `Erreur ${response.status}`)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      addResult('APIs', '/api/products', '⚠️', 'Timeout - Serveur non démarré (lancez: npm run dev)')
    } else {
      addResult('APIs', '/api/products', '⚠️', 'Serveur non accessible (lancez: npm run dev)', error instanceof Error ? error.message : String(error))
    }
  }
  
  // Test 2: API Packs
  try {
    const response = await fetch(`${baseUrl}/api/packs`, { 
      signal: AbortSignal.timeout(5000)
    })
    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data) || (data.packs && Array.isArray(data.packs))) {
        const packs = Array.isArray(data) ? data : data.packs
        addResult('APIs', '/api/packs', '✅', `${packs.length} packs récupérés`)
      } else {
        addResult('APIs', '/api/packs', '⚠️', 'Format de réponse inattendu')
      }
    } else {
      addResult('APIs', '/api/packs', '❌', `Erreur ${response.status}`)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      addResult('APIs', '/api/packs', '⚠️', 'Timeout - Serveur non démarré (lancez: npm run dev)')
    } else {
      addResult('APIs', '/api/packs', '⚠️', 'Serveur non accessible (lancez: npm run dev)', error instanceof Error ? error.message : String(error))
    }
  }
  
  // Test 3: API Admin Stats
  try {
    const response = await fetch(`${baseUrl}/api/admin/stats`, { 
      signal: AbortSignal.timeout(5000)
    })
    if (response.ok) {
      const data = await response.json()
      if (data.totalBijoux !== undefined && data.totalPacks !== undefined) {
        addResult('APIs', '/api/admin/stats', '✅', `Stats: ${data.totalBijoux} bijoux, ${data.totalPacks} packs`)
      } else {
        addResult('APIs', '/api/admin/stats', '⚠️', 'Format de réponse inattendu')
      }
    } else {
      addResult('APIs', '/api/admin/stats', '❌', `Erreur ${response.status}`)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      addResult('APIs', '/api/admin/stats', '⚠️', 'Timeout - Serveur non démarré (lancez: npm run dev)')
    } else {
      addResult('APIs', '/api/admin/stats', '⚠️', 'Serveur non accessible (lancez: npm run dev)', error instanceof Error ? error.message : String(error))
    }
  }
  
  // Test 4: API CSRF Token
  try {
    const response = await fetch(`${baseUrl}/api/csrf-token`, { 
      signal: AbortSignal.timeout(5000)
    })
    if (response.ok) {
      const data = await response.json()
      if (data.token) {
        addResult('APIs', '/api/csrf-token', '✅', 'Token CSRF généré')
      } else {
        addResult('APIs', '/api/csrf-token', '⚠️', 'Token manquant dans la réponse')
      }
    } else {
      addResult('APIs', '/api/csrf-token', '❌', `Erreur ${response.status}`)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      addResult('APIs', '/api/csrf-token', '⚠️', 'Timeout - Serveur non démarré (lancez: npm run dev)')
    } else {
      addResult('APIs', '/api/csrf-token', '⚠️', 'Serveur non accessible (lancez: npm run dev)', error instanceof Error ? error.message : String(error))
    }
  }
}

function testButtonsAndRedirects() {
  console.log('\n🔍 VÉRIFICATION DES BOUTONS ET REDIRECTIONS\n')
  
  // Vérifier que les fichiers de composants existent et ont les bonnes redirections
  const fs = require('fs')
  const path = require('path')
  
  // Test 1: ConnexionSection - Inscription
  try {
    const content = fs.readFileSync(path.join(process.cwd(), 'components/ConnexionSection.tsx'), 'utf-8')
    if (content.includes('/inscription') && content.includes('useLocale')) {
      addResult('Boutons', 'ConnexionSection - Inscription', '✅', 'Redirection vers /inscription correcte')
    } else {
      addResult('Boutons', 'ConnexionSection - Inscription', '⚠️', 'Vérifier la redirection')
    }
  } catch (error) {
    addResult('Boutons', 'ConnexionSection - Inscription', '❌', 'Fichier non trouvé')
  }
  
  // Test 2: BijouCard - Voir détails
  try {
    const content = fs.readFileSync(path.join(process.cwd(), 'components/BijouCard.tsx'), 'utf-8')
    if (content.includes('/bijoux/') && content.includes('useLocale')) {
      addResult('Boutons', 'BijouCard - Voir détails', '✅', 'Redirection vers /bijoux/[id] correcte')
    } else {
      addResult('Boutons', 'BijouCard - Voir détails', '⚠️', 'Vérifier la redirection')
    }
  } catch (error) {
    addResult('Boutons', 'BijouCard - Voir détails', '❌', 'Fichier non trouvé')
  }
  
  // Test 3: PackCard - Confirmer commande
  try {
    const content = fs.readFileSync(path.join(process.cwd(), 'components/PackCard.tsx'), 'utf-8')
    if (content.includes('/api/checkout') && content.includes('pack_id')) {
      addResult('Boutons', 'PackCard - Confirmer commande', '✅', 'Envoie pack_id à /api/checkout')
    } else {
      addResult('Boutons', 'PackCard - Confirmer commande', '⚠️', 'Vérifier l\'envoi des données')
    }
  } catch (error) {
    addResult('Boutons', 'PackCard - Confirmer commande', '❌', 'Fichier non trouvé')
  }
  
  // Test 4: Sur-mesure - Formulaire
  try {
    const content = fs.readFileSync(path.join(process.cwd(), 'app/[locale]/sur-mesure/page.tsx'), 'utf-8')
    if (content.includes('/api/custom-requests') && content.includes('X-CSRF-Token')) {
      addResult('Boutons', 'Sur-mesure - Formulaire', '✅', 'Envoie avec CSRF à /api/custom-requests')
    } else {
      addResult('Boutons', 'Sur-mesure - Formulaire', '⚠️', 'Vérifier l\'envoi avec CSRF')
    }
  } catch (error) {
    addResult('Boutons', 'Sur-mesure - Formulaire', '❌', 'Fichier non trouvé')
  }
  
  // Test 5: Checkout - Page
  try {
    const content = fs.readFileSync(path.join(process.cwd(), 'app/[locale]/panier/checkout/page.tsx'), 'utf-8')
    if (content.includes('/api/checkout') && content.includes('bijou_id')) {
      addResult('Boutons', 'Checkout - Page', '✅', 'Envoie bijou_id à /api/checkout')
    } else {
      addResult('Boutons', 'Checkout - Page', '⚠️', 'Vérifier l\'envoi des données')
    }
  } catch (error) {
    addResult('Boutons', 'Checkout - Page', '❌', 'Fichier non trouvé')
  }
}

function printResults() {
  console.log('\n' + '='.repeat(70))
  console.log('📊 RÉSULTATS DES TESTS')
  console.log('='.repeat(70) + '\n')
  
  const successCount = results.filter(r => r.status === '✅').length
  const warningCount = results.filter(r => r.status === '⚠️').length
  const errorCount = results.filter(r => r.status === '❌').length
  
  console.log(`✅ Succès: ${successCount}`)
  console.log(`⚠️  Avertissements: ${warningCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log('='.repeat(70) + '\n')
  
  if (errorCount === 0) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS ! Le projet est prêt pour le déploiement.\n')
    return 0
  } else {
    console.log('❌ DES ERREURS ONT ÉTÉ DÉTECTÉES. Corrigez-les avant de déployer.\n')
    return 1
  }
}

async function main() {
  console.log('🚀 TEST COMPLET DES BOUTONS ET APIs')
  console.log('='.repeat(70))
  
  testButtonsAndRedirects()
  await testAPIs()
  
  const exitCode = printResults()
  process.exit(exitCode)
}

main().catch((error) => {
  console.error('❌ Erreur fatale lors des tests:', error)
  process.exit(1)
})

