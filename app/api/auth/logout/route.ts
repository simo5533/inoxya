import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireCSRF } from '@/lib/security'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) return csrfCheck.error

    const cookieStore = await cookies()
    
    // Supprimer le cookie de session
    cookieStore.delete('user_id')
    
    // Supprimer aussi les autres cookies potentiels liés à l'authentification
    cookieStore.delete('auth_token')
    cookieStore.delete('user_data')
    
    return NextResponse.json({ 
      success: true,
      message: 'Déconnexion réussie'
    }, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    // Même en cas d'erreur, retourner un succès pour permettre la redirection
    return NextResponse.json({ 
      success: true,
      message: 'Déconnexion effectuée'
    }, { status: 200 })
  }
}

