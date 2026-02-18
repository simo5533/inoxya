/**
 * Standardisation des réponses API
 * Format uniforme pour toutes les routes API
 */

import { NextResponse } from 'next/server'

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  details?: string[]
  code?: string
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Réponse de succès standardisée
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  )
}

/**
 * Réponse d'erreur standardisée
 */
export function errorResponse(
  error: string,
  status: number = 400,
  details?: string[],
  code?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && details.length > 0 && { details }),
      ...(code && { code }),
    },
    { status }
  )
}

/**
 * Réponse 401 Unauthorized
 */
export function unauthorizedResponse(message: string = 'Non autorisé'): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401, undefined, 'UNAUTHORIZED')
}

/**
 * Réponse 403 Forbidden
 */
export function forbiddenResponse(message: string = 'Accès interdit'): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403, undefined, 'FORBIDDEN')
}

/**
 * Réponse 404 Not Found
 */
export function notFoundResponse(resource: string = 'Ressource'): NextResponse<ApiErrorResponse> {
  return errorResponse(`${resource} non trouvé(e)`, 404, undefined, 'NOT_FOUND')
}

/**
 * Réponse 429 Too Many Requests
 */
export function rateLimitResponse(retryAfter?: number): NextResponse<ApiErrorResponse> {
  const message = retryAfter
    ? `Trop de requêtes. Réessayez dans ${retryAfter} secondes.`
    : 'Trop de requêtes. Veuillez réessayer plus tard.'
  
  const response = errorResponse(message, 429, undefined, 'RATE_LIMIT_EXCEEDED')
  
  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString())
  }
  
  return response
}

/**
 * Réponse 500 Internal Server Error
 */
export function serverErrorResponse(message: string = 'Erreur serveur interne'): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 500, undefined, 'INTERNAL_SERVER_ERROR')
}

/**
 * Réponse 503 Service Unavailable
 */
export function serviceUnavailableResponse(message: string = 'Service temporairement indisponible'): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 503, undefined, 'SERVICE_UNAVAILABLE')
}

