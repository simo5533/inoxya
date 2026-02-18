/**
 * Script to add an image to a product
 * Usage: node scripts/add-product-image.js <image-path> <product-id-or-name>
 * 
 * Example:
 *   node scripts/add-product-image.js ./temp-uploads/watch.jpg "1"
 *   node scripts/add-product-image.js ./temp-uploads/watch.jpg "Bague Berbère"
 */

const sharp = require('sharp')
const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

// Database setup
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

/**
 * Sanitize product name for filename
 */
function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Process and save product image
 */
async function processProductImage(imagePath, productId, productName) {
  // Check if source file exists
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`)
  }

  // Create products directory if it doesn't exist
  const productsDir = path.join(__dirname, '..', 'public', 'images', 'products')
  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true })
  }

  // Generate filename: productname-ID.webp
  const sanitizedName = sanitizeFilename(productName)
  const filename = `${sanitizedName}-${productId}.webp`
  const outputPath = path.join(productsDir, filename)

  // Convert and optimize image to WEBP
  await sharp(imagePath)
    .resize(800, 800, {
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 90 })
    .toFile(outputPath)

  // Generate the URL path (relative to public folder)
  const imageUrl = `/images/products/${filename}`

  console.log(`✅ Image processed and saved: ${imageUrl}`)
  return imageUrl
}

/**
 * Find product by ID or name
 */
function findProduct(productIdOrName) {
  // Try as ID first
  if (!isNaN(Number(productIdOrName))) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productIdOrName)
    if (product) return product
  }
  
  // Try as name
  const products = db.prepare('SELECT * FROM products WHERE name LIKE ?').all(`%${productIdOrName}%`)
  if (products.length === 0) {
    throw new Error(`Product with ID/name "${productIdOrName}" not found`)
  }
  if (products.length > 1) {
    console.warn(`⚠️ Multiple products found for "${productIdOrName}". Using first match.`)
    console.warn(`   Found: ${products.map(p => `${p.id}: ${p.name}`).join(', ')}`)
  }
  return products[0]
}

/**
 * Update product image in database
 */
function updateProductImage(productId, imageUrl) {
  db.prepare(
    'UPDATE products SET image_url = ?, updated_at = ? WHERE id = ?'
  ).run(imageUrl, new Date().toISOString(), productId)
  
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)
  return product
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.error('❌ Usage: node scripts/add-product-image.js <image-path> <product-id-or-name>')
    console.error('')
    console.error('Examples:')
    console.error('  node scripts/add-product-image.js ./temp-uploads/watch.jpg "1"')
    console.error('  node scripts/add-product-image.js ./temp-uploads/watch.jpg "Bague Berbère"')
    process.exit(1)
  }

  const imagePath = path.resolve(args[0])
  const productIdOrName = args[1]

  try {
    console.log(`📸 Processing image: ${imagePath}`)
    console.log(`🔍 Looking for product: ${productIdOrName}`)
    
    // Find product
    const product = findProduct(productIdOrName)
    console.log(`✅ Found product: ${product.name} (ID: ${product.id})`)
    
    // Process image
    const imageUrl = await processProductImage(imagePath, product.id, product.name)
    
    // Update product in database
    const updatedProduct = updateProductImage(product.id, imageUrl)
    
    console.log('\n✅ Product updated successfully!')
    console.log(JSON.stringify({
      id: updatedProduct.id.toString(),
      name: updatedProduct.name,
      image: updatedProduct.image_url
    }, null, 2))
    
    db.close()
  } catch (error) {
    console.error('❌ Error:', error.message)
    db.close()
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { processProductImage, findProduct, updateProductImage }

