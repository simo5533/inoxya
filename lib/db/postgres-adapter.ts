/**
 * Adapter PostgreSQL - Pour production sur Vercel
 * Utilise pg (node-postgres) pour se connecter à Postgres
 */

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

export class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool

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
    this.pool.on('error', (err) => {
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
    return result.rows.filter((row): row is UserRow => row != null).map(row => this.mapUser(row))
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
    return result.rows.map(row => this.mapProduct(row))
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

  async createProduct(_productData: Partial<Product>): Promise<Product | null> {
    // TODO: Implémenter si nécessaire
    logger.warn('[PostgresAdapter] createProduct not yet implemented')
    return null
  }

  async updateProduct(_id: string, _productData: Partial<Product>): Promise<boolean> {
    // TODO: Implémenter si nécessaire
    logger.warn('[PostgresAdapter] updateProduct not yet implemented')
    return false
  }

  async deleteProduct(_id: string): Promise<boolean> {
    // TODO: Implémenter si nécessaire
    logger.warn('[PostgresAdapter] deleteProduct not yet implemented')
    return false
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const result = await this.pool.query('SELECT * FROM categories ORDER BY name')
    return result.rows.map(row => ({
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
    return result.rows.map(row => ({
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

  async createPack(_packData: Partial<Pack>): Promise<Pack | null> {
    // TODO: Implémenter si nécessaire
    logger.warn('[PostgresAdapter] createPack not yet implemented')
    return null
  }

  async updatePack(_id: string, _packData: Partial<Pack>): Promise<boolean> {
    // TODO: Implémenter si nécessaire
    logger.warn('[PostgresAdapter] updatePack not yet implemented')
    return false
  }

  async deletePack(_id: string): Promise<boolean> {
    // TODO: Implémenter si nécessaire
    logger.warn('[PostgresAdapter] deletePack not yet implemented')
    return false
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    const result = await this.pool.query<OrderRow>('SELECT * FROM orders ORDER BY created_at DESC')
    return result.rows.map(row => this.mapOrder(row))
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
    const result = await this.pool.query(
      `INSERT INTO orders (user_id, total_amount, status, shipping_address, phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        orderData.user_id,
        orderData.total_amount,
        orderData.status,
        orderData.shipping_address ? JSON.stringify(orderData.shipping_address) : null,
        orderData.phone || null,
        orderData.notes || null,
      ]
    )
    if (result.rows.length === 0) return null
    return this.mapOrder(result.rows[0])
  }

  async createOrderItem(itemData: {
    order_id: string
    bijou_id?: string
    product_id?: string
    quantity: number
    price: number
    product_name?: string
  }): Promise<OrderItem | null> {
    const bijou_id = itemData.bijou_id || itemData.product_id || ''
    if (!bijou_id) {
      return null
    }
    
    const result = await this.pool.query(
      `INSERT INTO order_items (order_id, bijou_id, quantity, price)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [itemData.order_id, bijou_id, itemData.quantity, itemData.price]
    )
    
    if (result.rows.length === 0) return null
    
    const row = result.rows[0]
    return {
      id: String(row.id),
      order_id: String(row.order_id),
      bijou_id: String(row.bijou_id),
      quantity: Number(row.quantity),
      price: Number(row.price),
    }
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const result = await this.pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    )
    return result.rows.map(row => ({
      id: String(row.id),
      order_id: String(row.order_id),
      bijou_id: String(row.bijou_id),
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
    return result.rows.map(row => ({
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

  // Favorites
  async getFavorites(userId: string): Promise<Favorite[]> {
    const result = await this.pool.query(
      'SELECT * FROM favorites WHERE user_id = $1',
      [userId]
    )
    return result.rows.map(row => ({
      id: String(row.id),
      user_id: String(row.user_id),
      bijou_id: String(row.bijou_id),
    }))
  }

  async addToFavorites(userId: string, bijouId: string): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO favorites (user_id, bijou_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, bijou_id) DO NOTHING`,
      [userId, bijouId]
    )
    return (result.rowCount ?? 0) > 0
  }

  async removeFromFavorites(userId: string, bijouId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND bijou_id = $2',
      [userId, bijouId]
    )
    return (result.rowCount ?? 0) > 0
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
    return result.rows.map(row => this.mapPayment(row))
  }

  async getAllPayments(): Promise<Payment[]> {
    const result = await this.pool.query<PaymentRow>('SELECT * FROM payments ORDER BY created_at DESC')
    return result.rows.map(row => this.mapPayment(row))
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
    return result.rows.map(row => ({
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

