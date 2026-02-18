#!/usr/bin/env node

/**
 * Script de configuration automatique pour INOXYA BIJOUX
 * Génère .env.local avec toutes les variables nécessaires
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const envLocalPath = path.join(process.cwd(), '.env.local')
const envExamplePath = path.join(process.cwd(), '.env.local.example')

console.log('🚀 Configuration de l\'environnement INOXYA BIJOUX\n')

// Vérifier si .env.local existe déjà
if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  Le fichier .env.local existe déjà.')
  console.log('   Pour le régénérer, supprimez-le d\'abord.\n')
  process.exit(0)
}

// Générer JWT_SECRET sécurisé
const jwtSecret = crypto.randomBytes(64).toString('hex')

// Template .env.local
const envTemplate = `# ============================================
# CONFIGURATION INOXYA BIJOUX - GÉNÉRÉE AUTOMATIQUEMENT
# ============================================
# Date de génération: ${new Date().toISOString()}
# ⚠️ NE JAMAIS COMMITER CE FICHIER DANS GIT

# ==================== OBLIGATOIRE ====================
# Clé secrète JWT (générée automatiquement)
JWT_SECRET=${jwtSecret}

# Environnement
NODE_ENV=${process.env.NODE_ENV || 'development'}

# URL du site (à modifier avec votre domaine)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ==================== BASE DE DONNÉES ====================
# Option 1: PostgreSQL (RECOMMANDÉ pour production)
# Décommenter et configurer selon votre setup:
# DATABASE_URL=postgresql://inoxya_user:your-password@localhost:5432/inoxya_bijoux

# OU variables séparées:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=inoxya_bijoux
# DB_USER=inoxya_user
# DB_PASSWORD=your-secure-password-here

# Option 2: SQLite (développement uniquement)
USE_LOCAL_DB=true
DB_PATH=./data/inoxya_bijoux.db

# ==================== EMAIL (Optionnel) ====================
# Configuration SMTP pour notifications admin
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# ADMIN_EMAIL=admin@votredomaine.com

# ==================== NOTES ====================
# - JWT_SECRET a été généré automatiquement (64 caractères)
# - Pour la production, modifiez NEXT_PUBLIC_SITE_URL avec votre domaine
# - Configurez PostgreSQL pour la production (ne pas utiliser SQLite)
# - Ne jamais exposer JWT_SECRET ou mots de passe dans le code
`

// Écrire le fichier
try {
  fs.writeFileSync(envLocalPath, envTemplate, 'utf8')
  console.log('✅ Fichier .env.local créé avec succès !\n')
  console.log('📝 Variables configurées:')
  console.log('   ✓ JWT_SECRET (généré automatiquement)')
  console.log('   ✓ NODE_ENV')
  console.log('   ✓ NEXT_PUBLIC_SITE_URL')
  console.log('   ✓ USE_LOCAL_DB (SQLite pour développement)\n')
  console.log('⚠️  IMPORTANT:')
  console.log('   1. Modifiez NEXT_PUBLIC_SITE_URL avec votre domaine en production')
  console.log('   2. Configurez PostgreSQL pour la production')
  console.log('   3. Ajoutez les variables SMTP si vous voulez les emails\n')
  console.log('📖 Pour plus d\'informations, consultez:')
  console.log('   - GUIDE_DEPLOIEMENT_PRODUCTION.md')
  console.log('   - .env.local.example\n')
} catch (error) {
  console.error('❌ Erreur lors de la création de .env.local:', error.message)
  process.exit(1)
}

