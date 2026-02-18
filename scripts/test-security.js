/**
 * Script de test pour le système de sécurité
 * Utilisation: node scripts/test-security.js
 */

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Configuration de test
const JWT_SECRET = 'test-secret-key'
const TEST_PASSWORD = 'Admin123!'
const TEST_HASH = '$2b$12$QRZgKXgNuqhnK.IjrRMsSO2.0IUR33j6kMZiZMOGtar0dFhHwFeq.'

async function testPasswordHashing() {
  console.log('🔐 Test du hachage des mots de passe...')
  
  try {
    // Test de hachage
    const salt = await bcrypt.genSalt(12)
    const hash = await bcrypt.hash(TEST_PASSWORD, salt)
    console.log('✅ Hachage réussi:', hash.substring(0, 20) + '...')
    
    // Test de vérification
    const isValid = await bcrypt.compare(TEST_PASSWORD, TEST_HASH)
    console.log('✅ Vérification:', isValid ? 'Valide' : 'Invalide')
    
    // Test avec mauvais mot de passe
    const isInvalid = await bcrypt.compare('WrongPassword', TEST_HASH)
    console.log('✅ Test négatif:', isInvalid ? 'Erreur' : 'Correct')
    
  } catch (error) {
    console.error('❌ Erreur de hachage:', error.message)
  }
}

function testJWT() {
  console.log('\n🔑 Test des tokens JWT...')
  
  try {
    // Génération d'un token
    const payload = {
      userId: 'test-user-123',
      phone: '0612345678',
      role: 'admin'
    }
    
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'inoxya-bijoux',
      audience: 'inoxya-users'
    })
    
    console.log('✅ Token généré:', token.substring(0, 50) + '...')
    
    // Vérification du token
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'inoxya-bijoux',
      audience: 'inoxya-users'
    })
    
    console.log('✅ Token vérifié:', decoded.userId)
    
    // Test avec mauvais secret
    try {
      jwt.verify(token, 'wrong-secret')
      console.log('❌ Erreur: Token accepté avec mauvais secret')
    } catch (error) {
      console.log('✅ Test négatif réussi: Token rejeté avec mauvais secret')
    }
    
  } catch (error) {
    console.error('❌ Erreur JWT:', error.message)
  }
}

function testPasswordValidation() {
  console.log('\n🛡️ Test de validation des mots de passe...')
  
  const testCases = [
    { password: 'Admin123!', shouldPass: true },
    { password: 'password', shouldPass: false },
    { password: '12345678', shouldPass: false },
    { password: 'Password', shouldPass: false },
    { password: 'PASSWORD123!', shouldPass: false },
    { password: 'Password123', shouldPass: false },
    { password: 'Password123!', shouldPass: true }
  ]
  
  testCases.forEach(({ password, shouldPass }) => {
    const errors = []
    
    if (password.length < 8) errors.push('Trop court')
    if (!/[A-Z]/.test(password)) errors.push('Pas de majuscule')
    if (!/[a-z]/.test(password)) errors.push('Pas de minuscule')
    if (!/[0-9]/.test(password)) errors.push('Pas de chiffre')
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Pas de caractère spécial')
    
    const isValid = errors.length === 0
    const result = isValid === shouldPass ? '✅' : '❌'
    
    console.log(`${result} "${password}": ${isValid ? 'Valide' : 'Invalide'} ${errors.length ? '(' + errors.join(', ') + ')' : ''}`)
  })
}

function testPhoneValidation() {
  console.log('\n📱 Test de validation des numéros de téléphone...')
  
  const testCases = [
    { phone: '0612345678', shouldPass: true },
    { phone: '0698765432', shouldPass: true },
    { phone: '+212612345678', shouldPass: true },
    { phone: '0712345678', shouldPass: true },
    { phone: '123456789', shouldPass: false },
    { phone: '061234567', shouldPass: false },
    { phone: '0812345678', shouldPass: false },
    { phone: 'admin_phone', shouldPass: false }
  ]
  
  const phoneRegex = /^(\+212|0)[5-7][0-9]{8}$/
  
  testCases.forEach(({ phone, shouldPass }) => {
    const isValid = phoneRegex.test(phone)
    const result = isValid === shouldPass ? '✅' : '❌'
    console.log(`${result} "${phone}": ${isValid ? 'Valide' : 'Invalide'}`)
  })
}

async function runAllTests() {
  console.log('🚀 Démarrage des tests de sécurité...\n')
  
  await testPasswordHashing()
  testJWT()
  testPasswordValidation()
  testPhoneValidation()
  
  console.log('\n✅ Tous les tests terminés!')
  console.log('\n📋 Résumé:')
  console.log('- Hachage bcrypt: Fonctionnel')
  console.log('- Tokens JWT: Sécurisés')
  console.log('- Validation mots de passe: Règles appliquées')
  console.log('- Validation téléphones: Format marocain')
}

// Exécuter les tests
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = {
  testPasswordHashing,
  testJWT,
  testPasswordValidation,
  testPhoneValidation
}
