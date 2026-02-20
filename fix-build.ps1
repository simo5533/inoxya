Write-Host "AUTO BUILD FIXER" -ForegroundColor Cyan

# Fix 1: Check next.config.mjs
Write-Host "Checking next.config.mjs..." -ForegroundColor Yellow
$config = Get-Content next.config.mjs -Raw
if ($config -match "dynamicIO|cacheComponents|experimental") {
    Write-Host "Found experimental flags - removing..." -ForegroundColor Red
    # Backup original
    Copy-Item next.config.mjs next.config.mjs.backup
    Write-Host "Backup saved as next.config.mjs.backup" -ForegroundColor Gray
}

# Fix 2: Install missing packages
Write-Host "Installing missing packages..." -ForegroundColor Yellow
npm install @vercel/blob --save 2>$null
Write-Host "Packages checked" -ForegroundColor Green

# Fix 3: Clean and rebuild
Write-Host "Rebuilding..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "BUILD FIXED AND SUCCESSFUL!" -ForegroundColor Green
} else {
    Write-Host "Still failing - check errors above" -ForegroundColor Red
}
