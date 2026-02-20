# Script PowerShell pour préparer le déploiement Vercel
# Exécutez: .\scripts\prepare-deployment.ps1

Write-Host "=== 🚀 PRÉPARATION DÉPLOIEMENT VERCEL ===" -ForegroundColor Green
Write-Host ""

# Vérifier que nous sommes dans le bon dossier
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Projet détecté" -ForegroundColor Green
Write-Host ""

# Étape 1: Vérifier le build
Write-Host "📦 Étape 1: Vérification du build..." -ForegroundColor Yellow
try {
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build réussi !" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors du build. Corrigez les erreurs avant de continuer." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur lors du build: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Étape 2: Vérifier les variables d'environnement
Write-Host "🔐 Étape 2: Vérification des variables d'environnement..." -ForegroundColor Yellow

$requiredVars = @("JWT_SECRET", "NEXT_PUBLIC_SITE_URL")
$missingVars = @()

foreach ($var in $requiredVars) {
    if (-not (Get-Content .env.local -ErrorAction SilentlyContinue | Select-String "^$var=")) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  Variables manquantes dans .env.local:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "📝 Ces variables seront nécessaires pour Vercel:" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "✅ Variables d'environnement présentes" -ForegroundColor Green
}

Write-Host ""

# Étape 3: Générer JWT_SECRET si manquant
if ($missingVars -contains "JWT_SECRET") {
    Write-Host "🔑 Étape 3: Génération de JWT_SECRET..." -ForegroundColor Yellow
    try {
        $jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
        Write-Host "✅ JWT_SECRET généré: $jwtSecret" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Ajoutez cette ligne dans .env.local:" -ForegroundColor Cyan
        Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor White
        Write-Host ""
        Write-Host "📋 Et dans Vercel Dashboard → Environment Variables:" -ForegroundColor Cyan
        Write-Host "   Key: JWT_SECRET" -ForegroundColor White
        Write-Host "   Value: $jwtSecret" -ForegroundColor White
        Write-Host ""
    } catch {
        Write-Host "❌ Erreur lors de la génération: $_" -ForegroundColor Red
    }
}

# Étape 4: Vérifier la base de données
Write-Host "🗄️  Étape 4: Vérification de la base de données..." -ForegroundColor Yellow
if (Test-Path "data/inoxya_bijoux.db") {
    $dbSize = (Get-Item "data/inoxya_bijoux.db").Length / 1KB
    Write-Host "✅ Base SQLite trouvée ($([math]::Round($dbSize, 2)) KB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 N'oubliez pas de migrer vers PostgreSQL sur Vercel:" -ForegroundColor Cyan
    Write-Host "   1. Créez une base PostgreSQL dans Vercel Dashboard → Storage" -ForegroundColor White
    Write-Host "   2. Copiez la DATABASE_URL" -ForegroundColor White
    Write-Host "   3. Ajoutez-la dans Vercel → Environment Variables" -ForegroundColor White
    Write-Host "   4. Exécutez: npm run db:migrate:sqlite-to-postgres" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Base SQLite non trouvée" -ForegroundColor Yellow
}

# Étape 5: Résumé
Write-Host "=== 📋 RÉSUMÉ ===" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Build vérifié" -ForegroundColor Green
Write-Host "✅ Projet prêt pour déploiement" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Allez sur https://vercel.com" -ForegroundColor White
Write-Host "   2. Créez un compte (ou connectez-vous)" -ForegroundColor White
Write-Host "   3. Cliquez sur 'Add New...' → 'Project'" -ForegroundColor White
Write-Host "   4. Importez votre repository GitHub" -ForegroundColor White
Write-Host "   5. Configurez les variables d'environnement" -ForegroundColor White
Write-Host "   6. Créez une base PostgreSQL" -ForegroundColor White
Write-Host "   7. Cliquez sur 'Deploy'" -ForegroundColor White
Write-Host ""
Write-Host "📖 Guide détaillé: DEPLOIEMENT_ETAPE_PAR_ETAPE_FACILE.md" -ForegroundColor Cyan
Write-Host ""

