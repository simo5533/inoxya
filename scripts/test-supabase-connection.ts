/**
 * Script de test de connexion Supabase
 * Vérifie que la connexion fonctionne et que les produits sont accessibles
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables manquantes dans .env.local:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

console.log('🔍 Test de connexion Supabase...\n')
console.log('📋 Configuration:')
console.log('   URL:', supabaseUrl)
console.log('   Key:', supabaseKey.substring(0, 20) + '...\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test 1: Connexion de base
    console.log('1️⃣ Test de connexion...')
    const { error: testError } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('   ❌ Erreur:', testError.message)
      return false
    }
    console.log('   ✅ Connexion réussie\n')

    // Test 2: Compter les produits
    console.log('2️⃣ Comptage des produits...')
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    if (countError) {
      console.error('   ❌ Erreur:', countError.message)
      return false
    }
    console.log(`   ✅ ${count || 0} produits actifs trouvés\n`)

    // Test 3: Récupérer quelques produits avec images
    console.log('3️⃣ Récupération de produits avec images...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, image_url, images, is_active')
      .eq('is_active', true)
      .limit(5)
    
    if (productsError) {
      console.error('   ❌ Erreur:', productsError.message)
      return false
    }
    
    if (!products || products.length === 0) {
      console.warn('   ⚠️  Aucun produit trouvé')
      return false
    }
    
    console.log(`   ✅ ${products.length} produits récupérés:`)
    products.forEach((p: any, i: number) => {
      console.log(`      ${i + 1}. ${p.name}`)
      console.log(`         Image URL: ${p.image_url || '(aucune)'}`)
      if (p.images) {
        try {
          const images = typeof p.images === 'string' ? JSON.parse(p.images) : p.images
          console.log(`         Images: ${Array.isArray(images) ? images.length : 0} image(s)`)
        } catch {
          console.log(`         Images: (erreur parsing)`)
        }
      }
    })
    console.log('')

    // Test 4: Vérifier les catégories
    console.log('4️⃣ Vérification des catégories...')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(10)
    
    if (categoriesError) {
      console.error('   ❌ Erreur:', categoriesError.message)
    } else {
      console.log(`   ✅ ${categories?.length || 0} catégories trouvées`)
      if (categories && categories.length > 0) {
        categories.forEach((c: any) => {
          console.log(`      - ${c.name} (${c.slug})`)
        })
      }
    }
    console.log('')

    // Test 5: Vérifier les packs
    console.log('5️⃣ Vérification des packs...')
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('id, name, slug')
      .limit(10)
    
    if (packsError) {
      console.error('   ❌ Erreur:', packsError.message)
    } else {
      console.log(`   ✅ ${packs?.length || 0} packs trouvés`)
      if (packs && packs.length > 0) {
        packs.forEach((p: any) => {
          console.log(`      - ${p.name} (${p.slug})`)
        })
      }
    }
    console.log('')

    console.log('🎉 Tous les tests sont passés avec succès!')
    console.log('\n✅ Supabase est correctement configuré et accessible.')
    return true

  } catch (error: any) {
    console.error('❌ Erreur lors du test:', error.message)
    console.error('   Stack:', error.stack)
    return false
  }
}

testConnection()
  .then((success) => {
    if (!success) {
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

