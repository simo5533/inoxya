/**
 * Couche d'accès aux données INOXYA BIJOUX
 * Utilise SQLite (dev) ou Postgres (prod) selon DATABASE_URL
 */

import bcrypt from 'bcryptjs'
import { getDatabaseAdapter } from './db'
import { slugToDbValue } from './category-mapping'
import { logger } from './logger'

// Import SQLite direct pour fallback et compatibilité
import {
  getUserByPhone as getSqliteUserByPhone,
  getUserById as getSqliteUserById,
  createUser as createSqliteUser,
  getAllUsers as getSqliteAllUsers,
  updateUserRole as updateSqliteUserRole,
  getProductsAsync as getSqliteProductsAsync,
  getProductByIdAsync as getSqliteProductByIdAsync,
  getCategories as getSqliteCategories,
  getPacksAsync as getSqlitePacksAsync,
  getDashboardStats as getSqliteDashboardStats,
  getOrders as getSqliteOrders,
  createOrder as createSqliteOrder,
  createOrderItem as createSqliteOrderItem,
  createPayment as createSqlitePayment,
  createNotification as createSqliteNotification,
  createOrderFull as createSqliteOrderFull,
  getCartItems as getSqliteCartItems,
  addToCart as addSqliteToCart,
  updateCartQuantity as updateSqliteCartQuantity,
  removeFromCart as removeSqliteFromCart,
  getFavorites as getSqliteFavorites,
  addToFavorites as addSqliteToFavorites,
  removeFromFavorites as removeSqliteFromFavorites,
  getOrderById as getSqliteOrderById,
  getOrderItems as getSqliteOrderItems,
  getPaymentsByOrderId as getSqlitePaymentsByOrderId,
  updateOrderStatus as updateSqliteOrderStatus,
  updatePaymentStatus as updateSqlitePaymentStatus,
  getAllPayments as getSqliteAllPayments,
  getNotifications as getSqliteNotifications,
  markNotificationAsRead as markSqliteNotificationAsRead,
  getAllActiveCarts as getSqliteAllActiveCarts,
  trimProductsToLimit as trimSqliteProductsToLimit,
  testConnection as testSqliteConnection,
  selectAsync,
  serializeError,
} from './sqlite'

// ==================== BIJOUX ====================

export async function getBijouxVedettes(limit = 8) {
  try {
    // Essayer d'utiliser l'adapter DB (Postgres ou SQLite)
    try {
      const adapter = await getDatabaseAdapter()
      const products = await adapter.getProducts()
      const activeProducts = products.filter((p) => p.is_available === true)
      const featured = activeProducts.filter((p) => p.is_featured === true)
      const result = featured.length > 0 
        ? featured.slice(0, limit)
        : activeProducts.slice(0, limit)
      return result
    } catch (adapterError) {
      // Fallback vers SQLite direct si adapter échoue
      logger.warn('[getBijouxVedettes] Adapter failed, using SQLite fallback:', serializeError(adapterError))
      
      const { forceConnection, initSqlJsAsync } = await import('./sqlite')
      let isConnected = forceConnection()
      if (!isConnected) {
        isConnected = await initSqlJsAsync()
        if (isConnected) {
          isConnected = forceConnection()
        }
      }
      if (isConnected) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      const products = await getSqliteProductsAsync()
      const activeProducts = products.filter((p: any) => p.is_available === true)
      const featured = activeProducts.filter((p: any) => p.is_featured === true)
      const result = featured.length > 0 
        ? featured.slice(0, limit)
        : activeProducts.slice(0, limit)
      return result
    }
  } catch (error) {
    logger.error('Erreur getBijouxVedettes:', error)
    return []
  }
}

export async function getAllBijoux(categorySlug?: string) {
  try {
    // S'assurer que sql.js est initialisé si better-sqlite3 n'est pas disponible
    const { forceConnection, initSqlJsAsync } = await import('./sqlite')
    
    // Forcer la connexion d'abord
    let isConnected = forceConnection()
    
    // Si forceConnection() retourne false, essayer initSqlJsAsync()
    if (!isConnected) {
      isConnected = await initSqlJsAsync()
      // Réessayer forceConnection après initSqlJsAsync
      if (isConnected) {
        isConnected = forceConnection()
      }
    }
    
    // Attendre un peu pour s'assurer que la DB est complètement chargée
    if (isConnected) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    // Si un slug de catégorie est fourni, filtrer par catégorie
    if (categorySlug) {
      const dbValue = slugToDbValue(categorySlug)
      if (dbValue) {
        // Utiliser selectAsync pour filtrer par catégorie
        const { initializeDatabase } = await import('./sqlite')
        initializeDatabase()
        
        const sqlQuery = 'SELECT * FROM products WHERE (is_active = 1 OR is_active IS NULL) AND category = ? ORDER BY created_at DESC'
        const products = await selectAsync(sqlQuery, [dbValue]) as any[]
        
        return products.map((product: any) => ({
          id: String(product.id || ''),
          name: product.name || 'Produit sans nom',
          name_ar: product.name_ar,
          description: product.description,
          price: Number(product.price) || 0,
          original_price: product.original_price ? Number(product.original_price) : undefined,
          image_url: product.image_url || product.main_image || '/placeholder.svg',
          main_image: product.main_image || product.image_url || '/placeholder.svg',
          images: product.images,
          is_available: product.is_available !== undefined ? Boolean(product.is_available) : (product.is_active !== undefined ? Boolean(product.is_active) : true),
          is_featured: Boolean(product.is_featured),
          category_id: product.category_id || product.category || 'Général',
          created_at: product.created_at || new Date().toISOString(),
        }))
      }
    }
    
    // Sinon, récupérer tous les produits (comportement par défaut)
    // PHASE B: Utiliser la version asynchrone qui garantit l'initialisation sql.js
    const products = await getSqliteProductsAsync()
    // Filtrer les produits actifs
    const activeProducts = products.filter((p: any) => {
      const isActive = p.is_active === 1 || p.is_active === true || p.is_active === null || p.is_active === undefined
      const isAvailable = p.is_available === true || p.is_available === 1 || (p.is_available === undefined && isActive)
      return isActive && isAvailable
    })
    
    return activeProducts.map((product: any) => {
      // Convertir images en tableau si nécessaire
      let imagesArray: string[] = []
      if (product.images) {
        if (Array.isArray(product.images)) {
          imagesArray = product.images
        } else if (typeof product.images === 'string' && product.images.trim() !== '' && product.images !== '[]') {
          try {
            const parsed = JSON.parse(product.images)
            imagesArray = Array.isArray(parsed) ? parsed : []
          } catch {
            imagesArray = []
          }
        }
      }
      
      // Déterminer l'image principale
      const mainImage = product.main_image 
        || product.image_url 
        || (imagesArray.length > 0 ? imagesArray[0] : null)
        || '/placeholder.svg'
      
      // Normaliser l'image principale
      const normalizedImage = mainImage && mainImage !== '/placeholder.svg' 
        ? (mainImage.startsWith('http') || mainImage.startsWith('/') ? mainImage : `/${mainImage}`)
        : '/placeholder.svg'
      
      return {
        id: String(product.id || ''),
        name: product.name || 'Produit sans nom',
        name_ar: product.name_ar,
        description: product.description,
        price: Number(product.price) || 0,
        original_price: product.original_price ? Number(product.original_price) : undefined,
        image_url: normalizedImage,
        main_image: normalizedImage,
        images: imagesArray.length > 0 ? JSON.stringify(imagesArray) : undefined,
        is_available: product.is_available !== undefined 
          ? Boolean(product.is_available) 
          : (product.is_active !== undefined ? Boolean(product.is_active) : true),
        is_featured: Boolean(product.is_featured),
        category_id: product.category_id || product.category || 'Général',
        created_at: product.created_at || new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Erreur getAllBijoux:', error)
    return []
  }
}

export async function getBijouById(id: string) {
  try {
    const { forceConnection, initSqlJsAsync } = await import('./sqlite')
    let isConnected = forceConnection()
    if (!isConnected) {
      isConnected = await initSqlJsAsync()
      if (isConnected) {
        isConnected = forceConnection()
      }
    }
    if (isConnected) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    return await getSqliteProductByIdAsync(id)
  } catch {
    return null
  }
}

export async function getAllCategories() {
  try {
    const { forceConnection, initSqlJsAsync } = await import('./sqlite')
    let isConnected = forceConnection()
    if (!isConnected) {
      isConnected = await initSqlJsAsync()
      if (isConnected) {
        isConnected = forceConnection()
      }
    }
    if (isConnected) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    return await getSqliteCategories()
  } catch {
    return []
  }
}

export async function getAllPacks() {
  try {
    const { forceConnection, initSqlJsAsync } = await import('./sqlite')
    let isConnected = forceConnection()
    if (!isConnected) {
      isConnected = await initSqlJsAsync()
      if (isConnected) {
        isConnected = forceConnection()
      }
    }
    if (isConnected) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    return await getSqlitePacksAsync()
  } catch {
    return []
  }
}

export async function getUserByPhone(phone: string) {
  return getSqliteUserByPhone(phone)
}

export async function getUserById(id: string) {
  return getSqliteUserById(id)
}

export async function createUser(userData: {
  phone: string
  password: string
  first_name?: string
  last_name?: string
  email?: string
  role?: string
}) {
  const hashedPassword = await bcrypt.hash(userData.password, 10)
  return createSqliteUser({
    phone: userData.phone,
    password_hash: hashedPassword,
    first_name: userData.first_name,
    last_name: userData.last_name,
    role: userData.role
  })
}

export async function getAllUsers() {
  return getSqliteAllUsers()
}

export async function updateUserRole(userId: string, newRole: string) {
  return updateSqliteUserRole(userId, newRole)
}

export async function getDashboardStats() {
  return getSqliteDashboardStats()
}

export async function getAllOrders() {
  return getSqliteOrders()
}

export async function createOrder(orderData: {
  user_id: string
  total: number
  status: string
  shipping_address?: string
  shipping_phone?: string
  shipping_name?: string
}) {
  return createSqliteOrder({
    user_id: orderData.user_id,
    total_amount: orderData.total,
    status: orderData.status,
    shipping_address: orderData.shipping_address,
    phone: orderData.shipping_phone,
    notes: orderData.shipping_name
  })
}

export async function createOrderItem(itemData: {
  order_id: string
  product_id: string
  quantity: number
  price: number
  product_name: string
}) {
  return createSqliteOrderItem({
    order_id: itemData.order_id,
    bijou_id: itemData.product_id,
    quantity: itemData.quantity,
    price: itemData.price
  })
}

export async function createOrderFull(orderData: {
  user_id: string
  total: number
  status: string
  shipping_address?: string
  shipping_phone?: string
  shipping_name?: string
  items: Array<{
    product_id: string
    quantity: number
    price: number
    product_name: string
  }>
}) {
  return createSqliteOrderFull({
    order: {
      user_id: orderData.user_id,
      total_amount: orderData.total,
      status: orderData.status,
      shipping_address: orderData.shipping_address,
      phone: orderData.shipping_phone,
      notes: orderData.shipping_name
    },
    items: orderData.items.map(item => ({
      bijou_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    })),
    payment: {
      amount: orderData.total,
      payment_method: 'cash',
      status: 'pending'
    }
  })
}

export async function getOrderById(orderId: string) {
  return getSqliteOrderById(orderId)
}

export async function getOrderItems(orderId: string) {
  return getSqliteOrderItems(orderId)
}

export async function updateOrderStatus(orderId: string, status: string) {
  return updateSqliteOrderStatus(orderId, status)
}

export async function createPayment(paymentData: {
  order_id: string
  amount: number
  method: string
  status: string
  transaction_id?: string
}) {
  return createSqlitePayment({
    order_id: paymentData.order_id,
    amount: paymentData.amount,
    payment_method: paymentData.method,
    status: paymentData.status,
    transaction_id: paymentData.transaction_id
  })
}

export async function getPaymentsByOrderId(orderId: string) {
  return getSqlitePaymentsByOrderId(orderId)
}

export async function updatePaymentStatus(paymentId: string, status: string) {
  return updateSqlitePaymentStatus(paymentId, status)
}

export async function getAllPayments() {
  return getSqliteAllPayments()
}

export async function getCartItems(userId: string) {
  return getSqliteCartItems(userId)
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  return addSqliteToCart(userId, productId, quantity)
}

export async function updateCartQuantity(userId: string, productId: string, quantity: number) {
  return updateSqliteCartQuantity(userId, productId, quantity)
}

export async function removeFromCart(userId: string, productId: string) {
  return removeSqliteFromCart(userId, productId)
}

export async function getFavorites(userId: string) {
  return getSqliteFavorites(userId)
}

export async function addToFavorites(userId: string, productId: string) {
  return addSqliteToFavorites(userId, productId)
}

export async function removeFromFavorites(userId: string, productId: string) {
  return removeSqliteFromFavorites(userId, productId)
}

export async function createNotification(notificationData: {
  user_id: string
  title: string
  message: string
  type?: string
  link?: string
}) {
  try {
    // Utiliser l'adapter DB (Postgres ou SQLite)
    const adapter = await getDatabaseAdapter()
    return await adapter.createNotification(notificationData)
  } catch (error) {
    // Fallback vers SQLite direct si l'adapter échoue
    logger.warn('Erreur création notification via adapter, fallback SQLite:', serializeError(error))
    return createSqliteNotification(notificationData)
  }
}

export async function getNotifications(userId: string | null) {
  try {
    // Utiliser l'adapter DB (Postgres ou SQLite)
    const adapter = await getDatabaseAdapter()
    return await adapter.getNotifications(userId ?? undefined)
  } catch (error) {
    // Fallback vers SQLite direct si l'adapter échoue
    logger.warn('Erreur récupération notifications via adapter, fallback SQLite:', serializeError(error))
    return getSqliteNotifications(userId ?? undefined)
  }
}

export async function markNotificationAsRead(notificationId: string) {
  return markSqliteNotificationAsRead(notificationId)
}

export async function getAllActiveCarts() {
  return getSqliteAllActiveCarts()
}

export async function trimProductsToLimit(limit: number) {
  return trimSqliteProductsToLimit(limit)
}

export async function testConnection() {
  return testSqliteConnection()
}
