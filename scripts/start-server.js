#!/usr/bin/env node
/**
 * Script de démarrage du serveur Next.js
 * Gère automatiquement le mode standalone si disponible
 * Supporte le port personnalisé via PORT ou -p
 */

const fs = require('fs')
const path = require('path')

// Récupérer le port depuis les arguments ou l'environnement
// npm start -- -p 3001 passe les arguments après --
const args = process.argv.slice(2)
let port = process.env.PORT || '3000'

// Chercher -p ou --port dans les arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-p' || args[i] === '--port') {
    port = args[i + 1] || port
    break
  } else if (args[i].startsWith('-p=') || args[i].startsWith('--port=')) {
    port = args[i].split('=')[1] || port
    break
  }
}

// Définir le port pour Next.js
process.env.PORT = port

const standalonePath = path.join(process.cwd(), '.next', 'standalone', 'server.js')
const standaloneExists = fs.existsSync(standalonePath)

if (standaloneExists) {
  console.log('🚀 Démarrage en mode standalone...')
  console.log(`   Port: ${port}`)
  console.log('   Utilisation de: .next/standalone/server.js\n')
  
  // Le serveur standalone lit PORT depuis process.env
  // Il faut aussi passer le port comme argument si nécessaire
  const originalArgv = process.argv
  process.argv = [process.argv[0], standalonePath, '-p', port]
  
  try {
    require(standalonePath)
  } catch (error) {
    // Si erreur, essayer sans arguments (le serveur standalone peut gérer PORT via env)
    process.argv = originalArgv
    require(standalonePath)
  }
} else {
  console.log('🚀 Démarrage en mode standard...')
  console.log(`   Port: ${port}`)
  console.log('   Utilisation de: next start\n')
  // Utiliser next start directement
  const { spawn } = require('child_process')
  const nextStart = spawn('npx', ['next', 'start', '-p', port], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: port }
  })
  
  // Ignorer les erreurs EPIPE (broken pipe) - terminal fermé
  process.stdout.on('error', (error) => {
    if (error.code !== 'EPIPE') {
      console.error('❌ stdout error:', error.message)
    }
  })
  
  process.stderr.on('error', (error) => {
    if (error.code !== 'EPIPE') {
      console.error('❌ stderr error:', error.message)
    }
  })
  
  nextStart.on('error', (error) => {
    if (error.code === 'EPIPE') {
      // Ignorer EPIPE - terminal fermé
      return
    }
    console.error('❌ Erreur lors du démarrage:', error)
    if (error.code === 'EADDRINUSE') {
      console.error(`\n💡 Le port ${port} est déjà utilisé.`)
      console.error('   Options:')
      console.error(`   1. Arrêter le processus sur le port ${port}`)
      console.error(`   2. Utiliser un autre port: npm start -- -p 3002`)
      console.error(`   3. Ou définir PORT=3002 npm start`)
    }
    process.exit(1)
  })
  
  nextStart.on('exit', (code) => {
    process.exit(code || 0)
  })
}

