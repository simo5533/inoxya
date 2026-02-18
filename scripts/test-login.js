#!/usr/bin/env node

/**
 * Script de test de la connexion admin
 * Usage: node scripts/test-login.js
 */

async function testLogin() {
  console.log('🔐 Test de Connexion Admin')
  console.log('==========================\n')
  
  try {
    // Test de la validation du téléphone
    console.log('1. Test de validation du téléphone...')
    
    // Simuler l'import de la fonction de validation
    const { validatePhoneNumber } = await import('../lib/security.js')
    
    const testPhones = [
      'admin_phone',
      '0612345678',
      '0698765432',
      'invalid_phone'
    ]
    
    for (const phone of testPhones) {
      const isValid = validatePhoneNumber(phone)
      console.log(`   ${phone}: ${isValid ? '✅ Valide' : '❌ Invalide'}`)
    }
    
    console.log('\n2. Test de la fonction loginUser...')
    
    // Test avec les identifiants admin
    const { loginUser } = await import('../lib/auth.js')
    
    const result = await loginUser('admin_phone', 'Admin123!')
    
    if (result.success) {
      console.log('   ✅ Connexion admin réussie !')
      console.log(`   Utilisateur: ${result.user.first_name} ${result.user.last_name}`)
      console.log(`   Rôle: ${result.user.role}`)
    } else {
      console.log('   ❌ Échec de la connexion admin')
      console.log(`   Erreur: ${result.error}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }
}

// Exécuter le test
testLogin().catch(console.error)
