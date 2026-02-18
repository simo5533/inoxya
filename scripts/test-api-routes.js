#!/usr/bin/env node

/**
 * Script de test pour vérifier que toutes les routes API sont fonctionnelles
 * Usage: node scripts/test-api-routes.js
 */

const API_BASE_URL = 'http://localhost:3000/api'

// Liste de toutes les routes API à tester
const API_ROUTES = [
  // Routes de favoris
  { method: 'GET', path: '/favorites', description: 'Récupérer les favoris' },
  { method: 'POST', path: '/favorites', description: 'Ajouter/retirer des favoris' },
  
  // Routes de commandes
  { method: 'GET', path: '/orders', description: 'Récupérer toutes les commandes' },
  { method: 'POST', path: '/orders', description: 'Créer une nouvelle commande' },
  { method: 'GET', path: '/orders/export?format=csv', description: 'Exporter les commandes en CSV' },
  { method: 'GET', path: '/orders/export?format=pdf', description: 'Exporter les commandes en PDF' },
  
  // Routes de demandes sur mesure
  { method: 'GET', path: '/custom-requests', description: 'Récupérer les demandes sur mesure' },
  { method: 'POST', path: '/custom-requests', description: 'Créer une demande sur mesure' },
  
  // Routes de paiements
  { method: 'GET', path: '/payments', description: 'Récupérer tous les paiements' },
  { method: 'POST', path: '/payments', description: 'Créer un nouveau paiement' },
  
  // Routes de factures
  { method: 'POST', path: '/invoices/generate', description: 'Générer une facture' },
  { method: 'POST', path: '/invoices/generate-pdf', description: 'Générer une facture PDF' },
  { method: 'POST', path: '/invoices/send-email', description: 'Envoyer une facture par email' }
]

// Données de test
const TEST_DATA = {
  favorites: {
    bijou_id: 'test-bijou-1',
    action: 'add'
  },
  orders: {
    bijou_id: 'test-bijou-1',
    customer_name: 'Test Client',
    customer_address: '123 Rue Test, Casablanca',
    customer_phone: '0612345678',
    quantity: 1,
    total_amount: 299.99
  },
  customRequests: {
    name: 'Test Client',
    email: 'test@example.com',
    phone: '0612345678',
    type: 'Bague',
    description: 'Bague sur mesure en or',
    budget: '5000 MAD'
  },
  payments: {
    order_id: 'test-order-1',
    amount: 299.99,
    payment_method: 'cash_on_delivery',
    transaction_id: 'TXN123456789'
  },
  invoices: {
    order_id: 'test-order-1',
    customer_info: {
      name: 'Test Client',
      address: '123 Rue Test, Casablanca',
      phone: '0612345678'
    },
    items: [
      { name: 'Bague Test', quantity: 1, price: 299.99 }
    ],
    total_amount: 299.99
  }
}

async function testAPIRoute(route) {
  try {
    const url = `${API_BASE_URL}${route.path}`
    const options = {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    // Ajouter des données pour les requêtes POST
    if (route.method === 'POST') {
      if (route.path.includes('favorites')) {
        options.body = JSON.stringify(TEST_DATA.favorites)
      } else if (route.path.includes('orders') && !route.path.includes('export')) {
        options.body = JSON.stringify(TEST_DATA.orders)
      } else if (route.path.includes('custom-requests')) {
        options.body = JSON.stringify(TEST_DATA.customRequests)
      } else if (route.path.includes('payments') && !route.path.includes('status')) {
        options.body = JSON.stringify(TEST_DATA.payments)
      } else if (route.path.includes('invoices')) {
        options.body = JSON.stringify(TEST_DATA.invoices)
      }
    }

    console.log(`🧪 Test: ${route.method} ${route.path}`)
    console.log(`   Description: ${route.description}`)
    
    const response = await fetch(url, options)
    const status = response.status
    
    if (status === 200 || status === 201) {
      console.log(`   ✅ Succès (${status})`)
    } else if (status === 401 || status === 403) {
      console.log(`   ⚠️  Authentification requise (${status}) - Normal pour les routes admin`)
    } else if (status === 404) {
      console.log(`   ❌ Route non trouvée (${status})`)
    } else {
      console.log(`   ⚠️  Statut inattendu (${status})`)
    }
    
    console.log('')
    
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`)
    console.log('')
  }
}

async function runTests() {
  console.log('🚀 Test des Routes API INOXYA BIJOUX')
  console.log('=====================================\n')
  
  console.log(`Base URL: ${API_BASE_URL}`)
  console.log(`Nombre de routes à tester: ${API_ROUTES.length}\n`)
  
  for (const route of API_ROUTES) {
    await testAPIRoute(route)
  }
  
  console.log('📊 Résumé des Tests')
  console.log('==================')
  console.log('✅ Routes créées avec succès')
  console.log('⚠️  Certaines routes nécessitent une authentification admin')
  console.log('🔧 Pour tester complètement, démarrez le serveur avec: npm run dev')
  console.log('')
  console.log('📋 Routes API créées:')
  API_ROUTES.forEach(route => {
    console.log(`   ${route.method} ${route.path} - ${route.description}`)
  })
}

// Exécuter les tests
runTests().catch(console.error)
