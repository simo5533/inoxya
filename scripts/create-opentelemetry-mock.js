/**
 * Script pour créer un mock d'OpenTelemetry dans node_modules/next/dist/compiled/@opentelemetry/api
 * Ce script est exécuté après npm install pour éviter l'erreur "Cannot find module 'next/dist/compiled/@opentelemetry/api'"
 */

const fs = require('fs')
const path = require('path')

const targetDir = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'compiled', '@opentelemetry', 'api')
const targetFile = path.join(targetDir, 'index.js')

// Créer le répertoire si nécessaire
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

// Contenu du mock
const mockContent = `/**
 * Mock pour next/dist/compiled/@opentelemetry/api
 * Évite l'erreur "Cannot find module 'next/dist/compiled/@opentelemetry/api'"
 */

const mockContextKey = () => ({})

module.exports = {
  trace: {
    getTracer: () => ({
      startSpan: () => ({
        end: () => {},
        setStatus: () => {},
        setAttribute: () => {},
        addEvent: () => {},
      }),
    }),
  },
  context: {
    active: () => ({}),
    with: (ctx, fn) => fn(),
  },
  createContextKey: mockContextKey,
  propagation: {
    extract: () => ({}),
    inject: () => {},
  },
  SpanStatusCode: {
    OK: 1,
    ERROR: 2,
  },
}
`

// Écrire le fichier mock
try {
  fs.writeFileSync(targetFile, mockContent, 'utf8')
  console.log('✅ Mock OpenTelemetry créé avec succès:', targetFile)
} catch (error) {
  console.error('❌ Erreur lors de la création du mock:', error)
  process.exit(1)
}

