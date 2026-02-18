/**
 * Script pour générer des mots de passe hachés sécurisés
 * Utilisation: node scripts/generate-hashed-passwords.js
 */

const bcrypt = require('bcryptjs')

async function generateHashedPasswords() {
  console.log('🔐 Génération de mots de passe hachés sécurisés...\n')
  
  const passwords = [
    'Admin123!',
    'User123!',
    'Moderator123!',
    'Test123!',
    'Password123!'
  ]
  
  const rounds = 12
  
  for (const password of passwords) {
    try {
      const salt = await bcrypt.genSalt(rounds)
      const hashedPassword = await bcrypt.hash(password, salt)
      
      console.log(`Mot de passe: ${password}`)
      console.log(`Hash: ${hashedPassword}`)
      console.log(`Rounds: ${rounds}`)
      console.log('---')
    } catch (error) {
      console.error(`Erreur pour ${password}:`, error)
    }
  }
  
  console.log('\n✅ Génération terminée!')
  console.log('\n📋 Instructions:')
  console.log('1. Copiez les hashes dans votre code')
  console.log('2. Utilisez les mots de passe correspondants pour les tests')
  console.log('3. Ne commitez jamais les mots de passe en clair!')
}

// Fonction pour valider un mot de passe
async function validatePassword(plainPassword, hashedPassword) {
  try {
    const isValid = await bcrypt.compare(plainPassword, hashedPassword)
    console.log(`Validation de "${plainPassword}": ${isValid ? '✅ Valide' : '❌ Invalide'}`)
    return isValid
  } catch (error) {
    console.error('Erreur de validation:', error)
    return false
  }
}

// Exécuter le script
if (require.main === module) {
  generateHashedPasswords()
    .then(() => {
      console.log('\n🧪 Test de validation:')
      return validatePassword('Admin123!', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2a')
    })
    .catch(console.error)
}

module.exports = { generateHashedPasswords, validatePassword }
