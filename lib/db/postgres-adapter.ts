/**
 * Adapter PostgreSQL - Pour production sur Vercel
 * Utilise pg (node-postgres) pour se connecter à Postgres
 */
import 'server-only'

import { Pool } from 'pg'
import type { DatabaseAdapter } from './adapter'
import type {
  Product,
  Category,
  Pack,
  User,
  Order,
  OrderItem,
  CartItem,
  Favorite,
  Payment,
  Notification,
  DashboardStats,
} from './types'
import { logger } from '../logger'
import { slugToDbValue } from '../category-mapping'

// Interfaces typées pour les rows PostgreSQL
interface UserRow {
  id: string | number
  phone: string
  password_hash: string
  first_name?: string | null
  last_name?: string | null
  role?: string
  created_at?: string | Date
  updated_at?: string | Date
}

interface ProductRow {
  id: string | number
  name: string
  name_ar?: string | null
  description?: string | null
  price: string | number
  original_price?: string | number | null
  image_url?: string | null
  main_image?: string | null
  images?: string | string[] | null
  category_id?: string | number | null
  category?: string | null
  is_available?: boolean | null
  is_active?: boolean | null
  is_featured?: boolean
  rating?: string | number | null
  reviews_count?: string | number | null
  stock_quantity?: string | number | null
  stock?: string | number | null
  created_at?: string | Date
  updated_at?: string | Date
}

interface OrderRow {
  id: string | number
  user_id?: string | number | null
  total_amount: string | number
  status: string
  shipping_address?: string | unknown | null
  phone?: string | null
  notes?: string | null
  created_at?: string | Date
  updated_at?: string | Date
}

interface PaymentRow {
  id: string | number
  order_id: string | number
  amount: string | number
  payment_method: string
  status: string
  transaction_id?: string | null
  created_at?: string | Date
}

interface PackRow {
  id: string | number
  name: string
  slug: string
  description?: string | null
  price: string | number
  image_url?: string | null
  is_featured?: boolean
  created_at?: string | Date
}

interface ProductColumnMeta {
  data_type: string
  column_default: string | null
}

export class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool
  private productColumnsCache: Map<string, ProductColumnMeta> | null = null

  constructor(databaseUrl: string) {
    // Vercel Postgres / Neon optimized pool config
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,           // Max connections (Vercel serverless: keep low)
      min: 0,            // Allow pool to shrink to 0 (serverless compatible)
      idleTimeoutMillis: 10000,   // Close idle connections after 10s
      connectionTimeoutMillis: 5000,  // Fail fast on connection issues
    })

    // Gérer les erreurs de connexion
    this.pool.on('error', (err: Error) => {
      logger.error('[PostgresAdapter] Pool error:', err)
    })
  }

  // Users
  async getUserByPhone(phone: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    if (!row) return null
    return this.mapUser(row)
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    if (!row) return null
    return this.mapUser(row)
  }

  async createUser(userData: {
    phone: string
    password_hash: string
    first_name?: string
    last_name?: string
    role?: string
  }): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      `INSERT INTO users (phone, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userData.phone,
        userData.password_hash,
        userData.first_name || null,
        userData.last_name || null,
        userData.role || 'user',
      ]
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    if (!row) return null
    return this.mapUser(row)
  }

  async getAllUsers(): Promise<User[]> {
    const result = await this.pool.query<UserRow>('SELECT * FROM users ORDER BY created_at DESC')
    return result.rows.filter((row: UserRow | null): row is UserRow => row != null).map((row: UserRow) => this.mapUser(row))
  }

  async updateUserRole(userId: string, newRole: string): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
      [newRole, userId]
    )
    return (result.rowCount ?? 0) > 0
  }

  // Products
  async getProducts(categorySlug?: string): Promise<Product[]> {
    let query = 'SELECT * FROM products WHERE (is_active = true OR is_active IS NULL) AND (is_available = true OR is_available IS NULL) ORDER BY created_at DESC'
    const params: (string | number | boolean | null)[] = []

    if (categorySlug) {
      const dbValue = slugToDbValue(categorySlug)
      if (dbValue) {
        query = 'SELECT * FROM products WHERE (is_active = true OR is_active IS NULL) AND (is_available = true OR is_available IS NULL) AND category = $1 ORDER BY created_at DESC'
        params.push(dbValue)
      }
    }

    const result = await this.pool.query<ProductRow>(query, params)
    return result.rows.map((row: ProductRow) => this.mapProduct(row))
  }

  async getProductById(id: string): Promise<Product | null> {
    const result = await this.pool.query<ProductRow>(
      'SELECT * FROM products WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    if (!row) return null
    return this.mapProduct(row)
  }

  private async getProductColumnMeta(): Promise<Map<string, ProductColumnMeta>> {
    if (this.productColumnsCache) return this.productColumnsCache

    const result = await this.pool.query<{
      column_name: string
      data_type: string
      column_default: string | null
    }>(
      `SELECT column_name, data_type, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'products'
       ORDER BY ordinal_position`
    )

    this.productColumnsCache = new Map(
      result.rows.map((row) => [
        row.column_name,
        { data_type: row.data_type, column_default: row.column_default },
      ])
    )
    return this.productColumnsCache
  }

  private parseImagesForDb(
    raw: string | string[] | undefined,
    asJsonb: boolean
  ): string | unknown[] {
    if (!raw) return asJsonb ? [] : '[]'
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw) as unknown
        return asJsonb ? (Array.isArray(parsed) ? parsed : [parsed]) : raw
      } catch {
        return asJsonb ? [] : '[]'
      }
    }
    return asJsonb ? raw : JSON.stringify(raw)
  }

  private async ensureDefaultCategories(): Promise<void> {
    try {
      const countResult = await this.pool.query<{ c: number }>(
        'SELECT COUNT(*)::int AS c FROM categories'
      )
      if ((countResult.rows[0]?.c ?? 0) > 0) return

      const defaults: [string, string, string][] = [
        ['Bagues', 'bagues', 'Collection de bagues berberes et modernes'],
        ['Ensemble', 'colliers', 'Ensembles assortis de bijoux en acier inoxydable'],
        ['Bracelets', 'bracelets', 'Bracelets elegants et resistants'],
        ["Boucles d'oreilles", 'boucles-oreilles', "Boucles d'oreilles traditionnelles et modernes"],
        ['Colliers', 'montres', 'Colliers traditionnels et contemporains'],
        ['Montres', 'parures', 'Montres elegantes et precises'],
        ['Nos packs', 'broches', 'Packs exclusifs de bijoux a prix avantageux'],
      ]

      for (const [name, slug, description] of defaults) {
        await this.pool.query(
          `INSERT INTO categories (name, slug, description)
           VALUES ($1, $2, $3)
           ON CONFLICT (slug) DO NOTHING`,
          [name, slug, description]
        )
      }
      logger.info('[PostgresAdapter] Catégories par défaut insérées')
    } catch (error) {
      logger.warn('[PostgresAdapter] ensureDefaultCategories:', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  async createProduct(productData: Partial<Product>): Promise<Product | null> {
    if (!productData.name || productData.price == null) {
      throw new Error('Champs requis manquants: name et price')
    }

    const cols = await this.getProductColumnMeta()
    if (cols.size === 0) {
      throw new Error(
        'Table products absente. Exécutez scripts/neon-setup-clean.sql dans Neon SQL Editor.'
      )
    }

    await this.ensureDefaultCategories()

    const categoryName = productData.category || productData.category_id || 'Général'
    let categoryId: string | null = null
    if (cols.has('category_id')) {
      try {
        const catResult = await this.pool.query<{ id: string }>(
          'SELECT id FROM categories WHERE name = $1 OR slug = $1 LIMIT 1',
          [categoryName]
        )
        if (catResult.rows[0]?.id) {
          categoryId = String(catResult.rows[0].id)
        }
      } catch {
        // Table categories absente — insertion sans FK
      }
    }

    const imageUrl = productData.image_url || productData.main_image || null
    const imagesIsJsonb =
      cols.get('images')?.data_type === 'jsonb' ||
      cols.get('images')?.data_type === 'ARRAY'
    const imagesValue = this.parseImagesForDb(
      productData.images as string | string[] | undefined,
      imagesIsJsonb
    )

    const stockQty = productData.stock !== undefined ? Number(productData.stock) : 0
    const isActive =
      productData.is_active !== undefined ? Boolean(productData.is_active) : true
    const isAvailable =
      productData.is_available !== undefined
        ? Boolean(productData.is_available)
        : isActive

    const row: Record<string, unknown> = {}

    const idMeta = cols.get('id')
    if (idMeta && !idMeta.column_default) {
      if (idMeta.data_type === 'text' || idMeta.data_type === 'character varying') {
        row['id'] = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      }
    }

    if (cols.has('name')) row['name'] = productData.name
    if (cols.has('name_ar')) row['name_ar'] = productData.name_ar || null
    if (cols.has('description')) {
      row['description'] = productData.description || 'Description non fournie'
    }
    if (cols.has('price')) row['price'] = productData.price
    if (cols.has('original_price')) row['original_price'] = productData.original_price ?? null
    if (cols.has('category_id') && categoryId) row['category_id'] = categoryId
    if (cols.has('category')) row['category'] = categoryName
    if (cols.has('image_url')) row['image_url'] = imageUrl
    if (cols.has('images')) row['images'] = imagesValue
    if (cols.has('stock_quantity')) row['stock_quantity'] = stockQty
    else if (cols.has('stock')) row['stock'] = stockQty
    if (cols.has('is_available')) row['is_available'] = isAvailable
    if (cols.has('is_active')) row['is_active'] = isActive
    if (cols.has('is_featured')) {
      row['is_featured'] =
        productData.is_featured !== undefined ? Boolean(productData.is_featured) : false
    }
    if (cols.has('is_custom')) {
      row['is_custom'] =
        (productData as { is_custom?: boolean }).is_custom !== undefined
          ? Boolean((productData as { is_custom?: boolean }).is_custom)
          : false
    }
    if (cols.has('rating') && productData.rating != null) {
      row['rating'] = productData.rating
    }
    if (cols.has('reviews_count') && productData.reviews_count != null) {
      row['reviews_count'] = productData.reviews_count
    }

    const keys = Object.keys(row)
    const values = keys.map((k) => {
      if (k === 'images' && imagesIsJsonb) {
        const v = row[k]
        return typeof v === 'string' ? v : JSON.stringify(v ?? [])
      }
      return row[k]
    })
    const placeholders = keys.map((k, i) => {
      if (k === 'images' && imagesIsJsonb) return `$${i + 1}::jsonb`
      return `$${i + 1}`
    })

    const hasTimestamps = cols.has('created_at') && cols.has('updated_at')
    const columnsSql = hasTimestamps
      ? `${keys.join(', ')}, created_at, updated_at`
      : keys.join(', ')
    const valuesSql = hasTimestamps
      ? `${placeholders.join(', ')}, NOW(), NOW()`
      : placeholders.join(', ')

    try {
      const result = await this.pool.query<ProductRow>(
        `INSERT INTO products (${columnsSql}) VALUES (${valuesSql}) RETURNING *`,
        values
      )
      const inserted = result.rows[0]
      if (!inserted) {
        throw new Error('INSERT réussi mais aucune ligne retournée')
      }
      return this.mapProduct(inserted)
    } catch (error) {
      const pgCode = (error as { code?: string })?.code
      const pgMsg = error instanceof Error ? error.message : String(error)
      logger.error('[PostgresAdapter] createProduct error:', { code: pgCode, message: pgMsg })
      throw new Error(`Insertion Neon échouée: ${pgMsg}`)
    }
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<boolean> {
    try {
      const sets: string[] = []
      const values: unknown[] = []
      let idx = 1

      const fieldMap: Record<string, unknown> = {
        name: productData.name,
        name_ar: productData.name_ar,
        description: productData.description,
        price: productData.price,
        original_price: productData.original_price,
        is_active: productData.is_active,
        is_available: productData.is_available,
        is_featured: productData.is_featured,
        image_url: productData.image_url ?? productData.main_image,
        category: productData.category ?? productData.category_id,
      }

      if (productData.stock !== undefined) {
        fieldMap['stock_quantity'] = productData.stock
      }

      if (productData.images !== undefined) {
        const raw = productData.images
        fieldMap['images'] =
          typeof raw === 'string' ? raw : JSON.stringify(raw)
      }

      for (const [col, val] of Object.entries(fieldMap)) {
        if (val === undefined) continue
        if (col === 'images') {
          sets.push(`${col} = $${idx}::jsonb`)
        } else {
          sets.push(`${col} = $${idx}`)
        }
        values.push(val)
        idx++
      }

      if (sets.length === 0) return false

      sets.push('updated_at = NOW()')
      values.push(id)

      const result = await this.pool.query(
        `UPDATE products SET ${sets.join(', ')} WHERE id = $${idx}`,
        values
      )
      return (result.rowCount ?? 0) > 0
    } catch (error) {
      logger.error('[PostgresAdapter] updateProduct error:', error)
      return false
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const result = await this.pool.query('DELETE FROM products WHERE id = $1', [id])
      return (result.rowCount ?? 0) > 0
    } catch (error) {
      logger.error('[PostgresAdapter] deleteProduct error:', error)
      return false
    }
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const result = await this.pool.query('SELECT * FROM categories ORDER BY name')
    return result.rows.map((row: { id: unknown; name: string; slug: string; description?: string | null; image_url?: string | null }) => ({
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      image_url: row.image_url || undefined,
    }))
  }

  async createCategory(_categoryData: Partial<Category>): Promise<Category | null> {
    // TODO: Implémenter si nécessaire
    logger.warn('[PostgresAdapter] createCategory not yet implemented')
    return null
  }

  async updateCategory(_id: string, _categoryData: Partial<Category>): Promise<boolean> {
    // TODO: Implémenter si nécessaire
    logger.warn('[PostgresAdapter] updateCategory not yet implemented')
    return false
  }

  // Packs
  async getPacks(): Promise<Pack[]> {
    const result = await this.pool.query<PackRow>('SELECT * FROM packs ORDER BY created_at DESC')
    return result.rows.map((row: PackRow) => ({
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      price: Number(row.price),
      image_url: row.image_url || undefined,
      is_featured: Boolean(row.is_featured),
    }))
  }

  async getPackById(id: string): Promise<Pack | null> {
    const result = await this.pool.query<PackRow>(
      'SELECT * FROM packs WHERE id = $1 OR slug = $1',
      [id]
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    if (!row) return null
    return {
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      price: Number(row.price),
      image_url: row.image_url || undefined,
      is_featured: Boolean(row.is_featured),
    }
  }

  async createPack(packData: Partial<Pack>): Promise<Pack | null> {
    try {
      if (!packData.name || packData.price == null || !packData.slug) {
        logger.error('[PostgresAdapter] createPack: champs requis manquants')
        return null
      }

      const result = await this.pool.query<PackRow>(
        `INSERT INTO packs (name, slug, description, price, image_url, is_featured)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          packData.name,
          packData.slug,
          packData.description || null,
          packData.price,
          packData.image_url || null,
          packData.is_featured !== undefined ? Boolean(packData.is_featured) : false,
        ]
      )

      const row = result.rows[0]
      if (!row) return null

      return {
        id: String(row.id),
        name: row.name,
        slug: row.slug,
        description: row.description || undefined,
        price: Number(row.price),
        image_url: row.image_url || undefined,
        is_featured: Boolean(row.is_featured),
      }
    } catch (error) {
      logger.error('[PostgresAdapter] createPack error:', error)
      return null
    }
  }

  async updatePack(id: string, packData: Partial<Pack>): Promise<boolean> {
    try {
      const fields: string[] = []
      const values: unknown[] = []
      let i = 1

      const set = (column: string, value: unknown) => {
        fields.push(`${column} = $${i++}`)
        values.push(value)
      }

      if (packData.name !== undefined) set('name', packData.name)
      if (packData.slug !== undefined) set('slug', packData.slug)
      if (packData.description !== undefined) set('description', packData.description ?? null)
      if (packData.price !== undefined) set('price', packData.price)
      if (packData.image_url !== undefined) set('image_url', packData.image_url ?? null)
      if (packData.is_featured !== undefined) set('is_featured', Boolean(packData.is_featured))

      if (fields.length === 0) {
        logger.warn('[PostgresAdapter] updatePack: aucun champ à mettre à jour')
        return false
      }

      values.push(id)
      const result = await this.pool.query(
        `UPDATE packs SET ${fields.join(', ')} WHERE id::text = $${i} OR slug = $${i}`,
        values
      )
      return (result.rowCount ?? 0) > 0
    } catch (error) {
      logger.error('[PostgresAdapter] updatePack error:', error)
      return false
    }
  }

  async deletePack(id: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `DELETE FROM packs WHERE id::text = $1 OR slug = $1`,
        [id]
      )
      return (result.rowCount ?? 0) > 0
    } catch (error) {
      logger.error('[PostgresAdapter] deletePack error:', error)
      return false
    }
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    const result = await this.pool.query<OrderRow>('SELECT * FROM orders ORDER BY created_at DESC')
    return result.rows.map((row: OrderRow) => this.mapOrder(row))
  }

  async getOrderById(id: string): Promise<Order | null> {
    const result = await this.pool.query<OrderRow>(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    if (!row) return null
    return this.mapOrder(row)
  }

  async createOrder(orderData: {
    user_id: string | null
    total_amount: number
    status: string
    shipping_address?: unknown
    phone?: string
    notes?: string
  }): Promise<Order | null> {
    try {
      // shipping_address est souvent JSONB en Neon : une string brute → "invalid input syntax for type json"
      const addr = orderData.shipping_address
      let shippingValue: string | null = null
      if (addr != null && addr !== '') {
        if (typeof addr === 'string') {
          const trimmed = addr.trim()
          // Déjà du JSON valide ?
          try {
            JSON.parse(trimmed)
            shippingValue = trimmed
          } catch {
            shippingValue = JSON.stringify({ text: trimmed })
          }
        } else {
          shippingValue = JSON.stringify(addr)
        }
      }

      const params = [
        orderData.user_id || null,
        orderData.total_amount,
        orderData.status,
        shippingValue,
        orderData.phone || null,
        orderData.notes || null,
      ]

      try {
        const result = await this.pool.query(
          `INSERT INTO orders (user_id, total_amount, status, shipping_address, phone, notes)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6)
           RETURNING *`,
          params
        )
        if (result.rows.length === 0) return null
        return this.mapOrder(result.rows[0])
      } catch (jsonError) {
        const msg = jsonError instanceof Error ? jsonError.message : String(jsonError)
        // Colonne TEXT (pas jsonb) : réessayer sans cast
        if (!/json|jsonb/i.test(msg)) throw jsonError
        const plain =
          typeof addr === 'string'
            ? addr
            : addr == null
              ? null
              : JSON.stringify(addr)
        const result = await this.pool.query(
          `INSERT INTO orders (user_id, total_amount, status, shipping_address, phone, notes)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            orderData.user_id || null,
            orderData.total_amount,
            orderData.status,
            plain,
            orderData.phone || null,
            orderData.notes || null,
          ]
        )
        if (result.rows.length === 0) return null
        return this.mapOrder(result.rows[0])
      }
    } catch (error) {
      logger.error('[PostgresAdapter] createOrder error:', error)
      throw error
    }
  }

  async createOrderItem(itemData: {
    order_id: string
    bijou_id?: string
    pack_id?: string
    product_id?: string
    quantity: number
    price: number
    product_name?: string
  }): Promise<OrderItem | null> {
    const orderId = itemData.order_id
    const packId = itemData.pack_id ? String(itemData.pack_id) : null
    const productRef = String(itemData.bijou_id || itemData.product_id || '').trim()
    const qty = Number(itemData.quantity)
    const price = Number(itemData.price)
    const name = itemData.product_name ? String(itemData.product_name) : null

    // Ordre des tentatives : schémas Neon/Supabase varient (UUID FK vs TEXT, pack_id, product_id…)
    const attempts: Array<Record<string, unknown>> = []
    if (packId) {
      attempts.push({ order_id: orderId, bijou_id: null, pack_id: packId, quantity: qty, price })
      attempts.push({ order_id: orderId, pack_id: packId, quantity: qty, price })
    }
    if (productRef) {
      attempts.push({ order_id: orderId, bijou_id: productRef, pack_id: null, quantity: qty, price })
      attempts.push({ order_id: orderId, product_id: productRef, quantity: qty, price })
      attempts.push({
        order_id: orderId,
        bijou_id: productRef,
        quantity: qty,
        price,
        product_name: name,
      })
    }
    attempts.push({ order_id: orderId, quantity: qty, price })

    let lastError: unknown = null
    for (const payload of attempts) {
      const cols = Object.keys(payload)
      const values = Object.values(payload)
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await this.pool.query(
          `INSERT INTO order_items (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
          values
        )
        const row = result.rows[0] as
          | { id: number; order_id: number; bijou_id?: string | null; pack_id?: string | null; quantity: number; price: number }
          | undefined
        if (!row) continue
        return {
          id: String(row.id),
          order_id: String(row.order_id),
          bijou_id: String(row.bijou_id ?? productRef ?? ''),
          pack_id: row.pack_id != null && row.pack_id !== '' ? String(row.pack_id) : packId || undefined,
          quantity: Number(row.quantity),
          price: Number(row.price),
        }
      } catch (error) {
        lastError = error
        logger.warn('[PostgresAdapter] createOrderItem attempt failed', {
          cols,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    logger.error('[PostgresAdapter] createOrderItem exhausted attempts', lastError)
    throw lastError instanceof Error
      ? lastError
      : new Error('Impossible d’enregistrer la ligne de commande')
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const result = await this.pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    )
    return result.rows.map((row: { id: number; order_id: number; bijou_id: string; pack_id?: string | null; quantity: number; price: number }) => ({
      id: String(row.id),
      order_id: String(row.order_id),
      bijou_id: String(row.bijou_id ?? ''),
      pack_id: row.pack_id != null && row.pack_id !== '' ? String(row.pack_id) : undefined,
      quantity: Number(row.quantity),
      price: Number(row.price),
    }))
  }

  async updateOrderStatus(id: string, status: string): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [status, id]
    )
    return (result.rowCount ?? 0) > 0
  }

  // Cart
  async getCartItems(userId: string): Promise<CartItem[]> {
    const result = await this.pool.query(
      'SELECT * FROM cart_items WHERE user_id = $1',
      [userId]
    )
    return result.rows.map((row: { id: unknown; user_id: unknown; bijou_id: unknown; quantity: string | number }) => ({
      id: String(row.id),
      user_id: String(row.user_id),
      bijou_id: String(row.bijou_id),
      quantity: Number(row.quantity),
    }))
  }

  async addToCart(userId: string, bijouId: string, quantity: number = 1): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO cart_items (user_id, bijou_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, bijou_id) DO UPDATE SET quantity = cart_items.quantity + $3`,
      [userId, bijouId, quantity]
    )
    return (result.rowCount ?? 0) > 0
  }

  async updateCartQuantity(userId: string, bijouId: string, quantity: number): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND bijou_id = $3',
      [quantity, userId, bijouId]
    )
    return (result.rowCount ?? 0) > 0
  }

  async removeFromCart(userId: string, bijouId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM cart_items WHERE user_id = $1 AND bijou_id = $2',
      [userId, bijouId]
    )
    return (result.rowCount ?? 0) > 0
  }

  async getAllActiveCarts(): Promise<{ user_id: string; bijou_id: string; quantity: number }[]> {
    const result = await this.pool.query(
      'SELECT user_id, bijou_id, quantity FROM cart_items'
    )
    return result.rows.map((row: { user_id: unknown; bijou_id: unknown; quantity: string | number }) => ({
      user_id: String(row.user_id),
      bijou_id: String(row.bijou_id),
      quantity: Number(row.quantity),
    }))
  }

  // Favorites
  async getFavorites(userId: string): Promise<Favorite[]> {
    const result = await this.pool.query(
      'SELECT * FROM favorites WHERE user_id = $1',
      [userId]
    )
    return result.rows.map((row: { id: number; user_id: number; bijou_id: number | null; pack_id?: number | null }) => ({
      id: String(row.id),
      user_id: String(row.user_id),
      bijou_id: row.bijou_id != null ? String(row.bijou_id) : '',
      ...(row.pack_id != null ? { pack_id: String(row.pack_id) } : {}),
    }))
  }

  async addToFavorites(userId: string, bijouId?: string | null, packId?: string | null): Promise<boolean> {
    const bid = bijouId != null && bijouId !== '' ? bijouId : null
    const pid = packId != null && packId !== '' ? packId : null
    if (!bid && !pid) return false
    try {
      const result = await this.pool.query(
        `INSERT INTO favorites (user_id, bijou_id, pack_id) VALUES ($1, $2, $3)`,
        [userId, bid, pid]
      )
      return (result.rowCount ?? 0) > 0
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code === '23505') return true
      throw err
    }
  }

  async removeFromFavorites(userId: string, bijouId?: string | null, packId?: string | null): Promise<boolean> {
    if (bijouId != null && bijouId !== '') {
      const result = await this.pool.query('DELETE FROM favorites WHERE user_id = $1 AND bijou_id = $2', [userId, bijouId])
      return (result.rowCount ?? 0) > 0
    }
    if (packId != null && packId !== '') {
      const result = await this.pool.query('DELETE FROM favorites WHERE user_id = $1 AND pack_id = $2', [userId, packId])
      return (result.rowCount ?? 0) > 0
    }
    return false
  }

  // Payments
  async createPayment(paymentData: {
    order_id: string
    amount: number
    payment_method: string
    status?: string
    transaction_id?: string
  }): Promise<Payment | null> {
    const result = await this.pool.query<PaymentRow>(
      `INSERT INTO payments (order_id, amount, payment_method, status, transaction_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        paymentData.order_id,
        paymentData.amount,
        paymentData.payment_method,
        paymentData.status || 'pending',
        paymentData.transaction_id || null,
      ]
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    if (!row) return null
    return this.mapPayment(row)
  }

  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    const result = await this.pool.query<PaymentRow>(
      'SELECT * FROM payments WHERE order_id = $1',
      [orderId]
    )
    return result.rows.map((row: PaymentRow) => this.mapPayment(row))
  }

  async getAllPayments(): Promise<Payment[]> {
    const result = await this.pool.query<PaymentRow>('SELECT * FROM payments ORDER BY created_at DESC')
    return result.rows.map((row: PaymentRow) => this.mapPayment(row))
  }

  async updatePaymentStatus(id: string, status: string): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE payments SET status = $1 WHERE id = $2',
      [status, id]
    )
    return (result.rowCount ?? 0) > 0
  }

  // Notifications
  async createNotification(notificationData: {
    user_id?: string | null
    title: string
    message: string
    type?: string
    link?: string
  }): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO notifications (user_id, title, message, type, action_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        notificationData.user_id || null,
        notificationData.title,
        notificationData.message,
        notificationData.type || 'info',
        notificationData.link || null,
      ]
    )
    return (result.rowCount ?? 0) > 0
  }

  async getNotifications(userId?: string | null): Promise<Notification[]> {
    let query = 'SELECT * FROM notifications'
    const params: (string | null)[] = []

    if (userId != null && userId !== '') {
      query += ' WHERE user_id = $1'
      params.push(userId)
    } else {
      query += ' WHERE user_id IS NULL'
    }

    query += ' ORDER BY created_at DESC'

    const result = await this.pool.query(query, params)
    return result.rows.map((row: { id: unknown; user_id?: unknown; title: string; message: string; type?: string | null; is_read?: boolean; created_at?: string | Date; action_url?: string | null }) => ({
      id: String(row.id),
      user_id: row.user_id ? String(row.user_id) : undefined,
      title: row.title,
      message: row.message,
      type: row.type || undefined,
      is_read: Boolean(row.is_read),
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      action_url: row.action_url || undefined,
    }))
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1',
      [id]
    )
    return (result.rowCount ?? 0) > 0
  }

  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const [productsResult, ordersResult, usersResult, revenueResult] = await Promise.all([
      this.pool.query('SELECT COUNT(*) as count FROM products WHERE is_active = true'),
      this.pool.query('SELECT COUNT(*) as count FROM orders'),
      this.pool.query('SELECT COUNT(*) as count FROM users'),
      this.pool.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != \'cancelled\''),
    ])

    return {
      totalProducts: parseInt(productsResult.rows[0]?.count || '0', 10),
      totalOrders: parseInt(ordersResult.rows[0]?.count || '0', 10),
      totalUsers: parseInt(usersResult.rows[0]?.count || '0', 10),
      totalRevenue: parseFloat(revenueResult.rows[0]?.total || '0'),
    }
  }

  // Utility
  async testConnection(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1')
      return true
    } catch (error) {
      logger.error('[PostgresAdapter] Connection test failed:', error)
      return false
    }
  }

  // Mappers
  private mapUser(row: UserRow): User {
    return {
      id: String(row.id),
      phone: row.phone,
      password_hash: row.password_hash,
      first_name: row.first_name || undefined,
      last_name: row.last_name || undefined,
      role: row.role || 'user',
      created_at: row.created_at ? (typeof row.created_at === 'string' ? row.created_at : row.created_at.toISOString()) : undefined,
      updated_at: row.updated_at ? (typeof row.updated_at === 'string' ? row.updated_at : row.updated_at.toISOString()) : undefined,
    }
  }

  private mapProduct(row: ProductRow): Product {
    let imagesArray: string[] = []
    const imagesValue = row.images
    if (imagesValue) {
      if (Array.isArray(imagesValue)) {
        imagesArray = imagesValue
      } else if (typeof imagesValue === 'string') {
        try {
          imagesArray = JSON.parse(imagesValue) as string[]
        } catch {
          imagesArray = [imagesValue]
        }
      }
    }

    const imageUrl = row.image_url || row.main_image || '/placeholder.svg'
    const mainImage = row.main_image || row.image_url || '/placeholder.svg'
    const categoryId = row.category_id ? String(row.category_id) : (row.category || 'Général')
    const category = row.category || (row.category_id ? String(row.category_id) : 'Général')

    return {
      id: String(row.id),
      name: row.name || 'Produit sans nom',
      name_ar: row.name_ar || undefined,
      description: row.description || undefined,
      price: Number(row.price) || 0,
      original_price: row.original_price ? Number(row.original_price) : undefined,
      image_url: imageUrl,
      main_image: mainImage,
      images: imagesArray.length > 0 ? imagesArray : undefined,
      category_id: categoryId,
      category: category,
      is_available: row.is_available !== undefined ? Boolean(row.is_available) : (row.is_active !== undefined ? Boolean(row.is_active) : true),
      is_active: row.is_active !== undefined ? Boolean(row.is_active) : true,
      is_featured: Boolean(row.is_featured),
      stock:
        row.stock_quantity != null
          ? Number(row.stock_quantity)
          : row.stock != null
            ? Number(row.stock)
            : undefined,
      rating: row.rating ? Number(row.rating) : undefined,
      reviews_count: row.reviews_count ? Number(row.reviews_count) : undefined,
      created_at: row.created_at ? (typeof row.created_at === 'string' ? row.created_at : row.created_at.toISOString()) : undefined,
      updated_at: row.updated_at ? (typeof row.updated_at === 'string' ? row.updated_at : row.updated_at.toISOString()) : undefined,
    }
  }

  private mapOrder(row: OrderRow): Order {
    let shippingAddress: unknown = null
    const shippingAddressValue = row.shipping_address
    if (shippingAddressValue) {
      if (typeof shippingAddressValue === 'string') {
        try {
          shippingAddress = JSON.parse(shippingAddressValue)
        } catch {
          shippingAddress = shippingAddressValue
        }
      } else {
        shippingAddress = shippingAddressValue
      }
    }

    return {
      id: String(row.id),
      user_id: row.user_id ? String(row.user_id) : null,
      total_amount: Number(row.total_amount),
      status: row.status || 'pending',
      shipping_address: shippingAddress || undefined,
      phone: row.phone || undefined,
      notes: row.notes || undefined,
      created_at: row.created_at ? (typeof row.created_at === 'string' ? row.created_at : row.created_at.toISOString()) : new Date().toISOString(),
    }
  }

  private mapPayment(row: PaymentRow): Payment {
    return {
      id: String(row.id),
      order_id: String(row.order_id),
      amount: Number(row.amount),
      payment_method: row.payment_method,
      status: row.status || 'pending',
      transaction_id: row.transaction_id || null,
    }
  }
}

