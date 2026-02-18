# Script de déploiement rapide sur Vercel pour www.inoxya.ma (PowerShell)
# Usage: .\deploy-vercel.ps1

Write-Host "🚀 DÉPLOIEMENT VERCEL - www.inoxya.ma" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Vercel CLI est installé
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI n'est pas installé" -ForegroundColor Red
    Write-Host "   Installation: npm i -g vercel" -ForegroundColor Yellow
    exit 1
}

# Vérifier que le build fonctionne
Write-Host "📦 Vérification du build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Le build a échoué. Corrigez les erreurs avant de continuer." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build réussi!" -ForegroundColor Green
Write-Host ""

# Vérifier les variables d'environnement
Write-Host "🔐 Vérification des variables d'environnement..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Variables requises:" -ForegroundColor Cyan
Write-Host "  - NEXT_PUBLIC_SITE_URL=https://www.inoxya.ma"
Write-Host "  - JWT_SECRET=<secret-généré>"
Write-Host "  - NODE_ENV=production"
Write-Host ""
$confirm = Read-Host "Les variables sont-elles configurées dans Vercel? (y/n)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "⚠️  Configurez d'abord les variables dans Vercel Dashboard" -ForegroundColor Yellow
    Write-Host "   Settings → Environment Variables" -ForegroundColor Yellow
    exit 1
}

# Déployer
Write-Host "🚀 Déploiement en production..." -ForegroundColor Yellow
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ DÉPLOIEMENT RÉUSSI!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Vérifiez votre site sur:" -ForegroundColor Cyan
    Write-Host "   - https://www.inoxya.ma"
    Write-Host ""
    Write-Host "📊 Dashboard Vercel:" -ForegroundColor Cyan
    Write-Host "   https://vercel.com/dashboard"
} else {
    Write-Host ""
    Write-Host "❌ Le déploiement a échoué" -ForegroundColor Red
    Write-Host "   Vérifiez les logs ci-dessus" -ForegroundColor Yellow
    exit 1
}

