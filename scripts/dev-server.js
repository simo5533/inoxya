#!/usr/bin/env node
/**
 * Dev server script with port conflict handling
 * Defaults to port 3000 unless PORT env var is set
 */

const { spawn } = require('child_process')
const net = require('net')

const PORT = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000
const HOST = process.env.HOST || 'localhost'

/**
 * Check if port is available
 */
function checkPort(port, host = 'localhost') {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(port, host, () => {
      server.once('close', () => resolve(true))
      server.close()
    })
    server.on('error', () => resolve(false))
  })
}

/**
 * Find available port starting from the desired port
 */
async function findAvailablePort(startPort, host = 'localhost', maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i
    const available = await checkPort(port, host)
    if (available) {
      return port
    }
  }
  return null
}

/**
 * Get process using port (Windows)
 */
function getPortProcess(port) {
  return new Promise((resolve) => {
    const { execFile } = require('child_process')
    // Utiliser execFile avec des arguments séparés pour éviter le warning shell
    execFile('netstat', ['-ano'], (error, stdout) => {
      if (error || !stdout) {
        resolve(null)
        return
      }
      // Filtrer les lignes contenant le port et LISTENING
      const lines = stdout.split('\n').filter(line => 
        line.includes(`:${port}`) && line.includes('LISTENING')
      )
      if (lines.length > 0) {
        const match = lines[0].match(/\s+(\d+)\s*$/)
        if (match) {
          resolve(match[1])
        }
      }
      resolve(null)
    })
  })
}

async function main() {
  const desiredPort = parseInt(PORT, 10)
  
  console.log(`\n🚀 Starting Next.js dev server...`)
  console.log(`📌 Desired port: ${desiredPort}`)
  
  const available = await checkPort(desiredPort, HOST)
  
  if (!available) {
    console.warn(`⚠️  Port ${desiredPort} is already in use`)
    
    // Try to find the process
    const pid = await getPortProcess(desiredPort)
    if (pid) {
      console.warn(`   Process ID: ${pid}`)
      console.warn(`   To free the port, run:`)
      console.warn(`   taskkill /F /PID ${pid}`)
    } else {
      console.warn(`   To find and kill the process, run:`)
      console.warn(`   netstat -ano | findstr :${desiredPort}`)
      console.warn(`   taskkill /F /PID <PID>`)
    }
    
    // Try to find an available port
    console.log(`\n🔍 Looking for an available port...`)
    const freePort = await findAvailablePort(desiredPort, HOST)
    
    if (freePort) {
      console.log(`✅ Found available port: ${freePort}`)
      console.log(`   Starting server on port ${freePort}...\n`)
      startServer(freePort)
    } else {
      console.error(`❌ Could not find an available port after ${10} attempts`)
      console.error(`   Please free port ${desiredPort} or set PORT env var to a different port`)
      process.exit(1)
    }
  } else {
    console.log(`✅ Port ${desiredPort} is available`)
    console.log(`   Starting server on port ${desiredPort}...\n`)
    startServer(desiredPort)
  }
}

function startServer(port) {
  // Utiliser directement le binaire next depuis node_modules
  const path = require('path')
  const fs = require('fs')
  const isWindows = process.platform === 'win32'
  
  // Chemin vers next dans node_modules/.bin
  const nextBin = path.join(process.cwd(), 'node_modules', '.bin', isWindows ? 'next.cmd' : 'next')
  
  let command, args
  if (fs.existsSync(nextBin)) {
    // Utiliser directement le binaire next
    if (isWindows) {
      // Sur Windows, les .cmd doivent être exécutés via cmd.exe /c
      command = 'cmd.exe'
      args = ['/c', nextBin, 'dev', '-p', port.toString(), '-H', HOST]
    } else {
      command = 'node'
      args = [nextBin, 'dev', '-p', port.toString(), '-H', HOST]
    }
  } else {
    // Fallback: utiliser npx (mais avec des arguments séparés)
    command = isWindows ? 'cmd.exe' : 'npx'
    args = isWindows 
      ? ['/c', 'npx', 'next', 'dev', '-p', port.toString(), '-H', HOST]
      : ['next', 'dev', '-p', port.toString(), '-H', HOST]
  }
  
  console.log(`🔧 Commande: ${command} ${args.join(' ')}`)
  
  const nextDev = spawn(command, args, {
    stdio: 'inherit',
    shell: false, // Pas de shell pour éviter le warning de sécurité
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: port.toString(),
    }
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
  
  nextDev.on('error', (error) => {
    if (error.code !== 'EPIPE') {
      console.error('❌ Failed to start Next.js dev server:', error.message)
      process.exit(1)
    }
  })
  
  nextDev.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n❌ Next.js dev server exited with code ${code}`)
      process.exit(code)
    }
  })
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down dev server...')
    nextDev.kill('SIGINT')
    process.exit(0)
  })
  
  process.on('SIGTERM', () => {
    nextDev.kill('SIGTERM')
    process.exit(0)
  })
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})

