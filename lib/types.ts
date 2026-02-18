/**
 * Types TypeScript centralisés pour INOXYA BIJOUX
 * Tous les types de l'application sont définis ici
 */

// ==================== PRODUITS ====================

export interface Product {
  id: string | number
  name: string
  name_ar?: string
  description?: string
  price: number
  original_price?: number
  category: string
  category_id?: string
  stock: number
  is_active: boolean
  is_available?: boolean
  is_featured?: boolean
  is_custom?: boolean
  image_url?: string
  main_image?: string
  images?: string[] | string
  rating?: number
  reviews_count?: number
  pack_id?: string
  created_at?: string | Date
  updated_at?: string | Date
  created_by?: string
}

export interface ProductResponse {
  id: string
  name: string
  price: number
  main_image: string | null
  images: string[]
}

// ==================== CATÉGORIES ====================

export interface Category {
  id: string | number
  name: string
  slug: string
  description?: string
  image_url?: string
  is_active?: boolean
  created_at?: string | Date
  updated_at?: string | Date
}

// ==================== PACKS ====================

export interface Pack {
  id: string | number
  name: string
  name_ar?: string
  slug?: string
  description?: string
  price: number
  original_price?: number
  discount_percentage?: number
  image_url?: string
  products?: Product[]
  is_active?: boolean
  is_featured?: boolean
  created_at?: string | Date
  updated_at?: string | Date
}

// ==================== UTILISATEURS ====================

export interface User {
  id: string
  phone: string
  first_name?: string
  last_name?: string
  email?: string
  role: 'admin' | 'moderator' | 'user'
  is_active?: boolean
  created_at?: string | Date
  updated_at?: string | Date
}

// ==================== COMMANDES ====================

export interface Order {
  id: string | number
  user_id: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  items: OrderItem[]
  shipping_address?: string
  created_at?: string | Date
  updated_at?: string | Date
}

export interface OrderItem {
  id?: string | number
  order_id?: string | number
  bijou_id: string | number
  product_id?: string | number
  price: number
  quantity: number
  name?: string
}

// ==================== PANIER ====================

export interface CartItem {
  id: string
  name: string
  name_ar?: string
  price: number
  original_price?: number
  quantity: number
  image_url?: string
  category?: string
  description?: string
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  error: string
  status?: number
  details?: unknown
}

// ==================== DATABASE ====================

export interface DatabaseProduct {
  id: number
  name: string
  name_ar?: string | null
  description?: string | null
  price: number
  original_price?: number | null
  category: string
  stock: number
  is_active: boolean
  image_url?: string | null
  images?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

// ==================== UTILITAIRES ====================

export type ProductRecord = Record<string, unknown> & Partial<Product>
export type CategoryRecord = Record<string, unknown> & Partial<Category>
export type PackRecord = Record<string, unknown> & Partial<Pack>

