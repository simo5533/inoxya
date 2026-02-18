/**
 * Mock pour next/dist/compiled/@opentelemetry/api
 * Évite l'erreur "Cannot find module 'next/dist/compiled/@opentelemetry/api'"
 * 
 * Ce mock retourne des fonctions vides pour éviter les erreurs de chargement
 */

// Mock minimal d'OpenTelemetry API
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
  propagation: {
    extract: () => ({}),
    inject: () => {},
  },
  SpanStatusCode: {
    OK: 1,
    ERROR: 2,
  },
}

