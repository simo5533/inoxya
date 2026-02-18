import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { testConnection, initializeDatabase, select, executeQuery } from '@/lib/sqlite'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Récupérer les paramètres
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const isConnected = testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Base de données indisponible' },
        { status: 503 }
      )
    }

    initializeDatabase()

    // Créer la table settings si elle n'existe pas
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

    // Récupérer tous les paramètres
    const settingsRows = select('SELECT key, value FROM settings') as Array<{ key: string; value: string }>
    
    const settings: Record<string, any> = {}
    settingsRows.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value)
      } catch {
        settings[row.key] = row.value
      }
    })

    // Valeurs par défaut si aucune donnée
    const defaultSettings = {
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

    return NextResponse.json({
      ...defaultSettings,
      ...settings
    })
  } catch (error) {
    logger.error('Erreur API settings GET:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    )
  }
}

// PUT - Sauvegarder les paramètres
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const settings = body as Record<string, any>

    const isConnected = testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Base de données indisponible' },
        { status: 503 }
      )
    }

    initializeDatabase()

    // Créer la table settings si elle n'existe pas
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

    // Sauvegarder chaque paramètre
    for (const [key, value] of Object.entries(settings)) {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value)
      
      // Utiliser INSERT OR REPLACE pour mettre à jour ou insérer
      try {
        executeQuery(
          'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [key, valueStr]
        )
      } catch (error) {
        logger.error(`Erreur lors de la sauvegarde du paramètre ${key}:`, error)
      }
    }

    logger.db('Paramètres admin sauvegardés', true)
    return NextResponse.json({ 
      message: 'Paramètres sauvegardés avec succès',
      settings 
    })
  } catch (error) {
    logger.error('Erreur API settings PUT:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde des paramètres' },
      { status: 500 }
    )
  }
}

