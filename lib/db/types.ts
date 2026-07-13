/**
 * Types partagés pour la couche d'abstraction DB
 */

export interface Product {
  id: string
  name: string
  name_ar?: string
  description?: string
  price: number
  original_price?: number
  image_url?: string
  main_image?: string
  images?: string | string[]
  category_id?: string
  category?: string
  is_available: boolean
  is_active?: boolean
  is_featured: boolean
  stock?: number
  rating?: number
  reviews_count?: number
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
}

export interface Pack {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  image_url?: string
  is_featured: boolean
  /** Nombre de pièces affichées sur la fiche pack */
  items_count?: number
  created_by?: number | string | null
}

export interface User {
  id: string
  phone: string
  password_hash?: string // Optionnel car getUserById ne le retourne pas (sécurité)
  first_name?: string
  last_name?: string
  role: string
  created_at?: string
  updated_at?: string
}

export interface Order {
  id: string
  user_id: string | null
  total_amount: number
  status: string
  shipping_address?: string | unknown
  phone?: string
  notes?: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  bijou_id: string
  pack_id?: string
  quantity: number
  price: number
}

export interface CartItem {
  id: string
  user_id: string
  bijou_id: string
  quantity: number
}

export interface Favorite {
  id: string
  user_id: string
  bijou_id: string
  pack_id?: string
}

export interface Payment {
  id: string
  order_id: string
  amount: number
  payment_method: string
  status: string
  transaction_id?: string | null
}

export interface Notification {
  id: string
  user_id?: string | null
  title: string
  message: string
  type?: string
  is_read: boolean
  created_at: string
  action_url?: string
}

export interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
}

