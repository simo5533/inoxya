# 📸 Temporary Image Uploads

Drop your product images here before processing them.

## Usage

1. Save your product image in this folder
2. Run the script:
   ```bash
   node scripts/add-product-image.js ./temp-uploads/your-image.jpg "Product ID or Name"
   ```

## Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WEBP (.webp)

Images will be automatically converted to WEBP format and optimized.

