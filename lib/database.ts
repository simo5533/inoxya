/**
 * Couche d'accès aux données INOXYA BIJOUX
 * Utilise SQLite (dev) ou Postgres (prod) selon DATABASE_URL
 */

import bcrypt from 'bcryptjs'
import { getDatabaseAdapter } from './db'
import { slugToDbValue } from './category-mapping'
import { logger } from './logger'
import { getPackById } from './pack-management'
import { IS_PRODUCTION } from './env'

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
      if (IS_PRODUCTION) {
        logger.error('[getBijouxVedettes] Adapter failed in production', serializeError(adapterError))
        return []
      }
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
        const products = await getSqliteProductsAsync()
        const activeProducts = products.filter((p) => p.is_available === true)
        const featured = activeProducts.filter((p) => p.is_featured === true)
        const result = featured.length > 0 
          ? featured.slice(0, limit)
          : activeProducts.slice(0, limit)
        return result
      }
      
      // Si toujours pas connecté, utiliser le fallback SQLite direct
      logger.warn('[getBijouxVedettes] Adapter failed, using SQLite fallback')
      return await getSqliteProductsAsync()
    }
  } catch (error) {
    logger.error('Erreur getBijouxVedettes:', error)
    if (IS_PRODUCTION) return []
    try {
      return await getSqliteProductsAsync()
    } catch (fallbackError) {
      logger.error('Erreur fallback getBijouxVedettes:', fallbackError)
      return []
    }
  }
}

export async function getAllBijoux(categorySlug?: string) {
  try {
    // PRIORITÉ 1: Utiliser l'adapter DB (Supabase/Postgres/SQLite)
    try {
      const adapter = await getDatabaseAdapter()
      const products = await adapter.getProducts(categorySlug)
      const activeProducts = products.filter((p) => p.is_available === true)
      
      return activeProducts.map((product) => {
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
          is_available: product.is_available !== false,
          is_featured: Boolean(product.is_featured),
          category_id: product.category_id || product.category || 'Général',
          created_at: product.created_at || new Date().toISOString(),
        }
      })
    } catch (adapterError) {
      if (IS_PRODUCTION) {
        logger.error('[getAllBijoux] Adapter failed in production', serializeError(adapterError))
        return []
      }
      logger.warn('[getAllBijoux] Adapter failed, using SQLite fallback:', serializeError(adapterError))
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
      
      // Si un slug de catégorie est fourni, filtrer par catégorie
      if (categorySlug) {
        const dbValue = slugToDbValue(categorySlug)
        if (dbValue) {
        // Utiliser selectAsync pour filtrer par catégorie
        const { initializeDatabase } = await import('./sqlite')
        initializeDatabase()
        
        const sqlQuery = 'SELECT * FROM products WHERE (is_active = 1 OR is_active IS NULL) AND category = ? ORDER BY created_at DESC'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const products = await selectAsync(sqlQuery, [dbValue]) as any[]
        
        return products.map((product: {
          id?: number
          name?: string
          name_ar?: string | null
          description?: string | null
          price?: number
          original_price?: number | null
          image_url?: string | null
          main_image?: string | null
          images?: string | null
          is_active?: number | boolean | null
          is_available?: number | boolean | null
          is_featured?: number | boolean | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
        }) => ({
          id: String(product.id || ''),
          name: product.name || 'Produit sans nom',
          name_ar: product.name_ar || undefined,
          description: product.description || undefined,
          price: Number(product.price) || 0,
          original_price: product.original_price ? Number(product.original_price) : undefined,
          image_url: product.image_url || product.main_image || '/placeholder.svg',
          main_image: product.main_image || product.image_url || '/placeholder.svg',
          images: product.images || undefined,
          is_available: product.is_available !== undefined ? Boolean(product.is_available) : (product.is_active !== undefined ? Boolean(product.is_active) : true),
          is_featured: product.is_featured !== undefined ? Boolean(product.is_featured) : false,
          category_id: product.category_id || product.category || 'Général',
          created_at: product.created_at || new Date().toISOString(),
        }))
        }
      }
      
      // Sinon, récupérer tous les produits (comportement par défaut)
      // PHASE B: Utiliser la version asynchrone qui garantit l'initialisation sql.js
      const products = await getSqliteProductsAsync()
      // Filtrer les produits actifs
      const activeProducts = products.filter((p) => {
        const isActive = p.is_active === true || p.is_active === null || p.is_active === undefined
        const isAvailable = p.is_available === true || (p.is_available === undefined && isActive)
        return isActive && isAvailable
      })
      
      return activeProducts.map((product) => {
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
    }
  } catch (error) {
    logger.error('Erreur getAllBijoux:', error)
    return []
  }
}

export async function getBijouById(id: string) {
  try {
    // PRIORITÉ 1: Utiliser l'adapter de base de données (Supabase/Postgres/SQLite)
    try {
      const adapter = await getDatabaseAdapter()
      const product = await adapter.getProductById(id)
      if (product) {
        logger.info(`[getBijouById] ✅ Produit ${id} récupéré via adapter`)
        return product
      }
    } catch (adapterError) {
      if (IS_PRODUCTION) {
        logger.error('[getBijouById] Adapter failed in production', serializeError(adapterError))
        return null
      }
      logger.warn('[getBijouById] Adapter failed, using SQLite fallback:', serializeError(adapterError))
    }
    if (IS_PRODUCTION) return null
    const { forceConnection, initSqlJsAsync } = await import('./sqlite')
    let isConnected = forceConnection()
    if (!isConnected) {
      isConnected = await initSqlJsAsync()
      if (isConnected) isConnected = forceConnection()
    }
    if (isConnected) await new Promise<void>(r => { setTimeout(r, 50) })
    return await getSqliteProductByIdAsync(id)
  } catch (error) {
    logger.error('Erreur getBijouById:', error)
    return null
  }
}

export async function getAllCategories() {
  try {
    // PRIORITÉ 1: Utiliser l'adapter DB (Supabase/Postgres/SQLite)
    try {
      const adapter = await getDatabaseAdapter()
      const categories = await adapter.getCategories()
      return categories
    } catch (adapterError) {
      if (IS_PRODUCTION) {
        logger.error('[getAllCategories] Adapter failed in production', serializeError(adapterError))
        return []
      }
      logger.warn('[getAllCategories] Adapter failed, using SQLite fallback:', serializeError(adapterError))
    }
    if (IS_PRODUCTION) return []
    const { forceConnection, initSqlJsAsync } = await import('./sqlite')
    let isConnected = forceConnection()
    if (!isConnected) {
      isConnected = await initSqlJsAsync()
      if (isConnected) isConnected = forceConnection()
    }
    if (isConnected) return await getSqliteCategories()
    return []
  } catch (error) {
    logger.error('Erreur getAllCategories:', error)
    if (IS_PRODUCTION) return []
    try {
      return await getSqliteCategories()
    } catch (fallbackError) {
      logger.error('Erreur fallback getAllCategories:', fallbackError)
      return []
    }
  }
}

export async function getAllPacks() {
  try {
    // PRIORITÉ 1: Utiliser l'adapter de base de données (Supabase/Postgres/SQLite)
    try {
      const adapter = await getDatabaseAdapter()
      const packs = await adapter.getPacks()
      
      if (packs && packs.length > 0) {
        logger.info(`[getAllPacks] ${packs.length} pack(s) récupéré(s) via adapter`)
        return packs.map(pack => ({
          id: pack.id,
          name: pack.name,
          slug: pack.slug || pack.name.toLowerCase().replace(/\s+/g, '-'),
          description: pack.description || '',
          price: Number(pack.price),
          image_url: pack.image_url || '/placeholder.svg',
          is_featured: Boolean(pack.is_featured),
        }))
      }
    } catch (adapterError) {
      if (IS_PRODUCTION) {
        logger.error('[getAllPacks] Adapter failed in production', serializeError(adapterError))
        return []
      }
      const errorMsg = adapterError instanceof Error ? adapterError.message : String(adapterError)
      logger.warn('[getAllPacks] Erreur adapter, fallback SQLite', { error: errorMsg })
    }
    if (IS_PRODUCTION) return []
    const { forceConnection, initSqlJsAsync } = await import('./sqlite')
    let isConnected = forceConnection()
    if (!isConnected) {
      isConnected = await initSqlJsAsync()
      if (isConnected) isConnected = forceConnection()
    }
    if (!isConnected) {
      // En build-time, retourner un tableau vide plutôt que de lancer une erreur
      if (process.env['NEXT_PHASE'] === 'phase-production-build' || process.env['NEXT_PHASE'] === 'phase-export') {
        logger.debug('[getAllPacks] Build-time: DB non disponible, retour tableau vide')
        return []
      }
      throw new Error('Impossible de se connecter à la base de données')
    }
    
    return await getSqlitePacksAsync()
  } catch (error) {
    // En build-time, retourner un tableau vide plutôt que de lancer une erreur
    if (process.env['NEXT_PHASE'] === 'phase-production-build' || process.env['NEXT_PHASE'] === 'phase-export') {
      logger.debug('[getAllPacks] Build-time: Erreur DB, retour tableau vide')
      return []
    }
    // En runtime, logger l'erreur mais permettre le fallback
    logger.error('Erreur getAllPacks:', error)
    if (IS_PRODUCTION) return []
    try {
      return await getSqlitePacksAsync()
    } catch (fallbackError) {
      logger.error('Erreur fallback getAllPacks:', fallbackError)
      return []
    }
  }
}

export async function getUserByPhone(phone: string) {
  if (IS_PRODUCTION) return null
  return getSqliteUserByPhone(phone)
}

export async function getUserById(id: string) {
  if (IS_PRODUCTION) return null
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
  if (IS_PRODUCTION) throw new Error('createUser not available via SQLite in production')
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
  if (IS_PRODUCTION) return []
  return getSqliteAllUsers()
}

export async function updateUserRole(userId: string, newRole: string) {
  if (IS_PRODUCTION) return
  return updateSqliteUserRole(userId, newRole)
}

async function getRecentOrdersWithDetails(adapter: import('./db/adapter').DatabaseAdapter, limit: number): Promise<{ id: string; total_amount: number; status: string; created_at: string; phone?: string; firstProductName?: string }[]> {
  const orders = await adapter.getOrders()
  const recent = orders.slice(0, limit)
  return Promise.all(
    recent.map(async (o) => {
      const [order, items] = await Promise.all([
        adapter.getOrderById(o.id),
        adapter.getOrderItems(o.id)
      ])
      const first = items[0]
      let firstProductName: string | undefined
      if (first) {
        const firstItem = first as { pack_id?: string; bijou_id?: string }
        if (firstItem.pack_id) {
          const pack = await getPackById(firstItem.pack_id)
          firstProductName = pack?.name
        } else if (firstItem.bijou_id) {
          const product = await getBijouById(firstItem.bijou_id)
          firstProductName = product?.name
        }
      }
      return {
        id: o.id,
        total_amount: o.total_amount,
        status: o.status,
        created_at: o.created_at,
        phone: (order as { phone?: string })?.phone ?? (order as { shipping_phone?: string })?.shipping_phone,
        firstProductName
      }
    })
  )
}

async function getTopSoldProductsFromAdapter(adapter: import('./db/adapter').DatabaseAdapter, limit: number): Promise<{ id: string; name: string; quantity: number; price: number; image_url?: string; is_pack?: boolean }[]> {
  const orders = await adapter.getOrders()
  const itemsPerOrder = await Promise.all(
    orders.slice(0, 150).map((o) => adapter.getOrderItems(o.id))
  )
  const agg = new Map<string, { quantity: number; price: number; isPack: boolean }>()
  for (const items of itemsPerOrder) {
    for (const item of items) {
      const row = item as { bijou_id?: string; pack_id?: string; quantity: number; price: number }
      const key = row.pack_id ? `pack:${row.pack_id}` : `bijou:${row.bijou_id ?? ''}`
      if (!key.endsWith(':') && row.quantity) {
        const cur = agg.get(key) ?? { quantity: 0, price: row.price, isPack: !!row.pack_id }
        cur.quantity += row.quantity
        agg.set(key, cur)
      }
    }
  }
  const sorted = [...agg.entries()].sort((a, b) => b[1].quantity - a[1].quantity).slice(0, limit)
  return Promise.all(
    sorted.map(async ([key, val]) => {
      const isPack = key.startsWith('pack:')
      const id = key.replace(/^(pack|bijou):/, '')
      if (isPack) {
        const pack = await getPackById(id)
        return { id, name: pack?.name ?? `Pack #${id}`, quantity: val.quantity, price: val.price, image_url: pack?.image_url, is_pack: true }
      }
      const product = await getBijouById(id)
      return { id, name: product?.name ?? `Produit #${id}`, quantity: val.quantity, price: val.price, image_url: product?.image_url ?? product?.main_image, is_pack: false }
    })
  )
}

export async function getDashboardStats() {
  try {
    // PRIORITÉ 1: Utiliser l'adapter de base de données (Supabase/Postgres/SQLite)
    try {
      const adapter = await getDatabaseAdapter()
      const stats = await adapter.getDashboardStats()
      
      // Récupérer aussi les packs et catégories
      const packs = await adapter.getPacks()
      const categories = await adapter.getCategories()

      let recentOrders: { id: string; total_amount: number; status: string; created_at: string; phone?: string; firstProductName?: string }[] = []
      let topProducts: { id: string; name: string; quantity: number; price: number; image_url?: string; is_pack?: boolean }[] = []
      try {
        recentOrders = await getRecentOrdersWithDetails(adapter, 10)
        topProducts = await getTopSoldProductsFromAdapter(adapter, 10)
      } catch (e) {
        logger.warn('[getDashboardStats] Erreur chargement commandes/produits récents:', serializeError(e))
      }
      
      return {
        totalBijoux: stats.totalProducts || 0,
        totalPacks: packs.length || 0,
        totalCategories: categories.length || 0,
        totalUsers: stats.totalUsers || 0,
        totalOrders: stats.totalOrders || 0,
        totalRevenue: stats.totalRevenue || 0,
        recentOrders,
        topProducts,
        userGrowth: []
      }
    } catch (adapterError) {
      if (adapterError instanceof Error) {
        logger.warn('[getDashboardStats] Erreur adapter:', { error: adapterError.message })
      } else {
        logger.warn('[getDashboardStats] Erreur adapter:', { error: String(adapterError) })
      }
    }
    if (IS_PRODUCTION) {
      return {
        totalBijoux: 0,
        totalPacks: 0,
        totalCategories: 0,
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        recentOrders: [],
        topProducts: [],
        userGrowth: []
      }
    }
    return getSqliteDashboardStats()
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Erreur getDashboardStats:', { error: error.message })
    } else {
      logger.error('Erreur getDashboardStats:', { error: String(error) })
    }
    // Retourner des stats vides plutôt que de faire planter le dashboard
    return {
      totalBijoux: 0,
      totalPacks: 0,
      totalCategories: 0,
      totalUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      recentOrders: [],
      topProducts: [],
      userGrowth: []
    }
  }
}

export async function getAllOrders() {
  if (IS_PRODUCTION) return []
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
  try {
    // PRIORITÉ 1: Utiliser l'adapter de base de données (Supabase/Postgres/SQLite)
    try {
      const adapter = await getDatabaseAdapter()
      const order = await adapter.createOrder({
        user_id: orderData.user_id || null,
        total_amount: orderData.total,
        status: orderData.status,
        shipping_address: orderData.shipping_address,
        phone: orderData.shipping_phone,
        notes: orderData.shipping_name
      })
      if (order) {
        logger.info(`[createOrder] ✅ Commande créée via adapter: ${order.id}`)
        return order
      }
    } catch (adapterError) {
      if (IS_PRODUCTION) {
        logger.error('[createOrder] Adapter failed in production', serializeError(adapterError))
        throw adapterError
      }
      logger.warn('[createOrder] Adapter failed, using SQLite fallback:', serializeError(adapterError))
    }
    return createSqliteOrder({
      user_id: orderData.user_id,
      total_amount: orderData.total,
      status: orderData.status,
      shipping_address: orderData.shipping_address,
      phone: orderData.shipping_phone,
      notes: orderData.shipping_name
    })
  } catch (error) {
    logger.error('Erreur createOrder:', error)
    throw error
  }
}

export async function createOrderItem(itemData: {
  order_id: string
  product_id: string
  bijou_id?: string
  quantity: number
  price: number
  product_name: string
}) {
  try {
    // PRIORITÉ 1: Utiliser l'adapter de base de données (Supabase/Postgres/SQLite)
    try {
      const adapter = await getDatabaseAdapter()
      const orderItem = await adapter.createOrderItem({
        order_id: itemData.order_id,
        product_id: itemData.product_id,
        bijou_id: itemData.bijou_id || itemData.product_id,
        quantity: itemData.quantity,
        price: itemData.price,
        product_name: itemData.product_name
      })
      if (orderItem) {
        logger.info(`[createOrderItem] ✅ Item créé via adapter: ${orderItem.id}`)
        return orderItem
      }
    } catch (adapterError) {
      if (IS_PRODUCTION) {
        logger.error('[createOrderItem] Adapter failed in production', serializeError(adapterError))
        throw adapterError
      }
      logger.warn('[createOrderItem] Adapter failed, using SQLite fallback:', serializeError(adapterError))
    }
    return createSqliteOrderItem({
      order_id: itemData.order_id,
      bijou_id: itemData.product_id,
      quantity: itemData.quantity,
      price: itemData.price
    })
  } catch (error) {
    logger.error('Erreur createOrderItem:', error)
    throw error
  }
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
  const checkoutDebug = process.env['CHECKOUT_DEBUG'] === 'true'
  if (checkoutDebug) {
    logger.debug('[createOrderFull] CHECKOUT_DEBUG payload (sanitized)', {
      itemsCount: orderData.items.length,
      total: orderData.total,
      hasUserId: Boolean(orderData.user_id),
      shippingAddressLength: orderData.shipping_address?.length ?? 0,
      shippingPhoneLength: orderData.shipping_phone?.length ?? 0
    })
  }
  try {
    // PRIORITÉ 1: Utiliser l'adapter de base de données (Supabase/Postgres/SQLite)
    try {
      const adapter = await getDatabaseAdapter()
      
      // Créer la commande
      const order = await adapter.createOrder({
        user_id: orderData.user_id || null,
        total_amount: orderData.total,
        status: orderData.status,
        shipping_address: orderData.shipping_address,
        phone: orderData.shipping_phone,
        notes: orderData.shipping_name
      })
      
      if (!order) {
        throw new Error('Échec de création de la commande')
      }
      
      // Créer les items (en parallèle pour meilleure performance)
      const orderItems: Array<{ id: string; order_id: string; bijou_id: string; quantity: number; price: number }> = []
      const itemPromises = orderData.items.map(async (item) => {
         
        const orderItem = await adapter.createOrderItem({
          order_id: order.id,
          product_id: item.product_id,
          bijou_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          product_name: item.product_name
        })
        if (orderItem) {
          orderItems.push(orderItem)
        }
        return orderItem
      })
      await Promise.all(itemPromises)
      
      // Créer le paiement
      const payment = await adapter.createPayment({
        order_id: order.id,
        amount: orderData.total,
        payment_method: 'cash_on_delivery',
        status: 'pending'
      })
      
      logger.info(`[createOrderFull] ✅ Commande complète créée via adapter: ${order.id}`)
      
      return {
        orderId: order.id,
        paymentId: payment?.id || '',
        order,
        items: orderItems,
        payment
      }
    } catch (adapterError) {
      if (IS_PRODUCTION) {
        logger.error('[createOrderFull] Adapter failed in production', serializeError(adapterError))
        throw adapterError
      }
      logger.warn('[createOrderFull] Adapter failed, using SQLite fallback:', serializeError(adapterError))
    }
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
  } catch (error) {
    logger.error('Erreur createOrderFull:', error)
    throw error
  }
}

export async function getOrderById(orderId: string) {
  if (IS_PRODUCTION) return null
  return getSqliteOrderById(orderId)
}

export async function getOrderItems(orderId: string) {
  if (IS_PRODUCTION) return []
  return getSqliteOrderItems(orderId)
}

export async function updateOrderStatus(orderId: string, status: string) {
  if (IS_PRODUCTION) return
  return updateSqliteOrderStatus(orderId, status)
}

export async function createPayment(paymentData: {
  order_id: string
  amount: number
  method: string
  status: string
  transaction_id?: string
}) {
  if (IS_PRODUCTION) throw new Error('createPayment not available via SQLite in production')
  return createSqlitePayment({
    order_id: paymentData.order_id,
    amount: paymentData.amount,
    payment_method: paymentData.method,
    status: paymentData.status,
    transaction_id: paymentData.transaction_id
  })
}

export async function getPaymentsByOrderId(orderId: string) {
  if (IS_PRODUCTION) return []
  return getSqlitePaymentsByOrderId(orderId)
}

export async function updatePaymentStatus(paymentId: string, status: string) {
  if (IS_PRODUCTION) return
  return updateSqlitePaymentStatus(paymentId, status)
}

export async function getAllPayments() {
  if (IS_PRODUCTION) return []
  return getSqliteAllPayments()
}

export async function getCartItems(userId: string) {
  if (IS_PRODUCTION) return []
  return getSqliteCartItems(userId)
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  if (IS_PRODUCTION) return
  return addSqliteToCart(userId, productId, quantity)
}

export async function updateCartQuantity(userId: string, productId: string, quantity: number) {
  if (IS_PRODUCTION) return
  return updateSqliteCartQuantity(userId, productId, quantity)
}

export async function removeFromCart(userId: string, productId: string) {
  if (IS_PRODUCTION) return
  return removeSqliteFromCart(userId, productId)
}

export async function getFavorites(userId: string) {
  if (IS_PRODUCTION) return []
  return getSqliteFavorites(userId)
}

export async function addToFavorites(userId: string, productId: string) {
  if (IS_PRODUCTION) return
  return addSqliteToFavorites(userId, productId)
}

export async function removeFromFavorites(userId: string, productId: string) {
  if (IS_PRODUCTION) return
  return removeSqliteFromFavorites(userId, productId)
}

export async function createNotification(notificationData: {
  user_id?: string | null
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
    logger.warn('Erreur création notification via adapter:', serializeError(error))
    if (IS_PRODUCTION) throw error
    return createSqliteNotification(notificationData)
  }
}

export async function getNotifications(userId: string | null) {
  try {
    // Utiliser l'adapter DB (Postgres ou SQLite)
    const adapter = await getDatabaseAdapter()
    return await adapter.getNotifications(userId ?? undefined)
  } catch (error) {
    logger.warn('Erreur récupération notifications via adapter:', serializeError(error))
    if (IS_PRODUCTION) return []
    return getSqliteNotifications(userId ?? undefined)
  }
}

export async function markNotificationAsRead(notificationId: string) {
  if (IS_PRODUCTION) return
  return markSqliteNotificationAsRead(notificationId)
}

export async function getAllActiveCarts() {
  if (IS_PRODUCTION) return []
  return getSqliteAllActiveCarts()
}

export async function trimProductsToLimit(limit: number) {
  if (IS_PRODUCTION) return 0
  return trimSqliteProductsToLimit(limit)
}

export async function testConnection() {
  if (IS_PRODUCTION) return false
  return testSqliteConnection()
}
