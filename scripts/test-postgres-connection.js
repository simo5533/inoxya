/**
 * Script de test de connexion PostgreSQL
 * Utilise DATABASE_URL pour tester la connexion
 */

const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL non défini!');
  console.log('');
  console.log('Pour tester:');
  console.log('  DATABASE_URL="postgresql://..." node scripts/test-postgres-connection.js');
  process.exit(1);
}

console.log('🔍 Test de connexion PostgreSQL...');
console.log('DATABASE_URL:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Masquer le mot de passe
console.log('');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function testConnection() {
  try {
    // Test 1: Connexion basique
    console.log('1️⃣ Test de connexion...');
    const result1 = await pool.query('SELECT 1 as test');
    console.log('   ✅ Connexion réussie:', result1.rows[0]);
    console.log('');

    // Test 2: Vérifier les tables
    console.log('2️⃣ Vérification des tables...');
    const result2 = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = result2.rows.map(row => row.table_name);
    console.log(`   📊 Tables trouvées: ${tables.length}`);
    
    const requiredTables = [
      'users',
      'categories',
      'products',
      'bijoux',
      'packs',
      'orders',
      'order_items',
      'cart_items',
      'favorites',
      'payments',
      'notifications',
      'user_sessions',
      'custom_requests'
    ];
    
    console.log('');
    console.log('   Tables requises:');
    requiredTables.forEach(table => {
      const exists = tables.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });
    
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    if (missingTables.length > 0) {
      console.log('');
      console.log('   ⚠️  Tables manquantes:', missingTables.join(', '));
      console.log('   💡 Solution: Exécutez scripts/neon-setup-complete.sql dans Neon SQL Editor');
    } else {
      console.log('');
      console.log('   ✅ Toutes les tables requises existent!');
    }
    
    console.log('');

    // Test 3: Vérifier les données
    console.log('3️⃣ Vérification des données...');
    
    const [usersCount, categoriesCount, productsCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM categories'),
      pool.query('SELECT COUNT(*) as count FROM products')
    ]);
    
    console.log(`   👥 Users: ${usersCount.rows[0].count}`);
    console.log(`   📁 Categories: ${categoriesCount.rows[0].count}`);
    console.log(`   🛍️  Products: ${productsCount.rows[0].count}`);
    console.log('');

    console.log('✅ Tous les tests réussis!');
    console.log('');
    console.log('💡 Si les tables manquent, exécutez:');
    console.log('   scripts/neon-setup-complete.sql dans Neon SQL Editor');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('');
    console.error('Détails:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();

