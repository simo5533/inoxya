import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { testConnection, initializeDatabase, select, executeQuery, forceConnection } from '@/lib/sqlite'
import { requireCSRF } from '@/lib/security'
import { requireAdminApi } from '@/lib/admin-auth'
import { getDatabaseAdapter } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const defaultSettings: Record<string, unknown> = {
  siteName: "INOXYA ELEGANCE",
  siteDescription: "Bijoux traditionnels marocains en acier inoxydable",
  contactEmail: "inoxya@gmail.ma",
  contactPhone: "07 17 58 19 40",
  address: "Rabat, Bab Melah — Solde Reda, étage en bas",
  emailNotifications: true,
  orderNotifications: true,
  paymentNotifications: true,
  sessionTimeout: 30,
  requireStrongPassword: true,
  twoFactorAuth: false,
  lowStockThreshold: 10,
  autoRestock: false,
  paymentMethods: ["cash", "card"],
  minOrderAmount: 0,
  freeShippingThreshold: 200
}

// GET - Récupérer les paramètres (adapter Supabase prioritaire, sinon SQLite)
export async function GET() {
  try {
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error

    const adapter = await getDatabaseAdapter()
    if (typeof adapter.getSettings === 'function') {
      try {
        const settings = await adapter.getSettings()
        return NextResponse.json({ ...defaultSettings, ...settings })
      } catch (e) {
        logger.warn('Erreur getSettings via adapter, fallback SQLite:', { error: e instanceof Error ? e.message : String(e) })
      }
    }

    forceConnection()
    let isConnected = testConnection()
    if (!isConnected) {
      try {
        const { getSqlJsDb } = await import('@/lib/sqljs-singleton')
        await getSqlJsDb()
        forceConnection()
        isConnected = testConnection()
      } catch {
        // Pas de SQLite : retourner les valeurs par défaut pour que la page s'affiche
        return NextResponse.json({ ...defaultSettings })
      }
    }
    if (!isConnected) {
      return NextResponse.json({ ...defaultSettings })
    }

    initializeDatabase()
    try {
      executeQuery(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
    } catch (error) {
      logger.error('Erreur lors de la création de la table settings:', error)
    }

    const settingsRows = select('SELECT key, value FROM settings') as Array<{ key: string; value: string }>
    const settings: Record<string, unknown> = {}
    settingsRows.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value)
      } catch {
        settings[row.key] = row.value
      }
    })

    return NextResponse.json({ ...defaultSettings, ...settings })
  } catch (error) {
    logger.error('Erreur API settings GET:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    )
  }
}

// PUT - Sauvegarder les paramètres (adapter Supabase prioritaire, sinon SQLite)
export async function PUT(request: NextRequest) {
  try {
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) return csrfCheck.error

    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error

    const body = await request.json()
    const settings = body as Record<string, unknown>

    const adapter = await getDatabaseAdapter()
    if (typeof adapter.updateSettings === 'function') {
      try {
        const ok = await adapter.updateSettings(settings)
        if (ok) {
          logger.db('Paramètres admin sauvegardés (Supabase)', true)
          return NextResponse.json({ message: 'Paramètres sauvegardés avec succès', settings })
        }
      } catch (e) {
        logger.warn('Erreur updateSettings via adapter:', { error: e instanceof Error ? e.message : String(e) })
      }
    }

    forceConnection()
    let isConnected = testConnection()
    if (!isConnected) {
      try {
        const { getSqlJsDb } = await import('@/lib/sqljs-singleton')
        await getSqlJsDb()
        forceConnection()
        isConnected = testConnection()
      } catch {
        // ignore
      }
    }
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Base de données indisponible. Avec Supabase, créez la table "settings" (key text primary key, value text, updated_at timestamptz).' },
        { status: 503 }
      )
    }

    initializeDatabase()
    try {
      executeQuery(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
    } catch (error) {
      logger.error('Erreur lors de la création de la table settings:', error)
    }

    for (const [key, value] of Object.entries(settings)) {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value)
      try {
        executeQuery(
          'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [key, valueStr]
        )
      } catch (error) {
        logger.error(`Erreur lors de la sauvegarde du paramètre ${key}:`, error)
      }
    }

    logger.db('Paramètres admin sauvegardés (SQLite)', true)
    return NextResponse.json({ message: 'Paramètres sauvegardés avec succès', settings })
  } catch (error) {
    logger.error('Erreur API settings PUT:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde des paramètres' },
      { status: 500 }
    )
  }
}

