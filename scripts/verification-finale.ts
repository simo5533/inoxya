/**
 * Vérification finale avant déploiement Vercel
 * Teste la connexion Supabase et vérifie que tout fonctionne
 */

import { createClient } from '@supabase/supabase-js'
import { getAllBijoux, getBijouxVedettes } from '../lib/database'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

async function verificationFinale() {
  console.log('🔍 VÉRIFICATION FINALE AVANT DÉPLOIEMENT\n')
  console.log('='.repeat(60))
  
  let allTestsPassed = true
  
  // 1. Vérification des variables
  console.log('\n1️⃣ VÉRIFICATION DES VARIABLES\n')
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables Supabase manquantes !')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌')
    allTestsPassed = false
  } else {
    console.log('   ✅ NEXT_PUBLIC_SUPABASE_URL: Configurée')
    console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY: Configurée')
  }
  
  if (!allTestsPassed) {
    console.error('\n❌ Vérification échouée. Configurez les variables d\'environnement.')
    process.exit(1)
  }
  
  // 2. Test de connexion Supabase directe
  console.log('\n2️⃣ TEST DE CONNEXION SUPABASE DIRECTE\n')
  const supabase = createClient(supabaseUrl!, supabaseKey!)
  
  try {
    const { data, error } = await supabase.from('products').select('id, name, image_url').limit(5)
    if (error) throw error
    
    console.log('   ✅ Connexion Supabase réussie')
    console.log(`   ✅ ${data?.length || 0} produits récupérés`)
    
    if (data && data.length > 0) {
      console.log('\n   📦 Exemples de produits avec images:')
      data.forEach((p, i) => {
        const img = p.image_url || '(aucune)'
        console.log(`      ${i + 1}. ${p.name} - Image: ${img}`)
      })
    }
  } catch (error: any) {
    console.error('   ❌ Erreur de connexion:', error.message)
    allTestsPassed = false
  }
  
  // 3. Test via getAllBijoux (utilise l'adapter)
  console.log('\n3️⃣ TEST VIA getAllBijoux (ADAPTER)\n')
  try {
    const products = await getAllBijoux()
    console.log(`   ✅ ${products.length} produits récupérés via adapter`)
    
    const productsWithImages = products.filter(p => {
      const img = p.image_url || p.main_image
      return img && img !== '/placeholder.svg' && !img.includes('C:\\') && !img.includes('D:\\')
    })
    
    console.log(`   ✅ ${productsWithImages.length}/${products.length} produits avec images valides`)
    
    if (products.length > 0) {
      console.log('\n   📦 Exemples:')
      products.slice(0, 3).forEach((p, i) => {
        const img = p.image_url || p.main_image || '(aucune)'
        console.log(`      ${i + 1}. ${p.name} - ${img}`)
      })
    }
  } catch (error: any) {
    console.error('   ❌ Erreur getAllBijoux:', error.message)
    allTestsPassed = false
  }
  
  // 4. Test getBijouxVedettes
  console.log('\n4️⃣ TEST getBijouxVedettes\n')
  try {
    const vedettes = await getBijouxVedettes(5)
    console.log(`   ✅ ${vedettes.length} produits vedettes récupérés`)
    
    if (vedettes.length > 0) {
      console.log('\n   ⭐ Produits vedettes:')
      vedettes.slice(0, 3).forEach((p, i) => {
        const img = p.image_url || p.main_image || '(aucune)'
        console.log(`      ${i + 1}. ${p.name} - ${img}`)
      })
    }
  } catch (error: any) {
    console.error('   ❌ Erreur getBijouxVedettes:', error.message)
    allTestsPassed = false
  }
  
  // 5. Vérification des images
  console.log('\n5️⃣ VÉRIFICATION DES IMAGES\n')
  try {
    const { data: productsWithImages } = await supabase
      .from('products')
      .select('id, name, image_url')
      .not('image_url', 'is', null)
      .limit(10)
    
    if (productsWithImages && productsWithImages.length > 0) {
      console.log(`   ✅ ${productsWithImages.length} produits avec image_url dans Supabase`)
      
      const validImages = productsWithImages.filter(p => {
        const img = p.image_url
        return img && 
               img.startsWith('/') && 
               !img.includes('C:\\') && 
               !img.includes('D:\\') &&
               img !== '/placeholder.svg'
      })
      
      console.log(`   ✅ ${validImages.length}/${productsWithImages.length} images avec chemins valides`)
      
      if (validImages.length < productsWithImages.length) {
        console.warn('   ⚠️  Certaines images ont des chemins invalides')
      }
    } else {
      console.warn('   ⚠️  Aucun produit avec image_url trouvé')
    }
  } catch (error: any) {
    console.error('   ❌ Erreur vérification images:', error.message)
    allTestsPassed = false
  }
  
  // Rapport final
  console.log('\n' + '='.repeat(60))
  if (allTestsPassed) {
    console.log('\n✅ TOUS LES TESTS SONT PASSÉS !\n')
    console.log('🚀 PRÊT POUR VERCEL !\n')
    console.log('Variables à vérifier sur Vercel:')
    console.log('   1. NEXT_PUBLIC_SUPABASE_URL')
    console.log('   2. SUPABASE_SERVICE_ROLE_KEY')
    console.log('   3. NEXT_PUBLIC_SUPABASE_ANON_KEY\n')
    console.log('Redéployez: vercel --prod --force --yes\n')
  } else {
    console.error('\n❌ CERTAINS TESTS ONT ÉCHOUÉ\n')
    console.error('Corrigez les erreurs avant de déployer.\n')
    process.exit(1)
  }
}

verificationFinale()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

