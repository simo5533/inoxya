/**
 * Interface pour les adapters de base de données
 * Permet de switcher entre SQLite (dev) et Postgres (prod)
 */

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

export interface DatabaseAdapter {
  // Users
  getUserByPhone(phone: string): Promise<User | null>
  getUserById(id: string): Promise<User | null>
  createUser(userData: {
    phone: string
    password_hash: string
    first_name?: string
    last_name?: string
    role?: string
  }): Promise<User | null>
  getAllUsers(): Promise<User[]>
  updateUserRole(userId: string, newRole: string): Promise<boolean>

  // Products
  getProducts(categorySlug?: string): Promise<Product[]>
  getProductById(id: string): Promise<Product | null>
  createProduct(productData: Partial<Product> & { name: string; price: number }): Promise<Product | null>
  updateProduct(id: string, productData: Partial<Product>): Promise<boolean>
  deleteProduct(id: string): Promise<boolean>

  // Categories
  getCategories(): Promise<Category[]>
  createCategory(categoryData: Partial<Category> & { name: string; slug: string }): Promise<Category | null>
  updateCategory(id: string, categoryData: Partial<Category>): Promise<boolean>

  // Packs
  getPacks(): Promise<Pack[]>
  getPackById(id: string): Promise<Pack | null>
  createPack(packData: Partial<Pack> & { name: string; slug: string; price: number }): Promise<Pack | null>
  updatePack(id: string, packData: Partial<Pack>): Promise<boolean>
  deletePack(id: string): Promise<boolean>

  // Orders
  getOrders(): Promise<Order[]>
  getOrderById(id: string): Promise<Order | null>
  createOrder(orderData: {
    user_id: string | null
    total_amount: number
    status: string
    shipping_address?: unknown
    phone?: string
    notes?: string
  }): Promise<Order | null>
  createOrderItem(itemData: {
    order_id: string
    bijou_id?: string
    product_id?: string
    quantity: number
    price: number
    product_name?: string
  }): Promise<OrderItem | null>
  getOrderItems(orderId: string): Promise<OrderItem[]>
  updateOrderStatus(id: string, status: string): Promise<boolean>

  // Cart
  getCartItems(userId: string): Promise<CartItem[]>
  addToCart(userId: string, bijouId: string, quantity: number): Promise<boolean>
  updateCartQuantity(userId: string, bijouId: string, quantity: number): Promise<boolean>
  removeFromCart(userId: string, bijouId: string): Promise<boolean>

  // Favorites
  getFavorites(userId: string): Promise<Favorite[]>
  addToFavorites(userId: string, bijouId: string): Promise<boolean>
  removeFromFavorites(userId: string, bijouId: string): Promise<boolean>

  // Payments
  createPayment(paymentData: {
    order_id: string
    amount: number
    payment_method: string
    status?: string
    transaction_id?: string
  }): Promise<Payment | null>
  getPaymentsByOrderId(orderId: string): Promise<Payment[]>
  getAllPayments(): Promise<Payment[]>
  updatePaymentStatus(id: string, status: string): Promise<boolean>

  // Notifications
  createNotification(notificationData: {
    user_id?: string | null
    title: string
    message: string
    type?: string
    link?: string
  }): Promise<boolean>
  getNotifications(userId?: string | null): Promise<Notification[]>
  markNotificationAsRead(id: string): Promise<boolean>

  // Stats
  getDashboardStats(): Promise<DashboardStats>

  // Settings (optionnel : Supabase uniquement pour l’instant)
  getSettings?(): Promise<Record<string, unknown>>
  updateSettings?(settings: Record<string, unknown>): Promise<boolean>

  // Utility
  testConnection(): Promise<boolean>
}

