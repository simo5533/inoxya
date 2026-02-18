#!/usr/bin/env node

/**
 * Script pour vérifier si l'utilisateur admin peut se connecter
 */

const initSqlJs = require('sql.js')
const fs = require('fs')
const bcrypt = require('bcryptjs')
const path = require('path')

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')

async function verifyAdmin() {
  try {
    console.log('🔍 Vérification de l\'utilisateur admin...\n')
    
    // Lire la base de données avec sql.js
    const fileBuffer = fs.readFileSync(dbPath)
    const SQL = await initSqlJs()
    const db = new SQL.Database(fileBuffer)
    
    // Vérifier les utilisateurs admin
    const result = db.exec("SELECT id, phone, password_hash, first_name, last_name, role FROM users WHERE role = 'admin'")
    
    if (result.length === 0 || result[0].values.length === 0) {
      console.log('❌ Aucun utilisateur admin trouvé')
      return
    }
    
    console.log('✅ Utilisateurs admin trouvés:')
    result[0].values.forEach(row => {
      console.log(`   - ${row[1]} (${row[3]} ${row[4]})`)
    })
    
    // Tester le mot de passe
    const testPhone = '0612345678'
    const testPassword = 'Admin123!'
    
    const userResult = db.exec(`SELECT id, phone, password_hash, first_name, last_name, role FROM users WHERE phone = '${testPhone}'`)
    
    if (userResult.length === 0 || userResult[0].values.length === 0) {
      console.log(`\n❌ Utilisateur ${testPhone} non trouvé`)
      return
    }
    
    const user = userResult[0].values[0]
    const storedHash = user[2]
    
    console.log(`\n🔐 Test du mot de passe pour ${testPhone}:`)
    console.log(`   Hash stocké: ${storedHash.substring(0, 30)}...`)
    
    const isValid = bcrypt.compareSync(testPassword, storedHash)
    
    if (isValid) {
      console.log('✅ Mot de passe valide!')
      console.log('\n💡 Le problème vient probablement du serveur qui ne peut pas accéder à la base de données')
      console.log('   (better-sqlite3 n\'est pas compilé)')
      console.log('\n📋 Solutions:')
      console.log('   1. Redémarrez le serveur: npm run dev')
      console.log('   2. Vérifiez que better-sqlite3 est compilé')
      console.log('   3. Ou utilisez le fallback si la DB n\'est pas accessible')
    } else {
      console.log('❌ Mot de passe invalide!')
      console.log('\n💡 Le hash ne correspond pas. Recréons l\'utilisateur...')
      
      // Recréer l'utilisateur avec le bon hash
      const newHash = bcrypt.hashSync(testPassword, 10)
      db.run(`
        UPDATE users 
        SET password_hash = ?, updated_at = datetime('now')
        WHERE phone = ?
      `, [newHash, testPhone])
      
      // Sauvegarder
      const data = db.export()
      const buffer = Buffer.from(data)
      fs.writeFileSync(dbPath, buffer)
      
      console.log('✅ Utilisateur mis à jour avec le nouveau hash')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

verifyAdmin()

