import { NextRequest, NextResponse } from 'next/server'
import {
  generateRefreshJWT,
  requireCSRF,
  verifyRefreshJWT,
  WEB_REFRESH_MAX_AGE_SEC,
  WEB_USER_ID_MAX_AGE_SEC,
} from '@/lib/security'
import { getDatabaseAdapter } from '@/lib/db'
import { getUserById as getSqliteUserById } from '@/lib/sqlite'
import { IS_PRODUCTION } from '@/lib/env'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

async function resolveSessionUser(userId: string): Promise<{
  phone: string
  role: 'user' | 'moderator' | 'admin'
} | null> {
  try {
    const adapter = await getDatabaseAdapter()
    const user = await adapter.getUserById(userId)
    if (user) {
      return {
        phone: user.phone,
        role: user.role as 'user' | 'moderator' | 'admin',
      }
    }
  } catch {
    /* fallback sqlite */
  }
  const sqliteUser = getSqliteUserById(userId)
  if (sqliteUser) {
    return {
      phone: sqliteUser.phone,
      role: sqliteUser.role as 'user' | 'moderator' | 'admin',
    }
  }
  return null
}

/**
 * Renouvelle le cookie user_id (1h) + refresh_token (7j) à partir du refresh JWT.
 */
export async function POST(request: NextRequest) {
  try {
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) return csrfCheck.error

    const refreshToken = request.cookies.get('refresh_token')?.value
    if (!refreshToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const payload = verifyRefreshJWT(refreshToken)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    const live = await resolveSessionUser(payload.userId)
    if (!live) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }

    const newRefresh = generateRefreshJWT({
      userId: payload.userId,
      phone: live.phone,
      role: live.role,
    })

    const response = NextResponse.json({ success: true })

    response.cookies.set('user_id', payload.userId, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: WEB_USER_ID_MAX_AGE_SEC,
      path: '/',
    })
    response.cookies.set('refresh_token', newRefresh, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: WEB_REFRESH_MAX_AGE_SEC,
      path: '/api/auth',
    })

    return response
  } catch (error) {
    logger.error('[auth/refresh]', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
