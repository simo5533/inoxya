/**
 * Script DevOps optimal : Créer le module OpenTelemetry directement dans node_modules
 * S'exécute après npm install pour créer le module manquant
 */

const fs = require('fs')
const path = require('path')

const targetDir = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'compiled', '@opentelemetry', 'api')
const targetFile = path.join(targetDir, 'index.js')
const packageFile = path.join(targetDir, 'package.json')

// Contenu du mock complet
const mockContent = `/**
 * Mock complet pour next/dist/compiled/@opentelemetry/api
 * Créé automatiquement par scripts/fix-opentelemetry.js
 */

const createActiveContext = () => ({
  getValue: (key) => undefined,
  setValue: (key, value) => {},
  deleteValue: (key) => {},
})

module.exports = {
  trace: {
    getTracer: (name, version) => ({
      startSpan: (spanName, options, context) => ({
        end: () => {},
        setStatus: (status) => {},
        setAttribute: (key, value) => {},
        setAttributes: (attributes) => {},
        addEvent: (name, attributes) => {},
        updateName: (name) => {},
        isRecording: () => false,
        spanContext: () => ({}),
        recordException: (exception) => {},
      }),
    }),
    getSpan: (context) => undefined,
    getSpanContext: (context) => ({}),
    setSpan: (context, span) => context,
    setSpanContext: (context, spanContext) => context,
  },
  context: {
    active: createActiveContext,
    with: (context, fn) => {
      try {
        return fn()
      } catch (e) {
        return undefined
      }
    },
    bind: (context, target) => target,
  },
  createContextKey: (name) => Symbol(name || 'context-key'),
  propagation: {
    extract: (context, carrier, getter) => ({}),
    inject: (context, carrier, setter) => {},
    fields: () => [],
  },
  SpanStatusCode: {
    UNSET: 0,
    OK: 1,
    ERROR: 2,
  },
  SpanKind: {
    INTERNAL: 0,
    SERVER: 1,
    CLIENT: 2,
    PRODUCER: 3,
    CONSUMER: 4,
  },
}
`

// Ne pas faire échouer npm ci en CI si next n'est pas encore présent
const nextDir = path.join(__dirname, '..', 'node_modules', 'next')
if (!fs.existsSync(nextDir)) {
  console.log('⏭️  Next.js non trouvé, skip OpenTelemetry mock (OK en CI)')
  process.exit(0)
}

// Créer le répertoire si nécessaire
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

// Écrire le fichier index.js
try {
  fs.writeFileSync(targetFile, mockContent, 'utf8')
  console.log('✅ Module OpenTelemetry créé:', targetFile)
} catch (error) {
  console.error('⚠️  OpenTelemetry mock skip:', error.message)
  process.exit(0)
}

// Créer package.json pour que Node.js reconnaisse le module
const packageJson = {
  name: '@opentelemetry/api',
  version: '1.0.0',
  main: 'index.js',
}

try {
  fs.writeFileSync(packageFile, JSON.stringify(packageJson, null, 2), 'utf8')
  console.log('✅ package.json créé:', packageFile)
} catch (error) {
  console.error('⚠️  OpenTelemetry package.json skip:', error.message)
  process.exit(0)
}

console.log('✅ OpenTelemetry mock créé avec succès!')

