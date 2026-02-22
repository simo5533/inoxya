# Script PowerShell pour configurer PostgreSQL sur Vercel
# Automatise les étapes possibles

Write-Host "🚀 CONFIGURATION POSTGRESQL POUR VERCEL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1 : Vérifier les produits locaux
Write-Host "Étape 1 : Vérification des produits locaux..." -ForegroundColor Yellow
npx tsx scripts/check-local-products.ts
Write-Host ""

# Étape 2 : Instructions pour Supabase
Write-Host "Étape 2 : Configuration Supabase (manuel, voir README)" -ForegroundColor Yellow
Write-Host "Veuillez suivre les instructions Supabase dans le README pour terminer la configuration." -ForegroundColor Gray
