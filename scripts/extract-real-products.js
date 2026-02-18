/**
 * Script pour extraire tous les produits réels de la base de données SQLite
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db');

console.log('🔍 EXTRACTION DES PRODUITS RÉELS DE LA BASE DE DONNÉES SQLITE\n');
console.log('='.repeat(70));
console.log('');

// Vérifier que la base de données existe
if (!fs.existsSync(dbPath)) {
  console.error('❌ Base de données non trouvée:', dbPath);
  console.log('\n💡 La base de données sera créée automatiquement lors de la première utilisation.');
  process.exit(1);
}

try {
  // Connexion à la base de données
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  console.log('✅ Connexion à la base de données réussie\n');

  // Vérifier les tables
  const tables = db.prepare(`
    SELECT name 
    FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();

  console.log('📊 Tables disponibles:');
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });
  console.log('');

  // Extraire tous les produits
  console.log('💎 PRODUITS (BIJOUX) RÉELS:');
  console.log('='.repeat(70));
  
  const bijoux = db.prepare(`
    SELECT 
      id,
      name,
      name_ar,
      description,
      price,
      original_price,
      image_url,
      images,
      category,
      stock,
      is_active as is_available,
      created_at,
      updated_at
    FROM products
    ORDER BY created_at DESC
  `).all();

  if (bijoux.length === 0) {
    console.log('⚠️  Aucun produit trouvé dans la base de données');
  } else {
    console.log(`\n📦 Total: ${bijoux.length} produit(s)\n`);
    
    bijoux.forEach((bijou, index) => {
      console.log(`\n${index + 1}. ${bijou.name}`);
      console.log(`   ID: ${bijou.id}`);
      if (bijou.name_ar) {
        console.log(`   Nom (AR): ${bijou.name_ar}`);
      }
      if (bijou.description) {
        console.log(`   Description: ${bijou.description.substring(0, 100)}...`);
      }
      console.log(`   Prix: ${bijou.price} MAD`);
      if (bijou.original_price) {
        console.log(`   Prix original: ${bijou.original_price} MAD`);
        const reduction = Math.round(((bijou.original_price - bijou.price) / bijou.original_price) * 100);
        console.log(`   Réduction: -${reduction}%`);
      }
      console.log(`   Image: ${bijou.image_url || 'N/A'}`);
      console.log(`   Catégorie: ${bijou.category || 'N/A'}`);
      console.log(`   Stock: ${bijou.stock || 0}`);
      console.log(`   Disponible: ${bijou.is_available ? '✅' : '❌'}`);
      console.log(`   Créé le: ${bijou.created_at}`);
    });
  }

  // Extraire les catégories
  console.log('\n\n📂 CATÉGORIES:');
  console.log('='.repeat(70));
  
  const categories = db.prepare(`
    SELECT 
      id,
      name,
      slug,
      description,
      image_url,
      created_at
    FROM categories
    ORDER BY name
  `).all();

  if (categories.length === 0) {
    console.log('⚠️  Aucune catégorie trouvée');
  } else {
    console.log(`\n📦 Total: ${categories.length} catégorie(s)\n`);
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.slug})`);
      if (cat.description) {
        console.log(`   ${cat.description.substring(0, 80)}...`);
      }
    });
  }

  // Extraire les packs
  console.log('\n\n📦 PACKS/COLLECTIONS:');
  console.log('='.repeat(70));
  
  const packs = db.prepare(`
    SELECT 
      id,
      name,
      slug,
      description,
      price,
      image_url,
      is_featured,
      created_at
    FROM packs
    ORDER BY created_at DESC
  `).all();

  if (packs.length === 0) {
    console.log('⚠️  Aucun pack trouvé');
  } else {
    console.log(`\n📦 Total: ${packs.length} pack(s)\n`);
    packs.forEach((pack, index) => {
      console.log(`${index + 1}. ${pack.name}`);
      console.log(`   ID: ${pack.id}`);
      console.log(`   Prix: ${pack.price} MAD`);
      console.log(`   Vedette: ${pack.is_featured ? '⭐' : '❌'}`);
    });
  }

  // Statistiques globales
  console.log('\n\n📊 STATISTIQUES GLOBALES:');
  console.log('='.repeat(70));
  
  const stats = {
    totalBijoux: bijoux.length,
    bijouxDisponibles: bijoux.filter(b => b.is_available).length,
    totalCategories: categories.length,
    totalPacks: packs.length,
    prixMoyen: bijoux.length > 0 ? Math.round(bijoux.reduce((sum, b) => sum + b.price, 0) / bijoux.length) : 0,
    prixMin: bijoux.length > 0 ? Math.min(...bijoux.map(b => b.price)) : 0,
    prixMax: bijoux.length > 0 ? Math.max(...bijoux.map(b => b.price)) : 0,
  };

  console.log(`\n💎 Produits:`);
  console.log(`   Total: ${stats.totalBijoux}`);
  console.log(`   Disponibles: ${stats.bijouxDisponibles}`);
  console.log(`\n📂 Catégories: ${stats.totalCategories}`);
  console.log(`\n📦 Packs: ${stats.totalPacks}`);
  console.log(`\n💰 Prix:`);
  console.log(`   Moyen: ${stats.prixMoyen} MAD`);
  console.log(`   Min: ${stats.prixMin} MAD`);
  console.log(`   Max: ${stats.prixMax} MAD`);

  // Sauvegarder dans un fichier JSON
  const outputPath = path.join(process.cwd(), 'data', 'produits-reels.json');
  const outputData = {
    date_extraction: new Date().toISOString(),
    statistiques: stats,
    bijoux: bijoux,
    categories: categories,
    packs: packs
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`\n\n💾 Données sauvegardées dans: ${outputPath}`);

  db.close();
  console.log('\n✅ Extraction terminée avec succès!\n');

} catch (error) {
  console.error('❌ Erreur lors de l\'extraction:', error.message);
  console.error(error.stack);
  process.exit(1);
}