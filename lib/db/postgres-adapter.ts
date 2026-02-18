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

export class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool

  constructor(databaseUrl: string) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })

    // Gérer les erreurs de connexion
    this.pool.on('error', (err) => {
      logger.error('[PostgresAdapter] Pool error:', err)
    })
  }

  // Users
  async getUserByPhone(phone: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    )
    if (result.rows.length === 0) return null
    return this.mapUser(result.rows[0])
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) return null
    return this.mapUser(result.rows[0])
  }

  async createUser(userData: {
    phone: string
    password_hash: string
    first_name?: string
    last_name?: string
    role?: string
  }): Promise<User | null> {
    const result = await this.pool.query(
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
    return this.mapUser(result.rows[0])
  }

  async getAllUsers(): Promise<User[]> {
    const result = await this.pool.query('SELECT * FROM users ORDER BY created_at DESC')
    return result.rows.map(row => this.mapUser(row))
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
    const params: any[] = []

    if (categorySlug) {
      const dbValue = slugToDbValue(categorySlug)
      if (dbValue) {
        query = 'SELECT * FROM products WHERE (is_active = true OR is_active IS NULL) AND (is_available = true OR is_available IS NULL) AND category = $1 ORDER BY created_at DESC'
        params.push(dbValue)
      }
    }

    const result = await this.pool.query(query, params)
    return result.rows.map(row => this.mapProduct(row))
  }

  async getProductById(id: string): Promise<Product | null> {
    const result = await this.pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) return null
    return this.mapProduct(result.rows[0])
  }

  async createProduct(_productData: any): Promise<Product | null> {
    // TODO: Implémenter si nécessaire
    logger.warn('[PostgresAdapter] createProduct not yet implemented')
    return null
  }

  async updateProduct(_id: string, _productData: any): Promise<boolean> {
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

  async createCategory(_categoryData: any): Promise<Category | null> {
    // TODO: Implémenter si nécessaire
    logger.warn('[PostgresAdapter] createCategory not yet implemented')
    return null
  }

  async updateCategory(_id: string, _categoryData: any): Promise<boolean> {
    // TODO: Implémenter si nécessaire
    logger.warn('[PostgresAdapter] updateCategory not yet implemented')
    return false
  }

  // Packs
  async getPacks(): Promise<Pack[]> {
    const result = await this.pool.query('SELECT * FROM packs ORDER BY created_at DESC')
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
    const result = await this.pool.query(
      'SELECT * FROM packs WHERE id = $1 OR slug = $1',
      [id]
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
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

  async createPack(_packData: any): Promise<Pack | null> {
    // TODO: Implémenter si nécessaire
    logger.warn('[PostgresAdapter] createPack not yet implemented')
    return null
  }

  async updatePack(_id: string, _packData: any): Promise<boolean> {
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
    const result = await this.pool.query('SELECT * FROM orders ORDER BY created_at DESC')
    return result.rows.map(row => this.mapOrder(row))
  }

  async getOrderById(id: string): Promise<Order | null> {
    const result = await this.pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) return null
    return this.mapOrder(result.rows[0])
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
    bijou_id: string
    quantity: number
    price: number
  }): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO order_items (order_id, bijou_id, quantity, price)
       VALUES ($1, $2, $3, $4)`,
      [itemData.order_id, itemData.bijou_id, itemData.quantity, itemData.price]
    )
    return (result.rowCount ?? 0) > 0
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
    const result = await this.pool.query(
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
    return this.mapPayment(result.rows[0])
  }

  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    const result = await this.pool.query(
      'SELECT * FROM payments WHERE order_id = $1',
      [orderId]
    )
    return result.rows.map(row => this.mapPayment(row))
  }

  async getAllPayments(): Promise<Payment[]> {
    const result = await this.pool.query('SELECT * FROM payments ORDER BY created_at DESC')
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
    const params: any[] = []

    if (userId) {
      query += ' WHERE user_id = $1'
      params.push(userId)
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
  private mapUser(row: any): User {
    return {
      id: String(row.id),
      phone: row.phone,
      password_hash: row.password_hash,
      first_name: row.first_name || undefined,
      last_name: row.last_name || undefined,
      role: row.role || 'user',
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    }
  }

  private mapProduct(row: any): Product {
    let imagesArray: string[] = []
    if (row.images) {
      if (Array.isArray(row.images)) {
        imagesArray = row.images
      } else if (typeof row.images === 'string') {
        try {
          imagesArray = JSON.parse(row.images)
        } catch {
          imagesArray = []
        }
      }
    }

    return {
      id: String(row.id),
      name: row.name || 'Produit sans nom',
      name_ar: row.name_ar || undefined,
      description: row.description || undefined,
      price: Number(row.price) || 0,
      original_price: row.original_price ? Number(row.original_price) : undefined,
      image_url: row.image_url || row.main_image || '/placeholder.svg',
      main_image: row.main_image || row.image_url || '/placeholder.svg',
      images: imagesArray.length > 0 ? imagesArray : undefined,
      category_id: row.category_id || row.category || 'Général',
      category: row.category || row.category_id || 'Général',
      is_available: row.is_available !== undefined ? Boolean(row.is_available) : (row.is_active !== undefined ? Boolean(row.is_active) : true),
      is_active: row.is_active !== undefined ? Boolean(row.is_active) : true,
      is_featured: Boolean(row.is_featured),
      rating: row.rating ? Number(row.rating) : undefined,
      reviews_count: row.reviews_count ? Number(row.reviews_count) : undefined,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    }
  }

  private mapOrder(row: any): Order {
    let shippingAddress: unknown = null
    if (row.shipping_address) {
      if (typeof row.shipping_address === 'string') {
        try {
          shippingAddress = JSON.parse(row.shipping_address)
        } catch {
          shippingAddress = row.shipping_address
        }
      } else {
        shippingAddress = row.shipping_address
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
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    }
  }

  private mapPayment(row: any): Payment {
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

