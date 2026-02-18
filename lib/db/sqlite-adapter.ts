/**
 * Adapter SQLite - Wrapper autour de lib/sqlite.ts
 * Utilisé en développement local
 */

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
import {
  getUserByPhone,
  getUserById,
  createUser,
  getAllUsers,
  updateUserRole,
  getProductsAsync,
  getProductByIdAsync,
  getCategories,
  getPacksAsync,
  getOrders,
  createOrder,
  createOrderItem,
  getOrderById,
  getOrderItems,
  updateOrderStatus,
  getCartItems,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  createPayment,
  getPaymentsByOrderId,
  getAllPayments,
  updatePaymentStatus,
  createNotification,
  getNotifications,
  markNotificationAsRead,
  getDashboardStats,
  testConnection,
} from '../sqlite'
import { slugToDbValue } from '../category-mapping'
import { logger } from '../logger'

export class SqliteAdapter implements DatabaseAdapter {
  // Users
  async getUserByPhone(phone: string): Promise<User | null> {
    return Promise.resolve(getUserByPhone(phone))
  }

  async getUserById(id: string): Promise<User | null> {
    return Promise.resolve(getUserById(id))
  }

  async createUser(userData: {
    phone: string
    password_hash: string
    first_name?: string
    last_name?: string
    role?: string
  }): Promise<User | null> {
    return Promise.resolve(createUser(userData))
  }

  async getAllUsers(): Promise<User[]> {
    return getAllUsers() as User[]
  }

  async updateUserRole(userId: string, newRole: string): Promise<boolean> {
    return updateUserRole(userId, newRole)
  }

  // Products
  async getProducts(categorySlug?: string): Promise<Product[]> {
    const products = await getProductsAsync()
    
    // Filtrer par catégorie si fourni
    if (categorySlug) {
      const dbValue = slugToDbValue(categorySlug)
      if (dbValue) {
        return products.filter((p: any) => 
          p.category === dbValue || p.category_id === dbValue
        ) as Product[]
      }
    }
    
    return products as Product[]
  }

  async getProductById(id: string): Promise<Product | null> {
    return await getProductByIdAsync(id) as Product | null
  }

  async createProduct(_productData: any): Promise<Product | null> {
    // TODO: Implémenter si nécessaire
    logger.warn('[SqliteAdapter] createProduct not yet implemented')
    return null
  }

  async updateProduct(_id: string, _productData: any): Promise<boolean> {
    // TODO: Implémenter si nécessaire
    logger.warn('[SqliteAdapter] updateProduct not yet implemented')
    return false
  }

  async deleteProduct(_id: string): Promise<boolean> {
    // TODO: Implémenter si nécessaire
    logger.warn('[SqliteAdapter] deleteProduct not yet implemented')
    return false
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return getCategories() as Category[]
  }

  async createCategory(_categoryData: any): Promise<Category | null> {
    // TODO: Implémenter si nécessaire
    logger.warn('[SqliteAdapter] createCategory not yet implemented')
    return null
  }

  async updateCategory(_id: string, _categoryData: any): Promise<boolean> {
    // TODO: Implémenter si nécessaire
    logger.warn('[SqliteAdapter] updateCategory not yet implemented')
    return false
  }

  // Packs
  async getPacks(): Promise<Pack[]> {
    return await getPacksAsync() as Pack[]
  }

  async getPackById(id: string): Promise<Pack | null> {
    const packs = await getPacksAsync()
    return (packs.find((p: any) => p.id === id || p.slug === id) || null) as Pack | null
  }

  async createPack(_packData: any): Promise<Pack | null> {
    // TODO: Implémenter si nécessaire
    logger.warn('[SqliteAdapter] createPack not yet implemented')
    return null
  }

  async updatePack(_id: string, _packData: any): Promise<boolean> {
    // TODO: Implémenter si nécessaire
    logger.warn('[SqliteAdapter] updatePack not yet implemented')
    return false
  }

  async deletePack(_id: string): Promise<boolean> {
    // TODO: Implémenter si nécessaire
    logger.warn('[SqliteAdapter] deletePack not yet implemented')
    return false
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return getOrders() as Order[]
  }

  async getOrderById(id: string): Promise<Order | null> {
    return getOrderById(id) as Order | null
  }

  async createOrder(orderData: {
    user_id: string | null
    total_amount: number
    status: string
    shipping_address?: unknown
    phone?: string
    notes?: string
  }): Promise<Order | null> {
    const result = createOrder(orderData)
    if (!result) return null
    return {
      id: result.id,
      ...orderData,
      created_at: new Date().toISOString(),
    } as Order
  }

  async createOrderItem(itemData: {
    order_id: string
    bijou_id: string
    quantity: number
    price: number
  }): Promise<boolean> {
    return createOrderItem(itemData)
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return getOrderItems(orderId) as OrderItem[]
  }

  async updateOrderStatus(id: string, status: string): Promise<boolean> {
    return updateOrderStatus(id, status)
  }

  // Cart
  async getCartItems(userId: string): Promise<CartItem[]> {
    return getCartItems(userId) as CartItem[]
  }

  async addToCart(userId: string, bijouId: string, quantity: number = 1): Promise<boolean> {
    return addToCart(userId, bijouId, quantity)
  }

  async updateCartQuantity(userId: string, bijouId: string, quantity: number): Promise<boolean> {
    return updateCartQuantity(userId, bijouId, quantity)
  }

  async removeFromCart(userId: string, bijouId: string): Promise<boolean> {
    return removeFromCart(userId, bijouId)
  }

  // Favorites
  async getFavorites(userId: string): Promise<Favorite[]> {
    return getFavorites(userId) as Favorite[]
  }

  async addToFavorites(userId: string, bijouId: string): Promise<boolean> {
    return addToFavorites(userId, bijouId)
  }

  async removeFromFavorites(userId: string, bijouId: string): Promise<boolean> {
    return removeFromFavorites(userId, bijouId)
  }

  // Payments
  async createPayment(paymentData: {
    order_id: string
    amount: number
    payment_method: string
    status?: string
    transaction_id?: string
  }): Promise<Payment | null> {
    const result = createPayment(paymentData)
    return result as Payment | null
  }

  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    return getPaymentsByOrderId(orderId) as Payment[]
  }

  async getAllPayments(): Promise<Payment[]> {
    return getAllPayments() as Payment[]
  }

  async updatePaymentStatus(id: string, status: string): Promise<boolean> {
    return updatePaymentStatus(id, status)
  }

  // Notifications
  async createNotification(notificationData: {
    user_id?: string | null
    title: string
    message: string
    type?: string
    link?: string
  }): Promise<boolean> {
    // Mapper link vers action_url pour compatibilité avec sqlite.ts
    return createNotification({
      ...notificationData,
      action_url: notificationData.link,
      is_read: false,
    })
  }

  async getNotifications(userId?: string | null): Promise<Notification[]> {
    return getNotifications(userId) as Notification[]
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    return markNotificationAsRead(id)
  }

  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const stats = getDashboardStats()
    return {
      totalProducts: stats.totalBijoux,
      totalOrders: stats.totalOrders,
      totalUsers: stats.totalUsers,
      totalRevenue: stats.totalRevenue
    }
  }

  // Utility
  async testConnection(): Promise<boolean> {
    return testConnection()
  }
}

