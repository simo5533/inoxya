#!/usr/bin/env node
/**
 * Script pour arrêter tous les processus Node.js
 * Utile pour nettoyer les processus orphelins qui causent des erreurs EPIPE
 */

const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

async function killAllNode() {
  console.log('🔍 Recherche des processus Node.js...\n')
  
  try {
    // Lister tous les processus Node.js
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV')
    const lines = stdout.split('\n').filter(line => line.includes('node.exe'))
    
    if (lines.length === 0) {
      console.log('✅ Aucun processus Node.js trouvé')
      return
    }
    
    console.log(`📋 ${lines.length} processus Node.js trouvé(s):\n`)
    
    // Extraire les PIDs
    const pids = []
    for (const line of lines) {
      const match = line.match(/"([^"]+)","([^"]+)","([^"]+)"/)
      if (match) {
        const [, name, pid, session] = match
        pids.push(pid)
        console.log(`   PID: ${pid.padStart(6)} | Session: ${session}`)
      }
    }
    
    console.log('\n⚠️  ATTENTION: Tous les processus Node.js seront arrêtés')
    console.log('   Cela inclut les serveurs Next.js en cours d\'exécution\n')
    
    // Demander confirmation (dans un vrai script, on pourrait utiliser readline)
    console.log('🛑 Arrêt des processus...\n')
    
    for (const pid of pids) {
      try {
        await execAsync(`taskkill /F /PID ${pid}`)
        console.log(`   ✅ PID ${pid} arrêté`)
      } catch (error) {
        // Ignorer les erreurs si le processus n'existe plus
        if (!error.message.includes('not found')) {
          console.log(`   ⚠️  Impossible d'arrêter PID ${pid}: ${error.message}`)
        }
      }
    }
    
    console.log('\n✅ Nettoyage terminé')
    console.log('💡 Vous pouvez maintenant relancer le serveur avec: npm run dev\n')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

killAllNode()

