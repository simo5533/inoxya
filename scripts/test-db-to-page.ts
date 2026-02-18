#!/usr/bin/env node
/**
 * Script de test pour vérifier la liaison complète entre la DB et la page produits
 */

import { getAllBijoux } from '../lib/database'
import { forceConnection, initSqlJsAsync } from '../lib/sqlite'

async function testDbToPage() {
  console.log('🔍 TEST DE LIAISON BASE DE DONNÉES → PAGE PRODUITS\n')
  console.log('='.repeat(80))

  // 1. Tester la connexion
  console.log('\n1️⃣ TEST DE CONNEXION\n')
  console.log('-'.repeat(80))
  
  let isConnected = forceConnection()
  console.log(`forceConnection(): ${isConnected ? '✅ OK' : '❌ ÉCHEC'}`)
  
  if (!isConnected) {
    console.log('Tentative d\'initialisation sql.js...')
    isConnected = await initSqlJsAsync()
    console.log(`initSqlJsAsync(): ${isConnected ? '✅ OK' : '❌ ÉCHEC'}`)
    
    if (isConnected) {
      isConnected = forceConnection()
      console.log(`forceConnection() après init: ${isConnected ? '✅ OK' : '❌ ÉCHEC'}`)
    }
  }
  
  // 2. Tester la récupération des produits
  console.log('\n2️⃣ RÉCUPÉRATION DES PRODUITS\n')
  console.log('-'.repeat(80))
  
  try {
    const products = await getAllBijoux()
    console.log(`✅ getAllBijoux() réussi: ${products?.length || 0} produit(s)`)
    
    if (products && products.length > 0) {
      console.log('\n📋 DÉTAILS DU PREMIER PRODUIT:\n')
      const firstProduct = products[0]
      if (firstProduct) {
        console.log(`  ID: ${firstProduct.id}`)
        console.log(`  Nom: ${firstProduct.name}`)
        console.log(`  Prix: ${firstProduct.price} MAD`)
        console.log(`  Image URL: ${firstProduct.image_url || 'N/A'}`)
        console.log(`  Main Image: ${firstProduct.main_image || 'N/A'}`)
        console.log(`  Images (type): ${typeof firstProduct.images}`)
        console.log(`  Images (array?): ${Array.isArray(firstProduct.images)}`)
        console.log(`  Is Available: ${firstProduct.is_available}`)
        console.log(`  Category ID: ${firstProduct.category_id || 'N/A'}`)
        
        // Vérifier le format
        console.log('\n✅ VÉRIFICATION DU FORMAT:\n')
        const checks = {
          'ID est string': typeof firstProduct.id === 'string',
          'Nom existe': !!firstProduct.name,
          'Prix est number': typeof firstProduct.price === 'number',
          'Image URL existe': !!(firstProduct.image_url || firstProduct.main_image),
          'Is Available est boolean': typeof firstProduct.is_available === 'boolean',
          'Category ID existe': !!firstProduct.category_id
        }
      
        Object.entries(checks).forEach(([check, result]) => {
          console.log(`  ${result ? '✅' : '❌'} ${check}`)
        })
      }
      
      // Vérifier les produits invalides
      const invalidProducts = products.filter((p: any) => 
        !p || !p.id || !p.name || !p.price || p.price <= 0
      )
      
      if (invalidProducts.length > 0) {
        console.log(`\n⚠️  ${invalidProducts.length} produit(s) invalide(s) détecté(s):`)
        invalidProducts.slice(0, 5).forEach((p: any, idx: number) => {
          console.log(`  ${idx + 1}. ID: ${p?.id || 'N/A'}, Nom: ${p?.name || 'N/A'}, Prix: ${p?.price || 'N/A'}`)
        })
      } else {
        console.log('\n✅ Tous les produits ont un format valide')
      }
    } else {
      console.log('❌ Aucun produit récupéré!')
    }
    
    // 3. Test de format pour ProductCard
    console.log('\n3️⃣ TEST DE COMPATIBILITÉ AVEC ProductCard\n')
    console.log('-'.repeat(80))
    
    if (products && products.length > 0) {
      const sampleProduct = products[0]
      if (sampleProduct) {
        const requiredFields = ['id', 'name', 'price', 'image_url', 'is_available']
        const optionalFields = ['main_image', 'images', 'category_id', 'rating', 'reviews_count']
        
        console.log('Champs requis:')
        requiredFields.forEach(field => {
          const exists = field in sampleProduct
          const hasValue = (sampleProduct as any)[field] !== undefined && 
                          (sampleProduct as any)[field] !== null
          console.log(`  ${exists && hasValue ? '✅' : '❌'} ${field}: ${exists ? 'existe' : 'manquant'} ${hasValue ? 'avec valeur' : 'sans valeur'}`)
        })
        
        console.log('\nChamps optionnels:')
        optionalFields.forEach(field => {
          const exists = field in sampleProduct
          console.log(`  ${exists ? '✅' : '⚠️'} ${field}: ${exists ? 'présent' : 'absent'}`)
        })
      }
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 RÉSUMÉ')
    console.log('='.repeat(80))
    console.log(`Connexion DB: ${isConnected ? '✅ OK' : '❌ ÉCHEC'}`)
    console.log(`Produits récupérés: ${products?.length || 0}`)
    console.log(`Produits valides: ${products ? products.filter((p: any) => p && p.id && p.name && p.price > 0).length : 0}`)
    console.log(`Prêt pour affichage: ${products && products.length > 0 ? '✅ OUI' : '❌ NON'}`)
    
  } catch (error: any) {
    console.error('\n❌ ERREUR lors de la récupération:', error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
  }
}

testDbToPage()

