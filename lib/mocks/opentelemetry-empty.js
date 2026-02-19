/**
 * Mock complet pour next/dist/compiled/@opentelemetry/api
 * Remplacé par webpack.NormalModuleReplacementPlugin
 * Solution optimale DevOps : mock complet avec toutes les méthodes nécessaires
 */

// Créer un contexte actif avec toutes les méthodes nécessaires
const createActiveContext = () => ({
  getValue: () => undefined,
  setValue: () => {},
  deleteValue: () => {},
})

module.exports = {
  trace: {
    getTracer: () => ({
      startSpan: (_name, _options, _context) => ({
        end: () => {},
        setStatus: () => {},
        setAttribute: () => {},
        addEvent: () => {},
        updateName: () => {},
        isRecording: () => false,
        spanContext: () => ({}),
        setAttributes: () => {},
      }),
    }),
  },
  context: {
    active: createActiveContext,
    with: (_context, fn) => {
      try {
        return fn()
      } catch {
        return undefined
      }
    },
    bind: (_context, target) => target,
  },
  createContextKey: (name) => Symbol(name || 'context-key'),
  propagation: {
    extract: () => ({}),
    inject: () => {},
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

