/**
 * Exécuté une fois au démarrage du runtime serveur (Node) — pas pendant le build statique.
 * Valide les variables d’environnement en production (fail-fast si configuration critique invalide).
 */
export async function register() {
  if (typeof process.env['NEXT_PHASE'] !== 'undefined') {
    return
  }
  try {
    const { ensureValidEnvironment } = await import('./lib/env-validator')
    ensureValidEnvironment()
  } catch (error) {
    // Ne pas faire planter toutes les fonctions Vercel si une variable manque
    console.error('[instrumentation] Configuration invalide:', error)
  }
}
