'use client'

import { useEffect } from 'react'

const REFRESH_INTERVAL_MS = 55 * 60 * 1000

async function refreshSessionOnce(): Promise<void> {
  try {
    const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' })
    if (!csrfRes.ok) return
    const data = (await csrfRes.json()) as { csrfToken?: string }
    if (!data.csrfToken) return
    await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': data.csrfToken },
    })
  } catch {
    /* silencieux : pas de session ou réseau */
  }
}

/**
 * Maintient la session active (user_id 1h) tant que l’onglet est ouvert.
 */
export function SessionRefresh() {
  useEffect(() => {
    void refreshSessionOnce()
    const id = window.setInterval(() => {
      void refreshSessionOnce()
    }, REFRESH_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  return null
}

SessionRefresh.displayName = 'SessionRefresh'
