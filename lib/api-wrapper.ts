/**
 * Wrapper global pour toutes les routes API
 * Garantit que toutes les erreurs sont capturées et renvoient du JSON
 */

import { NextResponse } from 'next/server'
import { logger } from './logger'
import { serializeError } from './sqlite'

/**
 * Wrapper pour les handlers API qui garantit toujours une réponse JSON
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (error) {
      const errorDetails = serializeError(error)
      logger.error('[API Error Handler] Erreur non gérée:', errorDetails)
      
      // Toujours renvoyer du JSON, même en cas d'erreur
      return NextResponse.json(
        {
          error: 'Erreur interne du serveur',
          ...(process.env.NODE_ENV === 'development' ? { details: errorDetails } : {})
        },
        { status: 500 }
      )
    }
  }) as T
}

/**
 * Wrapper pour les handlers async qui garantit une réponse JSON
 */
export async function safeApiHandler<T>(
  handler: () => Promise<T>,
  errorMessage = 'Erreur serveur'
): Promise<NextResponse> {
  try {
    const result = await handler()
    return NextResponse.json(result)
  } catch (error) {
    const errorDetails = serializeError(error)
    logger.error(`[API Error] ${errorMessage}:`, errorDetails)
    
    return NextResponse.json(
      {
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' ? { details: errorDetails } : {})
      },
      { status: 500 }
    )
  }
}

