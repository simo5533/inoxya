/**
 * Script de seed PostgreSQL
 * PHASE 5 - Database & Deployment
 * 
 * Usage: npx tsx scripts/seed-postgres.ts
 */

import { Pool } from 'pg'
import * as bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config()

// PROTECTION PRODUCTION: Empêcher l'exécution en production
const isProduction = process.env['NODE_ENV'] === 'production'
if (isProduction) {
  console.error('❌ ERREUR: Ce script ne peut pas être exécuté en production!')
  console.error('   NODE_ENV=production détecté. Arrêt immédiat.')
  process.exit(1)
}

const pgPool = new Pool({
  host: process.env['DB_HOST'] || process.env['DATABASE_URL']?.match(/@([^:]+)/)?.[1] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || process.env['DATABASE_URL']?.match(/:(\d+)\//)?.[1] || '5432'),
  database: process.env['DB_NAME'] || process.env['DATABASE_URL']?.match(/\/([^?]+)/)?.[1] || 'inoxya_bijoux',
  user: process.env['DB_USER'] || process.env['DATABASE_URL']?.match(/:\/\/([^:]+):/)?.[1] || 'inoxya_user',
  password: process.env['DB_PASSWORD'] || process.env['DATABASE_URL']?.match(/:[^:]+:([^@]+)@/)?.[1] || 'inoxya_password_2024',
})

async function seedDatabase() {
  console.log('🌱 Seed de la base de données PostgreSQL INOXYA BIJOUX\n')
  
  try {
    // Vérifier la connexion
    await pgPool.query('SELECT NOW()')
    console.log('✅ Connexion PostgreSQL réussie\n')
  } catch (error: any) {
    console.error('❌ Erreur de connexion PostgreSQL:', error.message)
    console.error('\n💡 Assurez-vous que PostgreSQL est démarré:')
    console.error('   npm run db:start')
    process.exit(1)
  }
  
  // Vérifier si des données existent déjà
  const packCount = await pgPool.query('SELECT COUNT(*) as count FROM packs')
  const productCount = await pgPool.query('SELECT COUNT(*) as count FROM products')
  
  if (parseInt(packCount.rows[0].count) > 0 || parseInt(productCount.rows[0].count) > 0) {
    console.log(`⚠️  Des données existent déjà:`)
    console.log(`   - Packs: ${packCount.rows[0].count}`)
    console.log(`   - Produits: ${productCount.rows[0].count}`)
    console.log(`\n💡 Pour réinitialiser, supprimez les données manuellement\n`)
    process.exit(0)
  }
  
  // 1. Insérer les catégories
  console.log('📁 Insertion des catégories...')
  await pgPool.query(`
    INSERT INTO categories (name, slug, description, image_url) VALUES
    ('Bagues', 'bagues', 'Collection de bagues en acier inoxydable', '/images/categories/bagues-category.jpeg'),
    ('Colliers', 'colliers', 'Colliers élégants et durables', '/images/categories/colliers-category.jpeg'),
    ('Bracelets', 'bracelets', 'Bracelets modernes et résistants', '/images/categories/bracelets-category.jpeg'),
    ('Boucles d''oreilles', 'boucles-oreilles', 'Boucles d''oreilles hypoallergéniques', '/images/categories/boucles-oreilles-category.jpeg'),
    ('Parures', 'parures', 'Ensembles coordonnés de bijoux', '/images/categories/bagues-category.jpeg'),
    ('Broches', 'broches', 'Broches décoratives et élégantes', '/images/categories/broches-category.jpeg')
    ON CONFLICT (slug) DO NOTHING
  `)
  console.log('   ✅ 6 catégories insérées\n')
  
  // 2. Insérer les utilisateurs
  console.log('👥 Insertion des utilisateurs...')
  const adminPassword = await bcrypt.hash('Admin123!', 12)
  const userPassword = await bcrypt.hash('password', 12)
  
  await pgPool.query(`
    INSERT INTO users (phone, password_hash, first_name, last_name, role) VALUES
    ('admin', $1, 'Admin', 'Principal', 'admin'),
    ('0698765432', $2, 'Modérateur', 'Test', 'moderator'),
    ('0612345678', $2, 'Utilisateur', 'Standard', 'user')
    ON CONFLICT (phone) DO NOTHING
  `, [adminPassword, userPassword])
  console.log('   ✅ 3 utilisateurs insérés\n')
  
  // 3. Insérer les produits
  console.log('💍 Insertion des produits...')
  await pgPool.query(`
    INSERT INTO products (name, name_ar, description, price, original_price, category, stock, is_active, image_url) VALUES
    ('Bague Berbère Or 18K', 'خاتم بربري ذهبي', 'Magnifique bague berbère en or 18 carats avec motifs traditionnels marocains.', 2999.00, 3999.00, 'Bagues', 5, true, '/images/bijoux/bagues/bague-berbere-or-1.jpg'),
    ('Collier Filigrane Argent', 'قلادة فضية مزركشة', 'Collier en argent sterling avec technique de filigrane traditionnel.', 1890.00, null, 'Colliers', 8, true, '/images/bijoux/colliers/collier-filigrane-1.jpg'),
    ('Bracelet Khomsa Protection', 'سوار خميسة الحماية', 'Bracelet en argent avec symbole de la main de Fatma pour la protection.', 450.00, 550.00, 'Bracelets', 12, true, '/images/bijoux/bracelets/bracelet-khomsa-1.jpg'),
    ('Boucles d''oreilles Étoiles', 'أقراط نجوم', 'Boucles d''oreilles en argent avec motifs d''étoiles berbères.', 320.00, null, 'Boucles d''oreilles', 15, true, '/images/bijoux/boucles-oreilles/boucles-etoiles-1.jpg'),
    ('Bague Élégance Simple', 'خاتم أنيق بسيط', 'Bague élégante en acier inoxydable, design minimaliste.', 250.00, 300.00, 'Bagues', 20, true, '/images/bijoux/bagues/bague-elegance-1.jpg'),
    ('Collier Perles Traditionnel', 'قلادة لؤلؤ تقليدي', 'Collier de perles avec pendentif berbère traditionnel.', 890.00, 1200.00, 'Colliers', 10, true, '/images/bijoux/colliers/collier-perles-1.jpg'),
    ('Bracelet Tressé Moderne', 'سوار مضفر عصري', 'Bracelet tressé en acier inoxydable, style moderne.', 180.00, null, 'Bracelets', 25, true, '/images/bijoux/bracelets/bracelet-tresse-1.jpg'),
    ('Boucles d''oreilles Géométriques', 'أقراط هندسية', 'Boucles d''oreilles avec motifs géométriques berbères.', 220.00, 280.00, 'Boucles d''oreilles', 18, true, '/images/bijoux/boucles-oreilles/boucles-geometriques-1.jpg'),
    ('Parure Complète Berbère', 'طقم بربري كامل', 'Parure complète avec bague, collier et boucles d''oreilles.', 3500.00, 4500.00, 'Parures', 3, true, '/images/bijoux/parures/parure-berbere-1.jpg')
    ON CONFLICT DO NOTHING
  `)
  console.log('   ✅ 9 produits insérés\n')
  
  // 4. Insérer les packs
  console.log('📦 Insertion des packs...')
  await pgPool.query(`
    INSERT INTO packs (name, slug, description, price, image_url, is_featured) VALUES
    ('Pack Élégance Berbère', 'pack-elegance-berbere', 'Collection complète de bijoux berbères élégants.', 2500.00, '/images/packs/pack-elegance-berbere.jpg', true),
    ('Pack Moderne Chic', 'pack-moderne-chic', 'Bijoux modernes pour un style contemporain.', 1800.00, '/images/packs/pack-moderne-chic.jpg', false),
    ('Pack Mariée Royale', 'pack-mariee-royale', 'Parure de mariage complète en or et argent.', 5500.00, '/images/packs/pack-mariee-royale.jpg', true),
    ('Pack Quotidien Premium', 'pack-quotidien-premium', 'Bijoux du quotidien de qualité premium.', 1200.00, '/images/packs/pack-quotidien-premium.jpg', false)
    ON CONFLICT (slug) DO NOTHING
  `)
  console.log('   ✅ 4 packs insérés\n')
  
  // Résumé
  const finalPackCount = await pgPool.query('SELECT COUNT(*) as count FROM packs')
  const finalProductCount = await pgPool.query('SELECT COUNT(*) as count FROM products')
  const finalCategoryCount = await pgPool.query('SELECT COUNT(*) as count FROM categories')
  const finalUserCount = await pgPool.query('SELECT COUNT(*) as count FROM users')
  
  console.log('📊 Résumé du seed:')
  console.log(`   ✅ Catégories: ${finalCategoryCount.rows[0].count}`)
  console.log(`   ✅ Utilisateurs: ${finalUserCount.rows[0].count}`)
  console.log(`   ✅ Produits: ${finalProductCount.rows[0].count}`)
  console.log(`   ✅ Packs: ${finalPackCount.rows[0].count}`)
  console.log('\n🎉 Seed terminé avec succès!')
  console.log('\n💡 Comptes créés:')
  console.log('   - Admin: phone=admin, password=Admin123!')
  console.log('   - Modérateur: phone=0698765432, password=password')
  console.log('   - Utilisateur: phone=0612345678, password=password\n')
  
  await pgPool.end()
}

seedDatabase().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

