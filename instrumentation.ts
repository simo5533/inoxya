/**
 * Fichier instrumentation.ts pour Next.js
 * DÉSACTIVÉ - Ne rien faire pour éviter le chargement automatique d'OpenTelemetry
 * 
 * Next.js charge automatiquement OpenTelemetry si @sentry/nextjs est présent.
 * Ce fichier vide empêche ce comportement.
 */

export async function register() {
  // Ne rien faire - Sentry complètement désactivé
  // Cela évite l'erreur "Cannot find module '@opentelemetry/api'"
}

