/**
 * Adapter Supabase - Utilise le client Supabase directement
 * Pour production sur Vercel avec Supabase
 */
import 'server-only'

import { createClient } from '@supabase/supabase-js'
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
import { serializeError } from '../sqlite'
import { slugToDbValue } from '../category-mapping'
import { normalizeImageUrl } from '../image-path'
import {
  extractPackItemsCount,
  stripPackItemsCountMarker,
  withPackItemsCountMarker,
} from '../pack-items-count'

export class SupabaseAdapter implements DatabaseAdapter {
  private supabase: ReturnType<typeof createClient>

  constructor(supabaseUrl: string, supabaseKey: string) {
    // Défense en profondeur: interdire l'usage accidentel de l'ANON key côté serveur.
    // La clé ANON est typiquement "eyJ..." (JWT). Les service-role récents peuvent être "sb_secret_...".
    // On n'impose pas un format strict, mais on bloque les cas évidents.
    if (!supabaseKey) {
      throw new Error('[SupabaseAdapter] Missing Supabase key')
    }
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  // Helper pour contourner le typage strict de Supabase
  private insertData<T>(table: string, data: T) {
    return this.supabase.from(table).insert(data as never)
  }

  private updateData<T>(table: string, data: T, filter: string, value: string | number) {
    return this.supabase.from(table).update(data as never).eq(filter, value)
  }

  private upsertData<T>(table: string, data: T, options?: { onConflict?: string }) {
    return this.supabase.from(table).upsert(data as never, options)
  }

  async testConnection(): Promise<boolean> {
    try {
      // Requête légère : 0 ou 1 ligne, pas d’erreur si table vide
      const { error } = await this.supabase
        .from('products')
        .select('id')
        .limit(1)
        .maybeSingle()
      if (error) {
        logger.error('[SupabaseAdapter] Connection test failed:', { 
          message: error.message, 
          code: error.code, 
          details: error.details,
          hint: error.hint 
        })
        return false
      }
      // Si pas d'erreur, la connexion est OK (même si data est vide)
      return true
    } catch (error) {
      logger.error('[SupabaseAdapter] Connection test error:', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      return false
    }
  }

  // Users
  async getUserByPhone(phone: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single()
    
    if (error || !data) return null
    return this.mapUser(data)
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) return null
    return this.mapUser(data)
  }

  async createUser(userData: {
    phone: string
    password_hash: string
    first_name?: string
    last_name?: string
    role?: string
  }): Promise<User | null> {
    const now = new Date().toISOString()
    const insertData: {
      phone: string
      password_hash: string
      first_name?: string
      last_name?: string
      role: string
      created_at?: string
      updated_at?: string
    } = {
      phone: userData.phone,
      password_hash: userData.password_hash,
      role: userData.role || 'user',
      created_at: now,
      updated_at: now,
    }
    if (userData.first_name) insertData.first_name = userData.first_name
    if (userData.last_name) insertData.last_name = userData.last_name

    const { data, error } = await this.insertData('users', insertData)
      .select()
      .single()

    if (error) {
      logger.error('[SupabaseAdapter] createUser error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      // Contrainte unique (ex. numéro déjà utilisé)
      if (error.code === '23505' || /unique|duplicate/i.test(error.message)) {
        throw new Error('Ce numéro de téléphone est déjà utilisé')
      }
      throw new Error(error.message || 'Erreur lors de la création du compte')
    }
    if (!data) {
      logger.warn('[SupabaseAdapter] createUser: no data returned from insert')
      throw new Error('Erreur lors de la création du compte')
    }
    return this.mapUser(data)
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error || !data) return []
    return data.map(row => this.mapUser(row))
  }

  async updateUserRole(userId: string, newRole: string): Promise<boolean> {
    const { error } = await this.updateData('users', { role: newRole, updated_at: new Date().toISOString() }, 'id', userId)
    
    return !error
  }

  // Products
  async getProducts(categorySlug?: string): Promise<Product[]> {
    let query = this.supabase
      .from('products')
      .select('*')
      .or('is_active.is.null,is_active.eq.true')
      .order('created_at', { ascending: false })

    if (categorySlug) {
      const dbValue = slugToDbValue(categorySlug)
      if (dbValue) {
        query = query.eq('category', dbValue)
      }
    }

    const { data, error } = await query
    
    if (error) {
      logger.error('[SupabaseAdapter] getProducts error:', error)
      return []
    }
    
    if (!data) return []
    
    return data.map(row => this.mapProduct(row))
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) return null
      const product = this.mapProduct(data)
      if (!product.id || String(product.id).trim() === '') return null
      return product
    } catch (err) {
      logger.error('[SupabaseAdapter] getProductById exception:', { id, error: err instanceof Error ? err.message : String(err) })
      return null
    }
  }

  async createProduct(productData: Partial<Product>): Promise<Product | null> {
    if (!productData.name || productData.price == null) {
      throw new Error('Champs requis manquants: name et price')
    }

    const imageUrl = productData.image_url || productData.main_image || null
    let imagesPayload: string | unknown[] = '[]'
    if (productData.images) {
      if (typeof productData.images === 'string') {
        try {
          imagesPayload = JSON.parse(productData.images) as unknown[]
        } catch {
          imagesPayload = []
        }
      } else {
        imagesPayload = productData.images
      }
    }

    const insertData: Record<string, unknown> = {
      name: productData.name,
      price: productData.price,
      description: productData.description || 'Description non fournie',
      name_ar: productData.name_ar || null,
      original_price: productData.original_price || null,
      category: productData.category || productData.category_id || 'Général',
      image_url: imageUrl,
      images: imagesPayload,
      is_active: productData.is_active !== undefined ? productData.is_active : true,
      is_featured: productData.is_featured !== undefined ? productData.is_featured : false,
      is_available:
        productData.is_available !== undefined
          ? productData.is_available
          : productData.is_active !== undefined
            ? productData.is_active
            : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const stockQty = productData.stock !== undefined ? productData.stock : 0
    insertData['stock'] = stockQty

    if (productData.rating != null) insertData['rating'] = productData.rating
    if (productData.reviews_count != null) insertData['reviews_count'] = productData.reviews_count

    logger.info('[SupabaseAdapter] createProduct: Tentative insertion', {
      name: insertData['name'],
      category: insertData['category'],
      hasImage: !!insertData['image_url'],
    })

    const { data, error } = await this.insertData('products', insertData).select().single()

    if (error) {
      logger.error('[SupabaseAdapter] createProduct error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      throw new Error(`Insertion Supabase échouée: ${error.message}`)
    }

    if (!data) {
      throw new Error('Insertion Supabase: aucune donnée retournée')
    }

    return this.mapProduct(data)
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<boolean> {
    const { main_image, category_id: _catId, ...rest } = productData as Partial<Product> & { main_image?: string; category_id?: string }
    const raw: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() }
    if (main_image !== undefined && raw['image_url'] === undefined) raw['image_url'] = main_image
    if (raw['category_id'] !== undefined && raw['category'] === undefined) raw['category'] = raw['category_id']
    delete raw['category_id']
    const payload: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(raw)) {
      if (v !== undefined) payload[k] = v
    }
    const { error } = await this.updateData('products', payload, 'id', id)
    if (error) {
      logger.error('[SupabaseAdapter] updateProduct error:', { message: error.message, code: error.code, id })
    }
    return !error
  }

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await this.updateData('products', { is_active: false }, 'id', id)
    
    return !error
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    
    if (error || !data) return []
    
    return (data as Array<{ id: number; name: string; slug: string; description?: string; image_url?: string }>).map(row => ({
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      image_url: row.image_url || undefined,
    }))
  }

  async createCategory(categoryData: Partial<Category>): Promise<Category | null> {
    const { data, error } = await this.insertData('categories', categoryData)
      .select()
      .single()
    
    if (error || !data) return null
    const row = data as { id: number; name: string; slug: string; description?: string; image_url?: string }
    
    return {
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      image_url: row.image_url || undefined,
    }
  }

  async updateCategory(id: string, categoryData: Partial<Category>): Promise<boolean> {
    const { error } = await this.updateData('categories', categoryData, 'id', id)
    
    return !error
  }

  // Packs
  private mapPackRow(row: {
    id: number | string
    name: string
    slug: string
    description?: string | null
    price: number
    image_url?: string | null
    is_featured?: boolean
    items_count?: number | null
  }): Pack {
    const rawDesc = row.description || undefined
    const fromColumn =
      row.items_count != null && Number.isFinite(Number(row.items_count))
        ? Math.max(1, Math.min(99, Math.floor(Number(row.items_count))))
        : null
    return {
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      description: stripPackItemsCountMarker(rawDesc) || undefined,
      price: Number(row.price),
      image_url: row.image_url || undefined,
      is_featured: Boolean(row.is_featured),
      items_count: fromColumn ?? extractPackItemsCount(rawDesc),
    }
  }

  async getPacks(): Promise<Pack[]> {
    const { data, error } = await this.supabase
      .from('packs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error || !data) return []
    
    return (data as Array<{
      id: number
      name: string
      slug: string
      description?: string
      price: number
      image_url?: string
      is_featured: boolean
      items_count?: number
    }>).map((row) => this.mapPackRow(row))
  }

  async getPackById(id: string): Promise<Pack | null> {
    const { data, error } = await this.supabase
      .from('packs')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id}`)
      .single()
    
    if (error || !data) return null
    return this.mapPackRow(
      data as {
        id: number
        name: string
        slug: string
        description?: string
        price: number
        image_url?: string
        is_featured: boolean
        items_count?: number
      }
    )
  }

  async createPack(packData: Partial<Pack>): Promise<Pack | null> {
    const itemsCount =
      packData.items_count != null
        ? Math.max(1, Math.min(99, Math.floor(Number(packData.items_count))))
        : extractPackItemsCount(packData.description)
    const description = withPackItemsCountMarker(packData.description, itemsCount)

    // N'envoyer que les champs définis (Supabase rejette undefined)
    const insertPayload: Record<string, unknown> = {
      name: packData.name ?? '',
      slug: packData.slug ?? '',
      description,
      price: Number(packData.price ?? 0),
      is_featured: Boolean(packData.is_featured ?? false),
      items_count: itemsCount,
    }
    if (packData.image_url != null && packData.image_url !== '') {
      insertPayload['image_url'] = packData.image_url
    }

    // Si la séquence id est désynchronisée (ex. 23505 duplicate key), utiliser MAX(id)+1
    const { data: maxRow } = await this.supabase.from('packs').select('id').order('id', { ascending: false }).limit(1).maybeSingle()
    const maxId = (maxRow as { id?: number } | null)?.id
    const nextId = maxId != null ? Number(maxId) + 1 : 1
    insertPayload['id'] = nextId

    let { data, error } = await this.insertData('packs', insertPayload).select().single()

    // Colonne items_count absente → réessayer sans
    if (error && /items_count/i.test(error.message || '')) {
      delete insertPayload['items_count']
      const retry = await this.insertData('packs', insertPayload).select().single()
      data = retry.data
      error = retry.error
    }

    if (error) {
      logger.error('[SupabaseAdapter] createPack error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return null
    }
    if (!data) {
      logger.warn('[SupabaseAdapter] createPack: no data returned')
      return null
    }

    return this.mapPackRow(
      data as {
        id: number
        name: string
        slug: string
        description?: string
        price: number
        image_url?: string
        is_featured: boolean
        items_count?: number
      }
    )
  }

  async updatePack(id: string, packData: Partial<Pack>): Promise<boolean> {
    const payload: Record<string, unknown> = {}
    if (packData.name !== undefined) payload.name = packData.name
    if (packData.slug !== undefined) payload.slug = packData.slug
    if (packData.price !== undefined) payload.price = packData.price
    if (packData.image_url !== undefined) payload.image_url = packData.image_url
    if (packData.is_featured !== undefined) payload.is_featured = Boolean(packData.is_featured)

    if (packData.items_count !== undefined || packData.description !== undefined) {
      const existing = await this.getPackById(id)
      const count =
        packData.items_count !== undefined
          ? Math.max(1, Math.min(99, Math.floor(Number(packData.items_count))))
          : (existing?.items_count ?? 1)
      const baseDesc =
        packData.description !== undefined
          ? packData.description
          : (existing?.description ?? '')
      payload.description = withPackItemsCountMarker(baseDesc, count)
      payload.items_count = count
    }

    if (Object.keys(payload).length === 0) {
      logger.warn('[SupabaseAdapter] updatePack: aucun champ à mettre à jour', { id })
      return false
    }

    const idFilter = /^\d+$/.test(String(id)) ? Number(id) : id
    let { error, data } = await this.supabase
      .from('packs')
      .update(payload as never)
      .eq('id', idFilter)
      .select('id')

    if (error && /items_count/i.test(error.message || '') && 'items_count' in payload) {
      delete payload.items_count
      const retry = await this.supabase
        .from('packs')
        .update(payload as never)
        .eq('id', idFilter)
        .select('id')
      error = retry.error
      data = retry.data
    }

    if (error) {
      logger.error('[SupabaseAdapter] updatePack error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        id,
      })
      return false
    }

    return Array.isArray(data) ? data.length > 0 : true
  }

  async deletePack(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('packs')
      .delete()
      .eq('id', id)
    
    return !error
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error || !data) return []
    return data.map(row => this.mapOrder(row))
  }

  async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) return null
    return this.mapOrder(data)
  }

  async createOrder(orderData: {
    user_id: string | null
    total_amount: number
    status: string
    shipping_address?: unknown
    phone?: string
    notes?: string
  }): Promise<Order | null> {
    const addr = orderData.shipping_address
    let shipping_address: unknown = null
    if (addr != null && addr !== '') {
      if (typeof addr === 'string') {
        const trimmed = addr.trim()
        try {
          shipping_address = JSON.parse(trimmed)
        } catch {
          // JSONB Supabase : objet plutôt qu'une string brute
          shipping_address = { text: trimmed }
        }
      } else {
        shipping_address = addr
      }
    }

    const payload = {
      user_id: orderData.user_id || null,
      total_amount: Number(orderData.total_amount),
      status: orderData.status ?? 'pending',
      shipping_address,
      phone: orderData.phone ?? null,
      notes: orderData.notes ?? null
    }
    const { data, error } = await this.insertData('orders', payload)
      .select()
      .single()
    
    if (error || !data) {
      // Fallback : colonne TEXT qui refuse un objet
      if (error && /json|jsonb|invalid input/i.test(error.message || '') && typeof addr === 'string') {
        const { data: retryData, error: retryError } = await this.insertData('orders', {
          user_id: payload.user_id,
          total_amount: payload.total_amount,
          status: payload.status,
          shipping_address: addr,
          phone: payload.phone,
          notes: payload.notes,
        })
          .select()
          .single()
        if (!retryError && retryData) {
          return this.mapOrder(retryData as Record<string, unknown>)
        }
      }
      const errPayload = {
        table: 'orders',
        operation: 'insert',
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      }
      logger.warn('[SupabaseAdapter] createOrder failed', error ? { ...errPayload, serialized: serializeError(error) } : errPayload)
      throw new Error(error?.message || 'Échec de création de la commande (orders)')
    }
    return this.mapOrder(data)
  }

  async createOrderItem(itemData: {
    order_id: string
    bijou_id?: string
    pack_id?: string
    product_id?: string
    quantity: number
    price: number
    product_name?: string
  }): Promise<{ id: string; order_id: string; bijou_id: string; quantity: number; price: number } | null> {
    const orderIdRaw = itemData.order_id
    const order_id = Number.isFinite(Number(orderIdRaw)) ? Number(orderIdRaw) : orderIdRaw
    const packId = itemData.pack_id ? String(itemData.pack_id) : null
    const productRef = String(itemData.bijou_id || itemData.product_id || '').trim()

    const attempts: Array<Record<string, unknown>> = []
    if (packId) {
      attempts.push({
        order_id,
        bijou_id: null,
        pack_id: packId,
        quantity: Number(itemData.quantity),
        price: Number(itemData.price),
        ...(itemData.product_name ? { product_name: String(itemData.product_name) } : {}),
      })
    }
    if (productRef) {
      attempts.push({
        order_id,
        bijou_id: productRef,
        pack_id: null,
        quantity: Number(itemData.quantity),
        price: Number(itemData.price),
        ...(itemData.product_name ? { product_name: String(itemData.product_name) } : {}),
      })
      attempts.push({
        order_id,
        bijou_id: productRef,
        quantity: Number(itemData.quantity),
        price: Number(itemData.price),
        ...(itemData.product_name ? { product_name: String(itemData.product_name) } : {}),
      })
    }
    attempts.push({
      order_id,
      quantity: Number(itemData.quantity),
      price: Number(itemData.price),
      ...(itemData.product_name ? { product_name: String(itemData.product_name) } : {}),
    })

    let lastError: { message?: string; code?: string; details?: string; hint?: string } | null = null
    for (const payload of attempts) {
      // eslint-disable-next-line no-await-in-loop
      const { data, error } = await this.insertData('order_items', payload).select().single()
      if (!error && data) {
        const row = data as { id: number; order_id: number; bijou_id: string; quantity: number; price: number }
        return {
          id: String(row.id),
          order_id: String(row.order_id),
          bijou_id: String(row.bijou_id ?? productRef ?? ''),
          quantity: Number(row.quantity),
          price: Number(row.price),
        }
      }
      lastError = error
      logger.warn('[SupabaseAdapter] createOrderItem attempt failed', {
        keys: Object.keys(payload),
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      })
    }

    logger.warn('[SupabaseAdapter] createOrderItem failed', {
      table: 'order_items',
      operation: 'insert',
      order_id: itemData.order_id,
      message: lastError?.message,
      code: lastError?.code,
      details: lastError?.details,
      hint: lastError?.hint,
    })
    throw new Error(
      lastError?.message ||
        'Impossible d’enregistrer la ligne de commande (order_items)'
    )
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await this.supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
    
    if (error || !data) return []
    
    return (
      data as Array<{
        id: number
        order_id: number
        bijou_id?: string | null
        pack_id?: string | null
        quantity: number
        price: number
        product_name?: string | null
      }>
    ).map((row) => ({
      id: String(row.id),
      order_id: String(row.order_id),
      bijou_id:
        row.bijou_id != null && String(row.bijou_id).trim() !== ''
          ? String(row.bijou_id)
          : undefined,
      pack_id:
        row.pack_id != null && String(row.pack_id).trim() !== ''
          ? String(row.pack_id)
          : undefined,
      quantity: Number(row.quantity),
      price: Number(row.price),
      product_name: row.product_name != null ? String(row.product_name) : undefined,
    }))
  }

  async updateOrderStatus(id: string, status: string): Promise<boolean> {
    const { error } = await this.updateData('orders', { status }, 'id', id)
    
    return !error
  }

  // Cart
  async getCartItems(userId: string): Promise<CartItem[]> {
    const { data, error } = await this.supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
    
    if (error || !data) return []
    
    return (data as Array<{ id: number; user_id: number; bijou_id: number; quantity: number }>).map(row => ({
      id: String(row.id),
      user_id: String(row.user_id),
      bijou_id: String(row.bijou_id),
      quantity: Number(row.quantity),
    }))
  }

  async addToCart(userId: string, bijouId: string, quantity: number): Promise<boolean> {
    const { error } = await this.upsertData('cart_items', {
      user_id: userId,
      bijou_id: bijouId,
      quantity,
    }, {
      onConflict: 'user_id,bijou_id'
    })
    
    return !error
  }

  async updateCartQuantity(userId: string, bijouId: string, quantity: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('cart_items')
      .update({ quantity } as never)
      .eq('user_id', userId)
      .eq('bijou_id', bijouId)
    
    return !error
  }

  async removeFromCart(userId: string, bijouId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('bijou_id', bijouId)
    
    return !error
  }

  async getAllActiveCarts(): Promise<{ user_id: string; bijou_id: string; quantity: number }[]> {
    const { data, error } = await this.supabase
      .from('cart_items')
      .select('user_id, bijou_id, quantity')
    if (error || !data) return []
    return (data as Array<{ user_id: string | number; bijou_id: string | number; quantity: string | number }>).map(
      (row) => ({
        user_id: String(row.user_id),
        bijou_id: String(row.bijou_id),
        quantity: Number(row.quantity),
      })
    )
  }

  // Favorites
  async getFavorites(userId: string): Promise<Favorite[]> {
    const { data, error } = await this.supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
    
    if (error || !data) return []
    
    return (data as Array<{ id: number; user_id: number; bijou_id: number }>).map(row => ({
      id: String(row.id),
      user_id: String(row.user_id),
      bijou_id: String(row.bijou_id),
    }))
  }

  async addToFavorites(userId: string, bijouId: string): Promise<boolean> {
    const { error } = await this.upsertData('favorites', {
      user_id: userId,
      bijou_id: bijouId,
    }, {
      onConflict: 'user_id,bijou_id'
    })
    
    return !error
  }

  async removeFromFavorites(userId: string, bijouId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('bijou_id', bijouId)
    
    return !error
  }

  // Payments
  async createPayment(paymentData: {
    order_id: string
    amount: number
    payment_method: string
    status?: string
    transaction_id?: string
  }): Promise<Payment | null> {
    const orderIdRaw = paymentData.order_id
    const order_id = Number.isFinite(Number(orderIdRaw)) ? Number(orderIdRaw) : orderIdRaw
    const payload = {
      order_id,
      amount: Number(paymentData.amount),
      payment_method: paymentData.payment_method || 'cod',
      status: paymentData.status ?? 'pending',
      transaction_id: paymentData.transaction_id ?? null
    }
    const { data, error } = await this.insertData('payments', payload)
      .select()
      .single()
    
    if (error || !data) {
      const errPayload = {
        table: 'payments',
        operation: 'insert',
        order_id: paymentData.order_id,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      }
      logger.warn('[SupabaseAdapter] createPayment failed', error ? { ...errPayload, serialized: serializeError(error) } : errPayload)
      return null
    }
    return this.mapPayment(data)
  }

  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
    
    if (error || !data) return []
    return data.map(row => this.mapPayment(row))
  }

  async getAllPayments(): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error || !data) return []
    return data.map(row => this.mapPayment(row))
  }

  async updatePaymentStatus(id: string, status: string): Promise<boolean> {
    const { error } = await this.updateData('payments', { status }, 'id', id)
    
    return !error
  }

  // Notifications
  async createNotification(notificationData: {
    user_id?: string | null
    title: string
    message: string
    type?: string
    link?: string
  }): Promise<boolean> {
    const { error } = await this.insertData('notifications', {
      user_id: notificationData.user_id,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'info',
      action_url: notificationData.link,
    })
    
    return !error
  }

  async getNotifications(userId?: string | null): Promise<Notification[]> {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (userId != null && userId !== '') {
      query = query.eq('user_id', userId)
    } else {
      query = query.is('user_id', null)
    }
    
    const { data, error } = await query
    
    if (error || !data) return []
    
    return (data as Array<{ id: number; user_id: string | null; title: string; message: string; type?: string; is_read: number | boolean; action_url?: string; created_at: string }>).map(row => ({
      id: String(row.id),
      user_id: row.user_id ? String(row.user_id) : null,
      title: row.title,
      message: row.message,
      type: row.type || 'info',
      is_read: Boolean(row.is_read),
      action_url: row.action_url || undefined,
      created_at: row.created_at,
    }))
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const { error } = await this.updateData('notifications', { is_read: true }, 'id', id)
    
    return !error
  }

  // Settings (table settings: key text primary key, value text, updated_at timestamptz)
  async getSettings(): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase
      .from('settings')
      .select('key, value')
    if (error) {
      if (error.code === '42P01') return {} // table n'existe pas encore
      logger.warn('[SupabaseAdapter] getSettings error:', { message: error.message })
      return {}
    }
    const out: Record<string, unknown> = {}
    ;(data || []).forEach((row: { key: string; value: string | unknown }) => {
      try {
        out[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
      } catch {
        out[row.key] = row.value
      }
    })
    return out
  }

  async updateSettings(settings: Record<string, unknown>): Promise<boolean> {
    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      updated_at: new Date().toISOString(),
    }))
    const { error } = await this.supabase.from('settings').upsert(rows as never, { onConflict: 'key' })
    if (error) {
      if (error.code === '42P01') {
        logger.warn('[SupabaseAdapter] Table settings manquante. Exécutez supabase-settings-table.sql dans Supabase SQL Editor.')
        return false
      }
      logger.error('[SupabaseAdapter] updateSettings error:', { message: error.message })
      return false
    }
    return true
  }

  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const [productsResult, ordersResult, usersResult, paymentsResult] = await Promise.all([
      this.supabase.from('products').select('id', { count: 'exact', head: true }).or('is_active.is.null,is_active.eq.true'),
      this.supabase.from('orders').select('id', { count: 'exact', head: true }),
      this.supabase.from('users').select('id', { count: 'exact', head: true }),
      this.supabase.from('payments').select('amount').eq('status', 'completed'),
    ])

    const totalRevenue = (paymentsResult.data as Array<{ amount: number }> | null)?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0

    return {
      totalProducts: productsResult.count || 0,
      totalOrders: ordersResult.count || 0,
      totalUsers: usersResult.count || 0,
      totalRevenue: totalRevenue,
    }
  }

  // Mappers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapUser(row: any): User {
    return {
      id: String(row.id),
      phone: row.phone,
      password_hash: row.password_hash,
      first_name: row.first_name || undefined,
      last_name: row.last_name || undefined,
      role: row.role || 'user',
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapProduct(row: any): Product {
    if (!row || typeof row !== 'object') {
      logger.warn('[SupabaseAdapter] mapProduct: row null or invalid, returning minimal product')
      return {
        id: '',
        name: 'Sans nom',
        description: undefined,
        price: 0,
        image_url: undefined,
        images: undefined,
        category: undefined,
        category_id: undefined,
        is_available: false,
        is_active: false,
        is_featured: false,
        main_image: undefined,
        created_at: undefined,
        updated_at: undefined,
      }
    }
    // Gérer les images (peut être string JSON ou array)
    let images: string[] = []
    if (row.images) {
      if (typeof row.images === 'string') {
        try {
          const parsed = JSON.parse(row.images)
          images = Array.isArray(parsed) ? parsed.filter((img: unknown): img is string => typeof img === 'string') : [row.images]
        } catch {
          images = [row.images]
        }
      } else if (Array.isArray(row.images)) {
        images = row.images.filter((img: unknown): img is string => typeof img === 'string')
      }
    }

    // Normaliser les URLs d'images pour éviter les chemins Windows absolus
    const imageUrl = normalizeImageUrl(row.image_url || row.main_image || null)
    const normalizedImages = images.map(img => normalizeImageUrl(img))

    const price = Number(row.price)
    const numPrice = Number.isFinite(price) ? price : 0

    return {
      id: String(row.id ?? ''),
      name: row.name != null ? String(row.name) : 'Sans nom',
      name_ar: row.name_ar != null ? String(row.name_ar) : undefined,
      description: row.description != null ? String(row.description) : undefined,
      price: numPrice,
      original_price: row.original_price != null && Number.isFinite(Number(row.original_price)) ? Number(row.original_price) : undefined,
      image_url: imageUrl !== '/placeholder.svg' ? imageUrl : undefined,
      images: normalizedImages.length > 0 && normalizedImages.some(img => img !== '/placeholder.svg')
        ? normalizedImages.filter(img => img !== '/placeholder.svg')
        : undefined,
      category: row.category != null ? String(row.category) : undefined,
      category_id: row.category_id != null ? String(row.category_id) : (row.category != null ? String(row.category) : undefined),
      is_available: row.is_active !== false,
      is_active: row.is_active !== false,
      is_featured: Boolean(row.is_featured),
      rating: row.rating != null && Number.isFinite(Number(row.rating)) ? Number(row.rating) : undefined,
      reviews_count: row.reviews_count != null && Number.isFinite(Number(row.reviews_count)) ? Number(row.reviews_count) : undefined,
      main_image: row.main_image != null ? String(row.main_image) : (row.image_url != null ? String(row.image_url) : undefined),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapOrder(row: any): Order {
    return {
      id: String(row.id),
      user_id: row.user_id ? String(row.user_id) : null,
      total_amount: Number(row.total_amount),
      status: row.status,
      shipping_address: row.shipping_address || undefined,
      phone: row.phone || undefined,
      notes: row.notes || undefined,
      created_at: row.created_at,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapPayment(row: any): Payment {
    return {
      id: String(row.id),
      order_id: String(row.order_id),
      amount: Number(row.amount),
      payment_method: row.payment_method,
      status: row.status,
      transaction_id: row.transaction_id || undefined,
    }
  }
}

