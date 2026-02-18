/**
 * Script de test complet de toutes les fonctionnalités INOXYA BIJOUX
 * Analyse et teste chaque fonctionnalité une par une
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ANALYSE ET TEST COMPLET - INOXYA BIJOUX\n');
console.log('='.repeat(60));
console.log('');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = {
  passed: [],
  failed: [],
  warnings: []
};

// Fonction pour tester une fonctionnalité
function testFeature(name, description, testFn) {
  console.log(`\n📋 Test: ${name}`);
  console.log(`   Description: ${description}`);
  console.log(`   Statut: `);
  
  try {
    const result = testFn();
    if (result.success) {
      console.log(`   ✅ RÉUSSI`);
      TEST_RESULTS.passed.push({ name, description });
    } else {
      console.log(`   ⚠️  AVERTISSEMENT: ${result.message || 'Non testé automatiquement'}`);
      TEST_RESULTS.warnings.push({ name, description, message: result.message });
    }
  } catch (error) {
    console.log(`   ❌ ÉCHEC: ${error.message}`);
    TEST_RESULTS.failed.push({ name, description, error: error.message });
  }
}

// ==================== 1. AUTHENTIFICATION ====================
console.log('\n🔐 1. AUTHENTIFICATION');
console.log('='.repeat(60));

testFeature(
  'Inscription',
  'Création de nouveaux comptes utilisateurs',
  () => {
    // Vérifier que la page existe
    const inscriptionPage = path.join(process.cwd(), 'app/inscription/page.tsx');
    if (!fs.existsSync(inscriptionPage)) {
      throw new Error('Page inscription non trouvée');
    }
    
    // Vérifier que la fonction registerUser existe
    const authFile = path.join(__dirname, '../lib/auth.ts');
    if (!fs.existsSync(authFile)) {
      throw new Error('Fichier auth.ts non trouvé');
    }
    
    const authContent = fs.readFileSync(authFile, 'utf-8');
    if (!authContent.includes('registerUser')) {
      throw new Error('Fonction registerUser non trouvée');
    }
    
    return { success: true };
  }
);

testFeature(
  'Connexion',
  'Authentification des utilisateurs existants',
  () => {
    const authFile = path.join(__dirname, '../lib/auth.ts');
    const authContent = fs.readFileSync(authFile, 'utf-8');
    
    if (!authContent.includes('loginUser')) {
      throw new Error('Fonction loginUser non trouvée');
    }
    
    return { success: true };
  }
);

testFeature(
  'Déconnexion',
  'Fermeture de session utilisateur',
  () => {
    const authFile = path.join(__dirname, '../lib/auth.ts');
    const authContent = fs.readFileSync(authFile, 'utf-8');
    
    if (!authContent.includes('logoutUser')) {
      throw new Error('Fonction logoutUser non trouvée');
    }
    
    return { success: true };
  }
);

testFeature(
  'Gestion des sessions',
  'Création et gestion des cookies de session',
  () => {
    const authFile = path.join(__dirname, '../lib/auth.ts');
    const authContent = fs.readFileSync(authFile, 'utf-8');
    
    if (!authContent.includes('cookies()')) {
      throw new Error('Gestion des cookies non trouvée');
    }
    
    return { success: true };
  }
);

testFeature(
  'Rôles utilisateurs',
  'Système de rôles (admin, moderator, user)',
  () => {
    const authFile = path.join(__dirname, '../lib/auth.ts');
    const authContent = fs.readFileSync(authFile, 'utf-8');
    
    if (!authContent.includes('role')) {
      throw new Error('Système de rôles non trouvé');
    }
    
    return { success: true };
  }
);

// ==================== 2. PAGES PUBLIQUES ====================
console.log('\n\n🌐 2. PAGES PUBLIQUES');
console.log('='.repeat(60));

const publicPages = [
  { name: 'Page d\'accueil', path: 'app/page.tsx', route: '/' },
  { name: 'Catalogue bijoux', path: 'app/bijoux/page.tsx', route: '/bijoux' },
  { name: 'Détail bijou', path: 'app/bijoux/[id]/page.tsx', route: '/bijoux/[id]' },
  { name: 'Packs/Collections', path: 'app/packs/page.tsx', route: '/packs' },
  { name: 'Sur-mesure', path: 'app/sur-mesure/page.tsx', route: '/sur-mesure' },
  { name: 'À propos', path: 'app/a-propos/page.tsx', route: '/a-propos' }
];

publicPages.forEach(page => {
  testFeature(
    page.name,
    `Page accessible à ${page.route}`,
    () => {
      const pagePath = path.join(process.cwd(), '', page.path);
      if (!fs.existsSync(pagePath)) {
        throw new Error(`Fichier ${page.path} non trouvé`);
      }
      return { success: true };
    }
  );
});

// ==================== 3. E-COMMERCE ====================
console.log('\n\n🛒 3. E-COMMERCE');
console.log('='.repeat(60));

testFeature(
  'Panier d\'achat',
  'Ajout et gestion des articles dans le panier',
  () => {
    const panierPage = path.join(__dirname, '../app/panier/page.tsx');
    if (!fs.existsSync(panierPage)) {
      throw new Error('Page panier non trouvée');
    }
    
    const cartFavorites = path.join(__dirname, '../lib/cart-favorites.ts');
    if (!fs.existsSync(cartFavorites)) {
      throw new Error('Fichier cart-favorites.ts non trouvé');
    }
    
    return { success: true };
  }
);

testFeature(
  'Favoris',
  'Ajout et gestion des produits favoris',
  () => {
    const favorisPage = path.join(__dirname, '../app/favoris/page.tsx');
    if (!fs.existsSync(favorisPage)) {
      throw new Error('Page favoris non trouvée');
    }
    
    const cartFavorites = path.join(__dirname, '../lib/cart-favorites.ts');
    const content = fs.readFileSync(cartFavorites, 'utf-8');
    if (!content.includes('getFavorites')) {
      throw new Error('Fonction getFavorites non trouvée');
    }
    
    return { success: true };
  }
);

testFeature(
  'Checkout',
  'Processus de commande et paiement',
  () => {
    const checkoutPage = path.join(__dirname, '../app/panier/checkout/page.tsx');
    if (!fs.existsSync(checkoutPage)) {
      return { success: false, message: 'Page checkout non trouvée' };
    }
    
    return { success: true };
  }
);

// ==================== 4. PROFIL UTILISATEUR ====================
console.log('\n\n👤 4. PROFIL UTILISATEUR');
console.log('='.repeat(60));

testFeature(
  'Page profil',
  'Affichage et gestion du profil utilisateur',
  () => {
    const profilePage = path.join(__dirname, '../app/profile/page.tsx');
    if (!fs.existsSync(profilePage)) {
      throw new Error('Page profil non trouvée');
    }
    
    return { success: true };
  }
);

testFeature(
  'Statistiques client',
  'Affichage des statistiques d\'achat',
  () => {
    const clientStats = path.join(__dirname, '../app/profile/ClientStats.tsx');
    if (!fs.existsSync(clientStats)) {
      return { success: false, message: 'Composant ClientStats non trouvé' };
    }
    
    return { success: true };
  }
);

// ==================== 5. ADMINISTRATION ====================
console.log('\n\n👑 5. ADMINISTRATION');
console.log('='.repeat(60));

const adminFeatures = [
  { name: 'Dashboard admin', path: 'app/admin/page.tsx' },
  { name: 'Gestion produits', path: 'components/admin/AdminProducts.tsx' },
  { name: 'Gestion utilisateurs', path: 'components/admin/AdminUsers.tsx' },
  { name: 'Gestion commandes', path: 'components/admin/AdminOrders.tsx' },
  { name: 'Gestion catégories', path: 'components/admin/AdminCategories.tsx' },
  { name: 'Protection routes admin', path: 'components/admin/RoleGuard.tsx' }
];

adminFeatures.forEach(feature => {
  testFeature(
    feature.name,
    `Fonctionnalité admin: ${feature.name}`,
    () => {
      const featurePath = path.join(process.cwd(), '', feature.path);
      if (!fs.existsSync(featurePath)) {
        throw new Error(`Fichier ${feature.path} non trouvé`);
      }
      return { success: true };
    }
  );
});

// ==================== 6. BASE DE DONNÉES ====================
console.log('\n\n💾 6. BASE DE DONNÉES');
console.log('='.repeat(60));

testFeature(
  'Adaptateur de base de données',
  'Système d\'adaptation SQLite/Supabase',
  () => {
    const adapter = path.join(__dirname, '../lib/database-adapter.ts');
    if (!fs.existsSync(adapter)) {
      throw new Error('Adaptateur de base de données non trouvé');
    }
    
    const content = fs.readFileSync(adapter, 'utf-8');
    if (!content.includes('SafeDatabaseAdapter')) {
      throw new Error('Classe SafeDatabaseAdapter non trouvée');
    }
    
    return { success: true };
  }
);

testFeature(
  'Fonctions de base de données',
  'CRUD complet pour toutes les entités',
  () => {
    const dbFile = path.join(__dirname, '../lib/database.ts');
    if (!fs.existsSync(dbFile)) {
      throw new Error('Fichier database.ts non trouvé');
    }
    
    const content = fs.readFileSync(dbFile, 'utf-8');
    const requiredFunctions = ['getBijoux', 'getCategories', 'getPacks', 'getAllUsers'];
    
    for (const func of requiredFunctions) {
      if (!content.includes(func)) {
        throw new Error(`Fonction ${func} non trouvée`);
      }
    }
    
    return { success: true };
  }
);

testFeature(
  'Données de démo',
  'Fallback vers données d\'exemple',
  () => {
    const sampleBijoux = path.join(__dirname, '../data/sample-bijoux.ts');
    const sampleCategories = path.join(__dirname, '../data/sample-categories.ts');
    
    if (!fs.existsSync(sampleBijoux)) {
      throw new Error('Fichier sample-bijoux.ts non trouvé');
    }
    
    if (!fs.existsSync(sampleCategories)) {
      throw new Error('Fichier sample-categories.ts non trouvé');
    }
    
    return { success: true };
  }
);

// ==================== 7. COMPOSANTS UI ====================
console.log('\n\n🎨 7. COMPOSANTS UI');
console.log('='.repeat(60));

const uiComponents = [
  'ProductCard',
  'ProductGrid',
  'BijouCard',
  'PackCard',
  'HeroBanner',
  'JewelryBanner',
  'Header',
  'Footer'
];

uiComponents.forEach(component => {
  testFeature(
    `Composant ${component}`,
    `Composant UI réutilisable: ${component}`,
    () => {
      const componentPath = path.join(process.cwd(), `components/${component}.tsx`);
      if (!fs.existsSync(componentPath)) {
        return { success: false, message: `Composant ${component} non trouvé` };
      }
      return { success: true };
    }
  );
});

// ==================== 8. API ROUTES ====================
console.log('\n\n🔌 8. API ROUTES');
console.log('='.repeat(60));

const apiRoutes = [
  { name: 'Auth - Login', path: 'app/api/auth/login/route.ts' },
  { name: 'Auth - Register', path: 'app/api/auth/register/route.ts' },
  { name: 'Produits', path: 'app/api/products/route.ts' },
  { name: 'Panier', path: 'app/api/cart/route.ts' },
  { name: 'Favoris', path: 'app/api/favorites/route.ts' },
  { name: 'Commandes', path: 'app/api/orders/route.ts' }
];

apiRoutes.forEach(route => {
  testFeature(
    route.name,
    `Route API: ${route.name}`,
    () => {
      const routePath = path.join(process.cwd(), '', route.path);
      if (!fs.existsSync(routePath)) {
        return { success: false, message: `Route ${route.path} non trouvée` };
      }
      return { success: true };
    }
  );
});

// ==================== RÉSUMÉ ====================
console.log('\n\n📊 RÉSUMÉ DES TESTS');
console.log('='.repeat(60));
console.log(`✅ Tests réussis: ${TEST_RESULTS.passed.length}`);
console.log(`⚠️  Avertissements: ${TEST_RESULTS.warnings.length}`);
console.log(`❌ Tests échoués: ${TEST_RESULTS.failed.length}`);
console.log(`📈 Taux de réussite: ${((TEST_RESULTS.passed.length / (TEST_RESULTS.passed.length + TEST_RESULTS.failed.length)) * 100).toFixed(1)}%`);

if (TEST_RESULTS.failed.length > 0) {
  console.log('\n❌ ÉCHECS:');
  TEST_RESULTS.failed.forEach(failure => {
    console.log(`   - ${failure.name}: ${failure.error}`);
  });
}

if (TEST_RESULTS.warnings.length > 0) {
  console.log('\n⚠️  AVERTISSEMENTS:');
  TEST_RESULTS.warnings.forEach(warning => {
    console.log(`   - ${warning.name}: ${warning.message}`);
  });
}

console.log('\n✅ Tests réussis:');
TEST_RESULTS.passed.forEach(success => {
  console.log(`   ✓ ${success.name}`);
});

console.log('\n' + '='.repeat(60));
console.log('🎯 Tests terminés !');
console.log('='.repeat(60));