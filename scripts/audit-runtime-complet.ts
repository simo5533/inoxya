/**
 * AUDIT RUNTIME COMPLET - Tests réels avec serveur Next.js
 * Teste chaque page, API, bouton et fonctionnalité en runtime
 */

import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const BASE_URL = process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000'
const TIMEOUT = 10000

interface TestResult {
  name: string
  status: '✅' | '❌' | '⚠️'
  message: string
  details?: string
}

const results: TestResult[] = []

function addResult(name: string, status: '✅' | '❌' | '⚠️', message: string, details?: string) {
  results.push({ name, status, message, details })
  const symbol = status === '✅' ? '✅' : status === '❌' ? '❌' : '⚠️'
  console.log(`${symbol} ${name}: ${message}`)
  if (details) {
    console.log(`   ${details}`)
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = TIMEOUT): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function testServerAvailability() {
  console.log('\n🔍 ÉTAPE 0: Vérification du serveur\n')
  
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/health`, { method: 'GET' })
    if (response.ok) {
      addResult('Serveur', '✅', 'Serveur accessible')
      return true
    }
  } catch (error) {
    // Essayer la page d'accueil
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/`, { method: 'GET' })
      if (response.ok || response.status === 200) {
        addResult('Serveur', '✅', 'Serveur accessible (via page d\'accueil)')
        return true
      }
    } catch {
      addResult('Serveur', '❌', 'Serveur non accessible', 'Démarrez le serveur avec: npm run dev')
      return false
    }
  }
  
  addResult('Serveur', '❌', 'Serveur non accessible')
  return false
}

async function testCSRFToken() {
  console.log('\n🔍 ÉTAPE 1: Test CSRF Token\n')
  
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/csrf-token`, { method: 'GET' })
    if (response.ok) {
      const data = await response.json()
      if (data.csrfToken || data.token) {
        addResult('CSRF Token', '✅', 'Token CSRF récupéré')
        return data.csrfToken || data.token
      } else {
        addResult('CSRF Token', '❌', 'Token CSRF manquant dans la réponse')
        return null
      }
    } else {
      addResult('CSRF Token', '❌', `HTTP ${response.status}`)
      return null
    }
  } catch (error) {
    addResult('CSRF Token', '❌', 'Erreur de connexion', error instanceof Error ? error.message : String(error))
    return null
  }
}

async function testAPIs(csrfToken: string | null) {
  console.log('\n🔍 ÉTAPE 2: Test des APIs\n')
  
  // GET /api/products
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/products`, { method: 'GET' })
    if (response.ok) {
      const data = await response.json()
      const count = data.products?.length || data.length || 0
      addResult('GET /api/products', '✅', `HTTP ${response.status} - ${count} produits`)
    } else {
      addResult('GET /api/products', '❌', `HTTP ${response.status}`)
    }
  } catch (error) {
    addResult('GET /api/products', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
  
  // GET /api/packs
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/packs`, { method: 'GET' })
    if (response.ok) {
      const data = await response.json()
      const count = data.packs?.length || data.length || 0
      addResult('GET /api/packs', '✅', `HTTP ${response.status} - ${count} packs`)
    } else {
      addResult('GET /api/packs', '❌', `HTTP ${response.status}`)
    }
  } catch (error) {
    addResult('GET /api/packs', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
  
  // GET /api/categories
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/categories`, { method: 'GET' })
    if (response.ok) {
      addResult('GET /api/categories', '✅', `HTTP ${response.status}`)
    } else {
      addResult('GET /api/categories', '❌', `HTTP ${response.status}`)
    }
  } catch (error) {
    addResult('GET /api/categories', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
  
  // GET /api/admin/stats (sans auth - doit retourner 401 ou 403)
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/admin/stats`, { method: 'GET' })
    if (response.status === 401 || response.status === 403) {
      addResult('GET /api/admin/stats (sans auth)', '✅', `HTTP ${response.status} (protégée)`)
    } else if (response.status === 200) {
      addResult('GET /api/admin/stats (sans auth)', '⚠️', `HTTP ${response.status} (non protégée)`)
    } else {
      addResult('GET /api/admin/stats (sans auth)', '❌', `HTTP ${response.status}`)
    }
  } catch (error) {
    addResult('GET /api/admin/stats', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
  
  if (!csrfToken) {
    addResult('POST APIs', '⚠️', 'Tests POST ignorés (pas de CSRF token)')
    return
  }
  
  // POST /api/auth/login (fausses credentials - doit retourner 401/400, pas 500)
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        phone: 'fake@test.com',
        password: 'wrongpass',
      }),
    })
    if (response.status === 401 || response.status === 400) {
      addResult('POST /api/auth/login (fausses creds)', '✅', `HTTP ${response.status} (correct)`)
    } else if (response.status === 500) {
      addResult('POST /api/auth/login (fausses creds)', '❌', `HTTP 500 (ERREUR SERVEUR)`)
    } else {
      addResult('POST /api/auth/login (fausses creds)', '⚠️', `HTTP ${response.status}`)
    }
  } catch (error) {
    addResult('POST /api/auth/login', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
  
  // POST /api/checkout (panier vide - doit retourner 400, pas 500)
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        items: [],
      }),
    })
    if (response.status === 400 || response.status === 422) {
      addResult('POST /api/checkout (panier vide)', '✅', `HTTP ${response.status} (correct)`)
    } else if (response.status === 500) {
      addResult('POST /api/checkout (panier vide)', '❌', `HTTP 500 (ERREUR SERVEUR)`)
    } else {
      addResult('POST /api/checkout (panier vide)', '⚠️', `HTTP ${response.status}`)
    }
  } catch (error) {
    addResult('POST /api/checkout', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
  
  // POST /api/custom-requests (données invalides - doit retourner 400, pas 500)
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/custom-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({}),
    })
    if (response.status === 400 || response.status === 422) {
      addResult('POST /api/custom-requests (vide)', '✅', `HTTP ${response.status} (correct)`)
    } else if (response.status === 500) {
      addResult('POST /api/custom-requests (vide)', '❌', `HTTP 500 (ERREUR SERVEUR)`)
    } else {
      addResult('POST /api/custom-requests (vide)', '⚠️', `HTTP ${response.status}`)
    }
  } catch (error) {
    addResult('POST /api/custom-requests', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
}

async function testPages() {
  console.log('\n🔍 ÉTAPE 3: Test des Pages\n')
  
  const pages = [
    { path: '/', name: 'Page d\'accueil' },
    { path: '/fr', name: 'Page d\'accueil (fr)' },
    { path: '/fr/bijoux', name: 'Page Bijoux' },
    { path: '/fr/packs', name: 'Page Packs' },
    { path: '/fr/panier', name: 'Page Panier' },
    { path: '/fr/panier/checkout', name: 'Page Checkout' },
    { path: '/fr/sur-mesure', name: 'Page Sur-mesure' },
    { path: '/fr/inscription', name: 'Page Inscription' },
    { path: '/fr/login', name: 'Page Connexion' },
    { path: '/admin', name: 'Page Admin (sans auth)' },
  ]
  
  for (const page of pages) {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}${page.path}`, { method: 'GET' })
      if (response.ok) {
        addResult(page.name, '✅', `HTTP ${response.status}`)
      } else if (response.status === 401 || response.status === 403 || response.status === 302 || response.status === 301) {
        if (page.path.startsWith('/admin')) {
          addResult(page.name, '✅', `HTTP ${response.status} (protégée)`)
        } else {
          addResult(page.name, '⚠️', `HTTP ${response.status} (redirection)`)
        }
      } else {
        addResult(page.name, '❌', `HTTP ${response.status}`)
      }
    } catch (error) {
      addResult(page.name, '❌', 'Erreur', error instanceof Error ? error.message : String(error))
    }
  }
}

async function testDatabaseConnection() {
  console.log('\n🔍 ÉTAPE 4: Test Base de Données\n')
  
  try {
    const { getDatabaseAdapter } = await import('../lib/db/index')
    const adapter = await getDatabaseAdapter()
    
    const products = await adapter.getProducts()
    addResult('DB - getProducts()', '✅', `${products.length} produits`)
    
    const packs = await adapter.getPacks()
    addResult('DB - getPacks()', '✅', `${packs.length} packs`)
    
    const categories = await adapter.getCategories()
    addResult('DB - getCategories()', '✅', `${categories.length} catégories`)
    
    const stats = await adapter.getDashboardStats()
    // getDashboardStats() de lib/database.ts retourne un objet avec totalBijoux, totalPacks, etc.
    // Mais l'adapter retourne DashboardStats avec totalProducts
    const totalProducts = 'totalProducts' in stats ? stats.totalProducts : ('totalBijoux' in stats ? (stats as { totalBijoux: number }).totalBijoux : 0)
    const totalPacks = 'totalPacks' in stats ? (stats as { totalPacks: number }).totalPacks : ('packs' in stats ? (stats as { packs: number }).packs : 0)
    addResult('DB - getDashboardStats()', '✅', `Stats: ${totalProducts} produits, ${totalPacks} packs`)
  } catch (error) {
    addResult('DB - Connexion', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
}

function checkCodeFiles() {
  console.log('\n🔍 ÉTAPE 5: Vérification du Code\n')
  
  // Vérifier que les fichiers critiques existent
  const criticalFiles = [
    'app/[locale]/page.tsx',
    'app/[locale]/bijoux/page.tsx',
    'app/[locale]/bijoux/[id]/page.tsx',
    'app/[locale]/packs/page.tsx',
    'app/[locale]/panier/page.tsx',
    'app/[locale]/panier/checkout/page.tsx',
    'app/[locale]/sur-mesure/page.tsx',
    'app/[locale]/inscription/page.tsx',
    'app/api/products/route.ts',
    'app/api/packs/route.ts',
    'app/api/checkout/route.ts',
    'app/api/custom-requests/route.ts',
    'app/api/auth/login/route.ts',
    'app/api/auth/register/route.ts',
    'components/PackCard.tsx',
    'components/ProductCard.tsx',
    'components/BijouCard.tsx',
    'lib/cart-favorites.ts',
  ]
  
  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      addResult(`Fichier: ${file}`, '✅', 'Existe')
    } else {
      addResult(`Fichier: ${file}`, '❌', 'Manquant')
    }
  }
}

function generateReport() {
  console.log('\n' + '='.repeat(70))
  console.log('📊 RAPPORT FINAL - AUDIT RUNTIME COMPLET')
  console.log('='.repeat(70))
  
  const success = results.filter(r => r.status === '✅').length
  const warnings = results.filter(r => r.status === '⚠️').length
  const errors = results.filter(r => r.status === '❌').length
  const total = results.length
  
  console.log(`\n✅ Succès: ${success}/${total}`)
  console.log(`⚠️  Avertissements: ${warnings}/${total}`)
  console.log(`❌ Erreurs: ${errors}/${total}`)
  
  if (errors > 0) {
    console.log('\n❌ ERREURS TROUVÉES:')
    results.filter(r => r.status === '❌').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`)
      if (r.details) {
        console.log(`     ${r.details}`)
      }
    })
  }
  
  if (warnings > 0) {
    console.log('\n⚠️  AVERTISSEMENTS:')
    results.filter(r => r.status === '⚠️').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`)
    })
  }
  
  console.log('\n' + '='.repeat(70))
  
  if (errors === 0) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS ! Le projet est prêt pour le déploiement.')
  } else {
    console.log('🔴 PROBLÈMES DÉTECTÉS - Réparez les erreurs avant le déploiement.')
  }
  
  console.log('='.repeat(70) + '\n')
}

async function main() {
  console.log('🚀 AUDIT RUNTIME COMPLET')
  console.log('='.repeat(70))
  console.log(`Base URL: ${BASE_URL}`)
  console.log('='.repeat(70))
  
  const serverAvailable = await testServerAvailability()
  
  if (!serverAvailable) {
    console.log('\n❌ Serveur non accessible. Démarrez le serveur avec: npm run dev')
    console.log('   Puis relancez cet audit.')
    process.exit(1)
  }
  
  const csrfToken = await testCSRFToken()
  await testAPIs(csrfToken)
  await testPages()
  await testDatabaseConnection()
  checkCodeFiles()
  
  generateReport()
  
  const errors = results.filter(r => r.status === '❌').length
  process.exit(errors > 0 ? 1 : 0)
}

main().catch(console.error)

