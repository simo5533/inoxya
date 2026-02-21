/**
 * Utilitaires d'authentification et autorisation pour les pages admin
 * Vérification côté serveur pour la sécurité
 */

import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { getCurrentUser } from './auth'

export interface AdminUser {
  id: string
  phone: string
  first_name?: string
  last_name?: string
  role: 'admin' | 'moderator' | 'user'
}

/**
 * Vérifier si l'utilisateur est authentifié et est admin
 * Redirige vers /login si non authentifié
 * Redirige vers /profile si pas admin
 */
export async function requireAdmin(): Promise<AdminUser> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      // Logger pour diagnostic
      if (process.env.NODE_ENV === 'development') {
        console.log('[requireAdmin] Utilisateur non authentifié')
      }
      redirect('/fr/login?redirect=/admin')
    }
    
    if (user.role !== 'admin') {
      // Logger pour diagnostic
      if (process.env.NODE_ENV === 'development') {
        console.log('[requireAdmin] Utilisateur non admin:', { userId: user.id, role: user.role })
      }
      // Rediriger les clients vers la page d'accueil (pas vers profile qui n'existe pas)
      redirect('/fr')
    }
    
    return user as AdminUser
  } catch (error) {
    // Logger l'erreur
    if (process.env.NODE_ENV === 'development') {
      console.error('[requireAdmin] Erreur:', error)
    }
      redirect('/fr/login?redirect=/admin')
  }
}

/**
 * Vérifier si l'utilisateur est authentifié et est admin ou moderator
 */
export async function requireAdminOrModerator(): Promise<AdminUser> {
  const user = await getCurrentUser()
  
  if (!user) {
      redirect('/fr/login?redirect=/admin')
  }
  
  if (user.role !== 'admin' && user.role !== 'moderator') {
    redirect('/fr?error=unauthorized')
  }
  
  return user as AdminUser
}

/**
 * Vérifier si l'utilisateur est authentifié (optionnel)
 * Retourne null si non authentifié au lieu de rediriger
 */
export async function getAdminUserOrNull(): Promise<AdminUser | null> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return null
    }
    return user as AdminUser
  } catch {
    return null
  }
}

/**
 * Pour les API Routes : vérifier admin et retourner une réponse 403 à renvoyer si non autorisé.
 * Usage : const auth = await requireAdminApi(); if (auth.error) return auth.error;
 * Si autorisé : auth.user contient l'utilisateur admin.
 */
export async function requireAdminApi(): Promise<
  { error: NextResponse } | { user: AdminUser }
> {
  const user = await getCurrentUser()
  if (!user) {
    return {
      error: NextResponse.json(
        { 
          error: 'Non authentifié',
          message: 'Votre session a expiré. Veuillez vous reconnecter.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }
  }
  if (user.role !== 'admin') {
    return {
      error: NextResponse.json(
        { 
          error: 'Accès non autorisé',
          message: 'Droits administrateur requis pour accéder à cette ressource.',
          code: 'FORBIDDEN',
          userRole: user.role
        },
        { status: 403 }
      )
    }
  }
  return { user: user as AdminUser }
}

