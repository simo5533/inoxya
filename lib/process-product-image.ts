/**
 * Utility function to process product images
 * Converts images to WEBP format and saves them in the correct location
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { select, execute, initializeDatabase } from '@/lib/sqlite'
import { logger } from '@/lib/logger'
import type { Product } from '@/lib/types'

/**
 * Sanitize product name for filename
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Process and save product image
 * @param imagePath - Path to the source image file
 * @param productId - Product ID
 * @param productName - Product name (for filename)
 * @returns The image URL path
 */
export async function processProductImage(
  imagePath: string,
  productId: string | number,
  productName: string
): Promise<string> {
  try {
    // Check if source file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`)
    }

    // Create products directory if it doesn't exist
    const productsDir = path.join(process.cwd(), 'public', 'images', 'products')
    if (!fs.existsSync(productsDir)) {
      fs.mkdirSync(productsDir, { recursive: true })
    }

    // Generate filename: productname-ID.webp
    const sanitizedName = sanitizeFilename(productName)
    const filename = `${sanitizedName}-${productId}.webp`
    const outputPath = path.join(productsDir, filename)

    // Convert and optimize image to WEBP with better compression
    // Production: quality 85 (bon compromis taille/qualité)
    // Dev: quality 90 (meilleure qualité pour tests)
    const quality = process.env.NODE_ENV === 'production' ? 85 : 90
    
    await sharp(imagePath)
      .resize(800, 800, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ 
        quality,
        effort: 6, // Compression effort (0-6, 6 = meilleure compression)
        nearLossless: false // Désactivé pour meilleure compression
      })
      .toFile(outputPath)

    // Generate the URL path (relative to public folder)
    const imageUrl = `/images/products/${filename}`

    logger.info(`Image processed and saved: ${imageUrl}`)
    return imageUrl
  } catch (error) {
    logger.error('❌ Error processing image:', error)
    throw error
  }
}

/**
 * Update product image in database
 * @param productId - Product ID
 * @param imageUrl - Image URL path
 * @returns Updated product object
 */
export async function updateProductImage(
  productId: string | number,
  imageUrl: string
): Promise<Product> {
  try {
    // Initialize database if needed
    initializeDatabase()

    // Check if product exists
    const products = select('SELECT * FROM products WHERE id = ?', [productId])
    if (products.length === 0) {
      throw new Error(`Product with ID ${productId} not found`)
    }

    // Update product image_url
    execute(
      `UPDATE products SET image_url = ?, updated_at = ? WHERE id = ?`,
      [imageUrl, new Date().toISOString(), productId]
    )

    // Get updated product
    const updatedProducts = select('SELECT * FROM products WHERE id = ?', [productId])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedProduct = (updatedProducts[0] as any) as Product

    logger.info(`Product image updated in database`)
    return updatedProduct
  } catch (error) {
    logger.error('❌ Error updating product image:', error)
    throw error
  }
}

/**
 * Complete workflow: process image and update product
 * @param imagePath - Path to the source image file
 * @param productIdOrName - Product ID or name
 * @returns Updated product object
 */
export async function addImageToProduct(
  imagePath: string,
  productIdOrName: string | number
): Promise<Product> {
  try {
    initializeDatabase()

    // Find product by ID or name
    let product: Product
    if (typeof productIdOrName === 'number' || !isNaN(Number(productIdOrName))) {
      // Search by ID
      const products = select('SELECT * FROM products WHERE id = ?', [productIdOrName]) as Product[]
      if (products.length === 0 || !products[0]) {
        throw new Error(`Product with ID ${productIdOrName} not found`)
      }
      product = products[0]
    } else {
      // Search by name
      const products = select('SELECT * FROM products WHERE name LIKE ?', [`%${productIdOrName}%`]) as Product[]
      if (products.length === 0 || !products[0]) {
        throw new Error(`Product with name "${productIdOrName}" not found`)
      }
      if (products.length > 1) {
        logger.warn(`⚠️ Multiple products found for "${productIdOrName}". Using first match.`)
      }
      product = products[0]
    }

    // Process image
    const imageUrl = await processProductImage(imagePath, product.id, product.name)

    // Update product in database
    const updatedProduct = await updateProductImage(product.id, imageUrl)

    return updatedProduct
  } catch (error) {
    logger.error('❌ Error adding image to product:', error)
    throw error
  }
}

