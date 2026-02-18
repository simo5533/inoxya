/**
 * Script de test automatisé pour les fonctionnalités admin
 * Teste les routes API et les fonctionnalités principales
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let testsPassed = 0;
let testsFailed = 0;
let testsTotal = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function test(name, testFn) {
  testsTotal++;
  try {
    log(`\n[TEST ${testsTotal}] ${name}`, 'cyan');
    await testFn();
    testsPassed++;
    log(`✓ ${name} - PASSÉ`, 'green');
  } catch (error) {
    testsFailed++;
    log(`✗ ${name} - ÉCHEC: ${error.message}`, 'red');
  }
}

async function runTests() {
  log('\n═══════════════════════════════════════════════════════', 'blue');
  log('  TESTS AUTOMATISÉS - ADMIN INOXYA BIJOUX', 'blue');
  log('═══════════════════════════════════════════════════════\n', 'blue');

  // Test 1: Serveur accessible
  await test('Serveur accessible', async () => {
    const response = await makeRequest('/');
    if (response.status !== 200 && response.status !== 302) {
      throw new Error(`Serveur non accessible (status: ${response.status})`);
    }
  });

  // Test 2: Page admin accessible (redirection attendue si non connecté)
  await test('Page admin /admin', async () => {
    const response = await makeRequest('/admin');
    // 200 = connecté, 302/307 = redirection vers login (normal), 401 = non autorisé
    if (response.status !== 200 && response.status !== 302 && response.status !== 307 && response.status !== 401) {
      throw new Error(`Page admin non accessible (status: ${response.status})`);
    }
  });

  // Test 3: API Packs
  await test('API Packs - GET /api/admin/packs', async () => {
    const response = await makeRequest('/api/admin/packs');
    // Peut retourner 401/403 si non admin, c'est normal
    if (response.status !== 200 && response.status !== 401 && response.status !== 403) {
      throw new Error(`API packs non accessible (status: ${response.status})`);
    }
  });

  // Test 4: API Commandes
  await test('API Commandes - GET /api/orders', async () => {
    const response = await makeRequest('/api/orders');
    if (response.status !== 200 && response.status !== 401 && response.status !== 403) {
      throw new Error(`API commandes non accessible (status: ${response.status})`);
    }
  });

  // Test 5: API Paiements
  await test('API Paiements - GET /api/payments', async () => {
    const response = await makeRequest('/api/payments');
    if (response.status !== 200 && response.status !== 401 && response.status !== 403) {
      throw new Error(`API paiements non accessible (status: ${response.status})`);
    }
  });

  // Test 6: API Paniers Admin
  await test('API Paniers Admin - GET /api/admin/carts', async () => {
    const response = await makeRequest('/api/admin/carts');
    if (response.status !== 200 && response.status !== 401 && response.status !== 403) {
      throw new Error(`API paniers admin non accessible (status: ${response.status})`);
    }
  });

  // Test 7: API Notifications Admin
  await test('API Notifications Admin - GET /api/admin/notifications', async () => {
    const response = await makeRequest('/api/admin/notifications');
    if (response.status !== 200 && response.status !== 401 && response.status !== 403) {
      throw new Error(`API notifications admin non accessible (status: ${response.status})`);
    }
  });

  // Test 8: Page publique Packs
  await test('Page publique Packs - GET /packs', async () => {
    const response = await makeRequest('/packs');
    if (response.status !== 200 && response.status !== 404) {
      throw new Error(`Page packs non accessible (status: ${response.status})`);
    }
  });

  // Test 9: API Packs publique
  await test('API Packs publique - GET /api/packs', async () => {
    const response = await makeRequest('/api/packs');
    if (response.status !== 200) {
      throw new Error(`API packs publique non accessible (status: ${response.status})`);
    }
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Réponse API packs invalide (pas un tableau)');
    }
  });

  // Test 10: Page login
  await test('Page Login - GET /login', async () => {
    const response = await makeRequest('/login');
    if (response.status !== 200) {
      throw new Error(`Page login non accessible (status: ${response.status})`);
    }
  });

  // Résumé
  log('\n═══════════════════════════════════════════════════════', 'blue');
  log('  RÉSUMÉ DES TESTS', 'blue');
  log('═══════════════════════════════════════════════════════', 'blue');
  log(`\nTotal: ${testsTotal}`, 'cyan');
  log(`✓ Passés: ${testsPassed}`, 'green');
  log(`✗ Échoués: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  log(`\nTaux de réussite: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`, 
    testsPassed === testsTotal ? 'green' : 'yellow');

  if (testsFailed > 0) {
    log('\n⚠️  Certains tests ont échoué. Vérifiez que le serveur est démarré et accessible.', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ Tous les tests sont passés !', 'green');
    process.exit(0);
  }
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  log(`\n❌ Erreur non gérée: ${error.message}`, 'red');
  process.exit(1);
});

// Exécution
runTests().catch((error) => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

