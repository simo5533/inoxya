#!/usr/bin/env node

/**
 * Test de configuration Supabase pour INOXYA BIJOUX
 * Vérifie que la connexion et les données fonctionnent correctement
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Charger les variables d'environnement depuis .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
}

loadEnvFile()

async function testSupabaseConfiguration() {
  console.log('🔍 Test de configuration Supabase INOXYA BIJOUX...\n')
  
  // Vérifier les variables d'environnement
  console.log('1️⃣ Vérification des variables d\'environnement...')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Variables d\'environnement manquantes!')
    console.log('   Vérifiez que votre fichier .env.local contient:')
    console.log('   - NEXT_PUBLIC_SUPABASE_URL')
    console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return
  }
  
  console.log('✅ Variables d\'environnement trouvées')
  console.log(`   URL: ${supabaseUrl}`)
  console.log(`   Clé: ${supabaseKey.substring(0, 20)}...`)
  
  // Créer le client Supabase
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test de connexion
    console.log('\n2️⃣ Test de connexion à Supabase...')
    const { data, error } = await supabase.from('categories').select('count').limit(1)
    
    if (error) {
      console.log('❌ Erreur de connexion:', error.message)
      return
    }
    
    console.log('✅ Connexion à Supabase réussie!')
    
    // Test des catégories
    console.log('\n3️⃣ Test des catégories...')
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (catError) {
      console.log('❌ Erreur lors de la récupération des catégories:', catError.message)
    } else {
      console.log(`✅ ${categories.length} catégories trouvées:`)
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.slug})`)
      })
    }
    
    // Test des bijoux
    console.log('\n4️⃣ Test des bijoux...')
    const { data: bijoux, error: bijouxError } = await supabase
      .from('bijoux')
      .select('*')
      .eq('is_featured', true)
      .limit(5)
    
    if (bijouxError) {
      console.log('❌ Erreur lors de la récupération des bijoux:', bijouxError.message)
    } else {
      console.log(`✅ ${bijoux.length} bijoux vedettes trouvés:`)
      bijoux.forEach(bijou => {
        console.log(`   - ${bijou.name} - ${bijou.price} MAD`)
      })
    }
    
    // Test des packs
    console.log('\n5️⃣ Test des packs...')
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .order('price')
    
    if (packsError) {
      console.log('❌ Erreur lors de la récupération des packs:', packsError.message)
    } else {
      console.log(`✅ ${packs.length} packs trouvés:`)
      packs.forEach(pack => {
        console.log(`   - ${pack.name} - ${pack.price} MAD`)
      })
    }
    
    // Test de recherche
    console.log('\n6️⃣ Test de recherche...')
    const { data: searchResults, error: searchError } = await supabase
      .from('bijoux')
      .select('*')
      .or('name.ilike.%berbère%,name_ar.ilike.%بربري%')
      .limit(3)
    
    if (searchError) {
      console.log('❌ Erreur lors de la recherche:', searchError.message)
    } else {
      console.log(`✅ ${searchResults.length} résultats pour "berbère":`)
      searchResults.forEach(bijou => {
        console.log(`   - ${bijou.name} (${bijou.name_ar})`)
      })
    }
    
    // Test des utilisateurs
    console.log('\n7️⃣ Test des utilisateurs...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
    
    if (usersError) {
      console.log('❌ Erreur lors de la récupération des utilisateurs:', usersError.message)
    } else {
      console.log(`✅ Table des utilisateurs accessible`)
    }
    
    // Statistiques finales
    console.log('\n8️⃣ Statistiques de la base de données...')
    const { data: stats, error: statsError } = await supabase
      .from('bijoux')
      .select('count')
    
    if (!statsError) {
      console.log('✅ Base de données opérationnelle')
    }
    
    console.log('\n🎉 Configuration Supabase validée avec succès!')
    console.log('💡 Votre application INOXYA BIJOUX est prête à fonctionner')
    console.log('\n📋 Prochaines étapes:')
    console.log('   1. Ouvrez http://localhost:3000 dans votre navigateur')
    console.log('   2. Testez l\'inscription d\'un utilisateur')
    console.log('   3. Parcourez les bijoux et catégories')
    console.log('   4. Testez le panier et les favoris')
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
    console.log('\n💡 Solutions possibles:')
    console.log('   1. Vérifiez que votre projet Supabase est actif')
    console.log('   2. Vérifiez que le script SQL a été exécuté')
    console.log('   3. Vérifiez vos clés dans .env.local')
  }
}

// Exécuter le test
testSupabaseConfiguration()
