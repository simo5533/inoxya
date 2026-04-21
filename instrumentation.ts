/**
 * Exécuté une fois au démarrage du runtime serveur (Node) — pas pendant le build statique.
 * Valide les variables d’environnement en production (fail-fast si configuration critique invalide).
 */
export async function register() {
  if (typeof process.env['NEXT_PHASE'] !== 'undefined') {
    return
  }
  const { ensureValidEnvironment } = await import('./lib/env-validator')
  ensureValidEnvironment()
}
