/**
 * Schémas de validation Zod pour toutes les routes API
 * PHASE 4 - Security Hardening
 */

import { z } from 'zod'

// ============================================
// SCHÉMAS DE BASE
// ============================================

/**
 * Validation ID numérique
 */
export const numericIdSchema = z.union([
  z.string().regex(/^\d+$/).transform(Number),
  z.number().int().positive()
])

/**
 * Validation téléphone marocain
 * Accepte aussi "admin_phone" comme identifiant spécial pour les admins
 */
export const phoneSchema = z.string()
  .min(1, 'Le numéro de téléphone est requis')
  .transform((val) => {
    // Normaliser le numéro : supprimer espaces, tirets, points
    return val.trim().replace(/[\s\-\.]/g, '')
  })
  .refine(
    (val) => {
      // Accepter admin_phone comme identifiant spécial
      if (val === 'admin_phone') return true
      // Format: +212[5-7][0-9]{8} (mobile MA) ou national 0 puis 9 chiffres (5–9 en 2e position pour tolérance saisie)
      // Exemples: +212612345678, 0612345678, 0855555555 (saisie fréquente)
      if (val.startsWith('+212')) return /^\+212[5-7][0-9]{8}$/.test(val)
      if (val.startsWith('0')) return /^0[5-9][0-9]{8}$/.test(val)
      return false
    },
    {
      message: 'Format téléphone invalide (ex: +212612345678 ou 0612345678)'
    }
  )

/**
 * Validation email
 */
export const emailSchema = z.string().email('Format email invalide').max(254)

/**
 * Validation mot de passe
 */
export const passwordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Le mot de passe doit contenir au moins un caractère spécial')

/**
 * Validation prix
 */
export const priceSchema = z.number().positive('Le prix doit être supérieur à 0')

/**
 * Validation quantité
 */
export const quantitySchema = z.number().int().min(1, 'Quantité minimale: 1').max(100, 'Quantité maximale: 100')

/**
 * Validation stock
 */
export const stockSchema = z.number().int().min(0, 'Le stock ne peut pas être négatif')

/**
 * Référence image : URL https, /images/..., proxy Blob private (/api/shop-blob?...), chemin local.
 */
export const productImageRefSchema = z.union([
  z.string().url('URL image invalide'),
  z.string().regex(/^\/images\//, 'Chemin relatif doit commencer par /images/'),
  z.string().regex(/^\/api\/shop-blob\?/, 'URL proxy Blob invalide'),
  z.string().regex(/^\//, 'Chemin relatif doit commencer par /'),
  z.string().min(2).refine(
    (s) => /^[A-Za-z]:\\/i.test(s) || /\\/.test(s) || s.startsWith('/Users/') || s.startsWith('/home/'),
    { message: 'Chemin local invalide' }
  ),
])

const optionalProductImageRefSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string' && val.trim() === '') return null
    return val
  },
  productImageRefSchema.optional().nullable()
)

// ============================================
// SCHÉMAS PRODUITS
// ============================================

/**
 * Schéma pour créer un produit
 */
export const createProductSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long'),
  name_ar: z.string().max(200, 'Le nom arabe est trop long').optional().nullable(),
  description: z.string().min(1, 'La description est requise').max(5000, 'La description est trop longue'),
  price: priceSchema,
  original_price: priceSchema.optional().nullable(),
  category: z.string().min(1, 'La catégorie est requise'),
  stock: stockSchema.optional().default(0),
  is_active: z.boolean().optional().default(true),
  image_url: optionalProductImageRefSchema,
  main_image: optionalProductImageRefSchema,
  images: z
    .array(productImageRefSchema)
    .max(6, 'Maximum 6 images secondaires')
    .optional()
    .default([]),
}).refine(
  (data) => {
    // Vérifier que au moins une image principale est fournie (non null et non vide)
    const hasImageUrl = data.image_url && typeof data.image_url === 'string' && data.image_url.trim() !== ''
    const hasMainImage = data.main_image && typeof data.main_image === 'string' && data.main_image.trim() !== ''
    return hasImageUrl || hasMainImage
  },
  { message: 'Une image principale est requise. Utilisez le bouton Upload pour télécharger une image.', path: ['image_url'] }
).refine(
  (data) => !data.original_price || data.original_price > data.price,
  { message: 'Le prix original doit être supérieur au prix actuel', path: ['original_price'] }
)

/**
 * Schéma pour mettre à jour un produit
 * Tous les champs sont optionnels pour permettre les mises à jour partielles
 */
export const updateProductSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long').optional(),
  name_ar: z.string().max(200, 'Le nom arabe est trop long').optional().nullable(),
  description: z.string().min(1, 'La description est requise').max(5000, 'La description est trop longue').optional(),
  price: priceSchema.optional(),
  original_price: priceSchema.optional().nullable(),
  category: z.string().min(1, 'La catégorie est requise').optional(),
  stock: stockSchema.optional(),
  is_active: z.boolean().optional(),
  image_url: optionalProductImageRefSchema,
  main_image: optionalProductImageRefSchema,
  images: z.array(productImageRefSchema).max(6, 'Maximum 6 images secondaires').optional(),
}).refine(
  (data) => {
    // Si original_price est fourni, il doit être supérieur à price (si price est fourni)
    if (data.original_price && data.price) {
      return data.original_price > data.price
    }
    return true
  },
  { message: 'Le prix original doit être supérieur au prix actuel', path: ['original_price'] }
)

// ============================================
// SCHÉMAS COMMANDES
// ============================================

/**
 * Statut de commande valide
 */
export const orderStatusSchema = z.enum([
  'pending',
  'awaiting_bank_transfer',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
])

/**
 * Référence produit pack perso (SQLite: chiffres ; adapter: UUID ou texte)
 */
export const bijouRefIdSchema = z.preprocess((val) => {
  if (val === null || val === undefined) return val
  if (typeof val === 'number') {
    if (!Number.isFinite(val) || val <= 0) return undefined
    return String(Math.trunc(val))
  }
  if (typeof val === 'string') return val.trim()
  return String(val)
}, z.string().min(1).max(128))

/**
 * Lignes d’un pack personnalisé (−20 % côté serveur)
 */
export const customPackLineSchema = z.object({
  bijou_id: bijouRefIdSchema,
  quantity: quantitySchema,
})

/**
 * Item de commande
 */
export const orderItemSchema = z.object({
  bijou_id: numericIdSchema.optional(),
  pack_id: numericIdSchema.optional(),
  quantity: quantitySchema,
  price: priceSchema,
  custom_pack_lines: z.array(customPackLineSchema).min(1).max(30).optional(),
}).refine(
  (data) =>
    data.bijou_id != null ||
    data.pack_id != null ||
    (Array.isArray(data.custom_pack_lines) && data.custom_pack_lines.length > 0),
  { message: 'Un produit, un pack ou un pack personnalisé est requis', path: ['bijou_id'] }
)

/**
 * Schéma pour créer une commande
 */
export const createOrderSchema = z.object({
  bijou_id: numericIdSchema.optional(),
  pack_id: numericIdSchema.optional(),
  customer_name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  customer_address: z.string().min(1, 'L\'adresse est requise').max(500, 'L\'adresse est trop longue'),
  customer_phone: phoneSchema,
  quantity: quantitySchema.optional().default(1),
  total_amount: priceSchema
}).refine(
  (data) => data.bijou_id || data.pack_id,
  { message: 'Un produit ou un pack est requis', path: ['bijou_id'] }
)

/** Méthodes checkout canoniques : `cod` (livraison), `bank_transfer` (virement). Anciennes valeurs acceptées puis normalisées. */
const checkoutPaymentMethodSchema = z
  .enum(['cod', 'bank_transfer', 'cash_on_delivery', 'cash', 'card'])
  .optional()
  .default('cod')
  .transform((v): 'cod' | 'bank_transfer' => {
    if (v === 'cash_on_delivery' || v === 'cash' || v === 'card') return 'cod'
    return v
  })

/**
 * Schéma pour checkout
 */
export const checkoutSchema = z.object({
  phone: phoneSchema,
  city: z.string().min(1, 'La ville est requise').max(100, 'La ville est trop longue'),
  address: z.string().min(1, 'L\'adresse est requise').max(500, 'L\'adresse est trop longue'),
  notes: z.string().max(1000, 'Les notes sont trop longues').optional().nullable(),
  payment_method: checkoutPaymentMethodSchema,
  customer_name: z.string().max(100, 'Le nom est trop long').optional().nullable(),
  items: z.array(orderItemSchema).min(1, 'Le panier ne peut pas être vide').max(50, 'Trop d\'articles dans la commande')
})

/**
 * Création d'avis produit (API publique)
 */
export const reviewCreateSchema = z.object({
  productId: z.string().min(1, 'Produit requis').max(128).trim(),
  name: z.string().max(80, 'Nom trop long').trim().optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(5, 'Commentaire trop court (5 caractères min)').max(2000, 'Commentaire trop long').trim(),
})

/**
 * Schéma pour mettre à jour le statut d'une commande
 */
export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema
})

/**
 * Schéma pour créer un paiement
 */
export const createPaymentSchema = z.object({
  order_id: numericIdSchema,
  payment_method: z
    .enum(['cod', 'bank_transfer', 'cash', 'card', 'cash_on_delivery'], {
      errorMap: () => ({ message: 'Méthode de paiement invalide' })
    })
    .transform((v): 'cod' | 'bank_transfer' => (v === 'bank_transfer' ? 'bank_transfer' : 'cod')),
  transaction_id: z.string().max(255, 'ID transaction trop long').optional().nullable(),
  amount: priceSchema.optional() // Optionnel car montant vérifié depuis la commande
})

/**
 * Schéma pour mettre à jour le statut d'un paiement
 */
export const updatePaymentStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded'], {
    errorMap: () => ({ message: 'Statut de paiement invalide' })
  }),
  transaction_id: z.string().max(255, 'ID transaction trop long').optional().nullable()
})

// ============================================
// SCHÉMAS AUTHENTIFICATION
// ============================================

/**
 * Schéma pour login
 */
export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Le mot de passe est requis')
})

/**
 * Schéma pour register
 */
export const registerSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'Le prénom est requis').max(50, 'Le prénom est trop long').optional(),
  lastName: z.string().min(1, 'Le nom est requis').max(50, 'Le nom est trop long').optional(),
  email: emailSchema.optional().nullable()
})

// ============================================
// SCHÉMAS PACKS
// ============================================

/**
 * Schéma pour composition d'un pack (bijou dans pack)
 */
export const packCompositionItemSchema = z.object({
  bijou_id: numericIdSchema,
  quantity: quantitySchema.optional().default(1),
  is_required: z.boolean().optional().default(true),
  is_customizable: z.boolean().optional().default(false)
})

/**
 * Schéma pour créer un pack
 */
export const createPackSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long'),
  slug: z.string().min(1, 'Le slug est requis').max(200, 'Le slug est trop long').regex(/^[a-z0-9-]+$/, 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'),
  description: z.string().min(1, 'La description est requise').max(5000, 'La description est trop longue'),
  price: priceSchema,
  image_url: productImageRefSchema,
  is_featured: z.boolean().optional().default(false),
  composition: z.array(packCompositionItemSchema).optional().default([])
})

/**
 * Schéma pour mettre à jour un pack
 * image_url : accepte URL, chemin relatif ou chemin local (Windows/Unix)
 */
export const updatePackSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long').optional(),
  slug: z.string().min(1, 'Le slug est requis').max(200, 'Le slug est trop long').regex(/^[a-z0-9-]+$/, 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets').optional(),
  description: z.string().min(1, 'La description est requise').max(5000, 'La description est trop longue').optional(),
  price: priceSchema.optional(),
  image_url: z.preprocess(
    (val) => {
      if (val === undefined || val === null) return undefined
      if (typeof val === 'string' && val.trim() === '') return undefined
      return val
    },
    productImageRefSchema.optional()
  ),
  is_featured: z.boolean().optional()
})

// ============================================
// SCHÉMAS ADMIN
// ============================================

/**
 * Schéma pour modifier le rôle d'un utilisateur
 */
export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'moderator', 'admin'])
})

/**
 * Schéma pour demande sur mesure
 */
export const customRequestSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  email: emailSchema,
  phone: phoneSchema,
  type: z.string().min(1, 'Le type est requis').max(50, 'Le type est trop long'),
  description: z.string().min(1, 'La description est requise').max(2000, 'La description est trop longue'),
  budget: z.string().max(50, 'Le budget est trop long').optional().nullable()
})

// ============================================
// SCHÉMAS PANIER
// ============================================

/**
 * Schéma pour ajouter un article au panier
 */
export const addToCartSchema = z.object({
  product_id: numericIdSchema,
  quantity: quantitySchema.optional().default(1)
})

/**
 * Schéma pour mettre à jour la quantité dans le panier
 */
export const updateCartSchema = z.object({
  product_id: numericIdSchema,
  quantity: quantitySchema
})

// ============================================
// SCHÉMAS FAVORIS
// ============================================

/**
 * Schéma pour ajouter/retirer des favoris
 */
export const favoriteActionSchema = z.object({
  bijou_id: numericIdSchema.optional(),
  pack_id: numericIdSchema.optional(),
  action: z.enum(['add', 'remove'], {
    errorMap: () => ({ message: 'Action doit être "add" ou "remove"' })
  })
}).refine(
  (data) => data.bijou_id || data.pack_id,
  { message: 'Un produit ou un pack est requis', path: ['bijou_id'] }
)

// ============================================
// SCHÉMAS FACTURES (admin)
// ============================================

export const invoiceCustomerInfoSchema = z.object({
  name: z.string().max(200).trim().optional(),
  address: z.string().max(800).trim().optional(),
  phone: z.string().max(40).trim().optional(),
})

export const invoiceItemSchema = z.object({
  name: z.string().max(300).trim().optional(),
  quantity: z.coerce.number().int().min(1).max(99999).optional(),
  price: z.coerce.number().min(0).max(1e9).optional(),
})

export const generateInvoiceBodySchema = z.object({
  order_id: z.union([z.string().min(1).max(128), z.number()]),
  customer_info: invoiceCustomerInfoSchema,
  items: z.array(invoiceItemSchema).min(1).max(500),
  total_amount: z.coerce.number().finite().min(0).max(1e12),
})

export const sendInvoiceEmailBodySchema = z.object({
  order_id: z.union([z.string().min(1).max(128), z.number()]),
  customer_email: emailSchema,
  customer_name: z.string().min(1).max(200).trim(),
  invoice_data: z.record(z.string(), z.unknown()),
})

// ============================================
// HELPERS DE VALIDATION
// ============================================

/**
 * Valider les données avec un schéma Zod et retourner les erreurs formatées
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join('.')
        return path ? `${path}: ${err.message}` : err.message
      })
      return { success: false, errors }
    }
    return { success: false, errors: ['Erreur de validation inconnue'] }
  }
}

/**
 * Valider les données avec un schéma Zod et lancer une erreur si invalide
 * Utile pour les routes API qui doivent retourner une erreur HTTP
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data)
}

