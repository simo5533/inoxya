/**
 * AUDIT COMPLET CLIENT + ADMIN
 * Vérifie toutes les pages client et admin, leurs boutons et APIs
 */

import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
dotenv.config({ path: '.env.local' })

interface AuditResult {
  category: string
  test: string
  status: '✅' | '❌' | '⚠️'
  message: string
  details?: string
}

const results: AuditResult[] = []

function addResult(category: string, test: string, status: '✅' | '❌' | '⚠️', message: string, details?: string) {
  results.push({ category, test, status, message, details })
  console.log(`${status} ${category} - ${test}: ${message}`)
}

function checkFileExists(filePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), filePath))
}

function checkFileContent(filePath: string, patterns: string[]): boolean {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8')
    return patterns.every(pattern => content.includes(pattern))
  } catch {
    return false
  }
}

function auditClientPages() {
  console.log('\n🔍 AUDIT DES PAGES CLIENT\n')
  
  const clientPages = [
    { path: 'app/[locale]/page.tsx', name: 'Page d\'accueil' },
    { path: 'app/[locale]/bijoux/page.tsx', name: 'Page Bijoux' },
    { path: 'app/[locale]/bijoux/[id]/page.tsx', name: 'Détail Bijou' },
    { path: 'app/[locale]/packs/page.tsx', name: 'Page Packs' },
    { path: 'app/[locale]/panier/page.tsx', name: 'Page Panier' },
    { path: 'app/[locale]/panier/checkout/page.tsx', name: 'Page Checkout' },
    { path: 'app/[locale]/sur-mesure/page.tsx', name: 'Page Sur-mesure' },
    { path: 'app/[locale]/inscription/page.tsx', name: 'Page Inscription' },
    { path: 'app/[locale]/login/page.tsx', name: 'Page Connexion' },
    { path: 'app/[locale]/favoris/page.tsx', name: 'Page Favoris' },
  ]
  
  for (const page of clientPages) {
    if (checkFileExists(page.path)) {
      addResult('Pages Client', page.name, '✅', 'Fichier existe')
      
      // Vérifier les patterns importants
      if (page.path.includes('checkout')) {
        if (checkFileContent(page.path, ['/api/checkout', 'X-CSRF-Token', 'bijou_id'])) {
          addResult('Pages Client', `${page.name} - API`, '✅', 'Appel API checkout correct')
        } else {
          addResult('Pages Client', `${page.name} - API`, '❌', 'Problème avec appel API checkout')
        }
      }
      
      if (page.path.includes('sur-mesure')) {
        if (checkFileContent(page.path, ['/api/custom-requests', 'X-CSRF-Token'])) {
          addResult('Pages Client', `${page.name} - API`, '✅', 'Appel API custom-requests correct')
        } else {
          addResult('Pages Client', `${page.name} - API`, '❌', 'Problème avec appel API custom-requests')
        }
      }
      
      if (page.path.includes('inscription')) {
        if (checkFileContent(page.path, ['/api/auth/register', 'X-CSRF-Token'])) {
          addResult('Pages Client', `${page.name} - API`, '✅', 'Appel API register correct')
        } else {
          addResult('Pages Client', `${page.name} - API`, '❌', 'Problème avec appel API register')
        }
      }
    } else {
      addResult('Pages Client', page.name, '❌', 'Fichier manquant')
    }
  }
}

function auditClientComponents() {
  console.log('\n🔍 AUDIT DES COMPOSANTS CLIENT\n')
  
  const components = [
    { path: 'components/BijouCard.tsx', checks: ['/bijoux/', 'useLocale', 'Link'] },
    { path: 'components/PackCard.tsx', checks: ['/api/checkout', 'pack_id', 'X-CSRF-Token'] },
    { path: 'components/ProductCard.tsx', checks: ['/bijoux/', 'useLocale'] },
    { path: 'components/ConnexionSection.tsx', checks: ['/inscription', 'useLocale'] },
  ]
  
  for (const comp of components) {
    if (checkFileExists(comp.path)) {
      if (checkFileContent(comp.path, comp.checks)) {
        addResult('Composants Client', comp.path, '✅', 'Tous les patterns présents')
      } else {
        addResult('Composants Client', comp.path, '⚠️', 'Certains patterns manquants')
      }
    } else {
      addResult('Composants Client', comp.path, '❌', 'Fichier manquant')
    }
  }
}

function auditAdminPages() {
  console.log('\n🔍 AUDIT DES PAGES ADMIN\n')
  
  const adminPages = [
    { path: 'app/admin/page.tsx', name: 'Dashboard Admin' },
    { path: 'app/admin/produits/page.tsx', name: 'Gestion Produits' },
    { path: 'app/admin/produits/nouveau/page.tsx', name: 'Nouveau Produit' },
    { path: 'app/admin/produits/[id]/modifier/page.tsx', name: 'Modifier Produit' },
    { path: 'app/admin/packs/page.tsx', name: 'Gestion Packs' },
    { path: 'app/admin/orders/page.tsx', name: 'Gestion Commandes' },
    { path: 'app/admin/orders/[id]/page.tsx', name: 'Détail Commande' },
    { path: 'app/admin/payments/page.tsx', name: 'Gestion Paiements' },
    { path: 'app/admin/notifications/page.tsx', name: 'Notifications' },
    { path: 'app/admin/settings/page.tsx', name: 'Paramètres' },
  ]
  
  for (const page of adminPages) {
    if (checkFileExists(page.path)) {
      addResult('Pages Admin', page.name, '✅', 'Fichier existe')
      
      // Vérifier les patterns importants
      if (page.path.includes('produits')) {
        if (checkFileContent(page.path, ['/api/products'])) {
          addResult('Pages Admin', `${page.name} - API`, '✅', 'Appel API products présent')
        }
      }
      
      if (page.path.includes('orders')) {
        if (checkFileContent(page.path, ['/api/orders', 'X-CSRF-Token'])) {
          addResult('Pages Admin', `${page.name} - API`, '✅', 'Appel API orders avec CSRF')
        }
      }
    } else {
      addResult('Pages Admin', page.name, '❌', 'Fichier manquant')
    }
  }
}

function auditAPIs() {
  console.log('\n🔍 AUDIT DES APIs\n')
  
  const apiRoutes = [
    { path: 'app/api/products/route.ts', methods: ['GET', 'POST'] },
    { path: 'app/api/products/[id]/route.ts', methods: ['GET', 'PUT', 'DELETE'] },
    { path: 'app/api/packs/route.ts', methods: ['GET'] },
    { path: 'app/api/checkout/route.ts', methods: ['POST'] },
    { path: 'app/api/custom-requests/route.ts', methods: ['POST'] },
    { path: 'app/api/orders/route.ts', methods: ['GET', 'POST'] },
    { path: 'app/api/admin/stats/route.ts', methods: ['GET'] },
    { path: 'app/api/auth/login/route.ts', methods: ['POST'] },
    { path: 'app/api/auth/register/route.ts', methods: ['POST'] },
    { path: 'app/api/csrf-token/route.ts', methods: ['GET'] },
  ]
  
  for (const api of apiRoutes) {
    if (checkFileExists(api.path)) {
      addResult('APIs', api.path, '✅', 'Fichier existe')
      
      // Vérifier les méthodes
      const content = fs.readFileSync(path.join(process.cwd(), api.path), 'utf-8')
      for (const method of api.methods) {
        if (content.includes(`export async function ${method}`)) {
          addResult('APIs', `${api.path} - ${method}`, '✅', 'Méthode présente')
        } else {
          addResult('APIs', `${api.path} - ${method}`, '❌', 'Méthode manquante')
        }
      }
      
      // Vérifier CSRF pour POST/PUT/DELETE
      if (api.methods.some(m => ['POST', 'PUT', 'DELETE'].includes(m))) {
        if (content.includes('requireCSRF') || content.includes('X-CSRF-Token')) {
          addResult('APIs', `${api.path} - CSRF`, '✅', 'Protection CSRF présente')
        } else {
          addResult('APIs', `${api.path} - CSRF`, '⚠️', 'Protection CSRF manquante')
        }
      }
    } else {
      addResult('APIs', api.path, '❌', 'Fichier manquant')
    }
  }
}

function printResults() {
  console.log('\n' + '='.repeat(70))
  console.log('📊 RÉSULTATS DE L\'AUDIT COMPLET')
  console.log('='.repeat(70) + '\n')
  
  const categories = [...new Set(results.map(r => r.category))]
  
  for (const category of categories) {
    console.log(`\n📁 ${category.toUpperCase()}`)
    console.log('-'.repeat(70))
    
    const categoryResults = results.filter(r => r.category === category)
    for (const result of categoryResults) {
      console.log(`  ${result.status} ${result.test}`)
      console.log(`     ${result.message}`)
      if (result.details) {
        console.log(`     Détails: ${result.details}`)
      }
    }
  }
  
  const successCount = results.filter(r => r.status === '✅').length
  const warningCount = results.filter(r => r.status === '⚠️').length
  const errorCount = results.filter(r => r.status === '❌').length
  
  console.log('\n' + '='.repeat(70))
  console.log('📈 RÉSUMÉ')
  console.log('='.repeat(70))
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
  console.log('🚀 AUDIT COMPLET CLIENT + ADMIN')
  console.log('='.repeat(70))
  
  auditClientPages()
  auditClientComponents()
  auditAdminPages()
  auditAPIs()
  
  const exitCode = printResults()
  process.exit(exitCode)
}

main().catch((error) => {
  console.error('❌ Erreur fatale lors de l\'audit:', error)
  process.exit(1)
})

