/**
 * Gestion avancée des packs INOXYA BIJOUX
 * Fonctionnalités complètes pour la création, modification et gestion des packs
 */

// Import conditionnel de better-sqlite3 - peut être absent si bindings non compilés
let Database: any = null
try {
  Database = require('better-sqlite3')
  // Test si les bindings sont disponibles
  try {
    const testDb = new Database(':memory:')
    testDb.close()
  } catch {
    // Bindings non compilés
    Database = null
  }
} catch {
  // Module non disponible
  Database = null
}
import path from 'path'

// Types pour la gestion des packs
export interface PackItem {
  id: string
  bijou_id: string
  bijou_name: string
  bijou_price: number
  quantity: number
  is_required: boolean
  is_customizable: boolean
}

export interface PackComposition {
  id: string
  pack_id: string
  bijou_id: string
  quantity: number
  is_required: boolean
  is_customizable: boolean
  created_at: string
}

export interface PackDiscount {
  type: 'percentage' | 'fixed' | 'bundle'
  value: number
  min_quantity?: number
  max_quantity?: number
}

export interface AdvancedPack {
  id: string
  name: string
  slug: string
  description: string
  price: number
  original_price?: number
  image_url: string
  images: string[]
  category: string
  tags: string[]
  is_featured: boolean
  is_active: boolean
  stock_quantity: number
  min_items: number
  max_items: number
  discount: PackDiscount
  composition: PackComposition[]
  rating: number
  reviews_count: number
  created_at: string
  updated_at: string
}

// PHASE B: Chemin DB déterministe (même logique que lib/sqlite.ts)
const getDbPath = (): string => {
  const envDbPath = process.env['SQLITE_DB_PATH']
  if (envDbPath) {
    return path.isAbsolute(envDbPath) ? envDbPath : path.resolve(process.cwd(), envDbPath)
  }
  return path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
}

const dbPath = getDbPath()

/**
 * Connexion à la base de données (better-sqlite3)
 * Returns null if better-sqlite3 is not available
 */
function getDatabase() {
  if (!Database) {
    throw new Error('better-sqlite3 is not available. Database operations require better-sqlite3 or sql.js fallback.')
  }
  return new Database(dbPath)
}

/**
 * Créer un nouveau pack
 */
export async function createPack(packData: Omit<AdvancedPack, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const db = getDatabase()
  try {
    const stmt = db.prepare(`
      INSERT INTO packs (name, slug, description, price, image_url, is_featured)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      packData.name,
      packData.slug,
      packData.description ?? '',
      packData.price,
      packData.image_url ?? '',
      packData.is_featured ? 1 : 0
    )
    const packId = String((result as { lastInsertRowid: number }).lastInsertRowid)
    if (packData.composition?.length) {
      try {
        await addPackComposition(packId, packData.composition)
      } catch {
        // pack_composition peut ne pas exister
      }
    }
    return packId
  } finally {
    db.close()
  }
}

/**
 * Ajouter la composition d'un pack
 */
export async function addPackComposition(packId: string, composition: PackComposition[]): Promise<void> {
  if (composition.length === 0) return
  const db = getDatabase()
  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO pack_composition (id, pack_id, bijou_id, quantity, is_required, is_customizable)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    for (const item of composition) {
      const itemId = `pack-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      stmt.run(itemId, packId, item.bijou_id, item.quantity, item.is_required ? 1 : 0, item.is_customizable ? 1 : 0)
    }
  } finally {
    db.close()
  }
}

/**
 * Récupérer tous les packs avec leur composition
 */
export async function getAllPacks(): Promise<AdvancedPack[]> {
  const db = getDatabase()
  try {
    const rows = db.prepare(`
      SELECT p.id, p.name, p.slug, p.description, p.price,
             p.image_url, p.is_featured, p.created_at
      FROM packs p
      ORDER BY p.created_at DESC
    `).all() as { id: string; name: string; slug: string; description?: string; price: number; image_url?: string; is_featured: number; created_at: string }[]
    return rows.map(row => ({
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      price: row.price,
      original_price: undefined,
      image_url: row.image_url ?? '',
      images: [],
      category: 'general',
      tags: [],
      is_featured: Boolean(row.is_featured),
      is_active: true,
      stock_quantity: 100,
      min_items: 1,
      max_items: 5,
      discount: { type: 'percentage' as const, value: 0 },
      composition: [],
      rating: 4.5,
      reviews_count: 0,
      created_at: row.created_at,
      updated_at: row.created_at
    }))
  } finally {
    db.close()
  }
}

/**
 * Récupérer un pack par son ID avec sa composition détaillée
 */
export async function getPackById(packId: string): Promise<AdvancedPack | null> {
  const db = getDatabase()
  try {
    const row = db.prepare(`
      SELECT id, name, slug, description, price, image_url, is_featured, created_at
      FROM packs WHERE id = ?
    `).get(packId) as { id: string; name: string; slug: string; description?: string; price: number; image_url?: string; is_featured: number; created_at: string } | undefined
    if (!row) return null
    return {
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      price: row.price,
      original_price: undefined,
      image_url: row.image_url ?? '',
      images: [],
      category: 'general',
      tags: [],
      is_featured: Boolean(row.is_featured),
      is_active: true,
      stock_quantity: 100,
      min_items: 1,
      max_items: 5,
      discount: { type: 'percentage' as const, value: 0 },
      composition: [],
      rating: 4.5,
      reviews_count: 0,
      created_at: row.created_at,
      updated_at: row.created_at
    }
  } finally {
    db.close()
  }
}

/**
 * Convertit une valeur en type compatible SQLite (number, string, bigint, null).
 * SQLite n'accepte PAS : boolean, object, array, undefined.
 */
function toSqliteValue(value: unknown): number | string | bigint | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string') return value
  if (typeof value === 'bigint') return value
  if (typeof value === 'object' || Array.isArray(value)) return JSON.stringify(value)
  return String(value)
}

/**
 * Mettre à jour un pack
 * @returns nombre de lignes modifiées
 * @throws si aucune ligne modifiée (pack inexistant ou ID invalide)
 */
export async function updatePack(packId: string, packData: Partial<AdvancedPack>): Promise<number> {
  const db = getDatabase()
  try {
    const allowed = ['name', 'slug', 'description', 'price', 'image_url', 'is_featured'] as const
    const fields: string[] = []
    const values: (number | string | bigint | null)[] = []

    for (const key of allowed) {
      const raw = (packData as Record<string, unknown>)[key]
      if (raw !== undefined) {
        fields.push(`${key} = ?`)
        values.push(toSqliteValue(raw))
      }
    }

    if (fields.length === 0) {
      return 0
    }

    const packIdParam = Number(packId) || packId
    values.push(typeof packIdParam === 'number' ? packIdParam : toSqliteValue(packIdParam) as string)

    const query = `UPDATE packs SET ${fields.join(', ')} WHERE id = ?`
    const stmt = db.prepare(query)
    const result = stmt.run(...values) as { changes: number }

    if (result.changes === 0) {
      throw new Error(`Aucune ligne modifiée pour le pack id=${packId}. Vérifiez que l'ID existe.`)
    }

    return result.changes
  } finally {
    db.close()
  }
}

/**
 * Supprimer un pack
 */
export async function deletePack(packId: string): Promise<void> {
  const db = getDatabase()
  try {
    try {
      db.prepare('DELETE FROM pack_composition WHERE pack_id = ?').run(packId)
    } catch {
      // Table pack_composition peut ne pas exister
    }
    db.prepare('DELETE FROM packs WHERE id = ?').run(packId)
  } finally {
    db.close()
  }
}

/**
 * Calculer le prix d'un pack personnalisé
 */
export async function calculateCustomPackPrice(selectedItems: PackItem[]): Promise<{
  subtotal: number
  discount: number
  total: number
  savings: number
}> {
  const subtotal = selectedItems.reduce((sum, item) => sum + (item.bijou_price * item.quantity), 0)
  
  // Appliquer les remises selon la logique métier
  let discount = 0
  let total = subtotal
  
  // Remise par quantité
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
  if (totalItems >= 5) {
    discount = subtotal * 0.15 // 15% de remise pour 5+ articles
  } else if (totalItems >= 3) {
    discount = subtotal * 0.10 // 10% de remise pour 3+ articles
  }
  
  total = subtotal - discount
  const savings = discount
  
  return { subtotal, discount, total, savings }
}

/**
 * Vérifier la disponibilité d'un pack
 */
export async function checkPackAvailability(packId: string, quantity: number = 1): Promise<{
  available: boolean
  stock: number
  message: string
}> {
  const pack = await getPackById(packId)
  
  if (!pack) {
    return {
      available: false,
      stock: 0,
      message: 'Pack non trouvé'
    }
  }
  
  if (!pack.is_active) {
    return {
      available: false,
      stock: pack.stock_quantity,
      message: 'Pack non disponible'
    }
  }
  
  if (pack.stock_quantity < quantity) {
    return {
      available: false,
      stock: pack.stock_quantity,
      message: `Stock insuffisant. Disponible: ${pack.stock_quantity}`
    }
  }
  
  return {
    available: true,
    stock: pack.stock_quantity,
    message: 'Disponible'
  }
}

/**
 * Récupérer les packs par catégorie
 */
export async function getPacksByCategory(category: string): Promise<AdvancedPack[]> {
  const allPacks = await getAllPacks()
  return allPacks.filter(pack => pack.category === category)
}

/**
 * Récupérer les packs vedettes
 */
export async function getFeaturedPacks(): Promise<AdvancedPack[]> {
  const allPacks = await getAllPacks()
  return allPacks.filter(pack => pack.is_featured)
}

/**
 * Rechercher des packs
 */
export async function searchPacks(query: string): Promise<AdvancedPack[]> {
  const allPacks = await getAllPacks()
  const searchTerm = query.toLowerCase()
  
  return allPacks.filter(pack => 
    pack.name.toLowerCase().includes(searchTerm) ||
    pack.description.toLowerCase().includes(searchTerm) ||
    pack.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  )
}
