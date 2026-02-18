# Script PowerShell pour exécuter le SQL admin
# Usage: .\scripts\execute-admin-sql.ps1

$ErrorActionPreference = "Stop"

Write-Host "🔐 Création de l'utilisateur admin..." -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$dbPath = Join-Path $projectRoot "data\inoxya_bijoux.db"
$sqlPath = Join-Path $scriptDir "create-admin.sql"

# Vérifier que les fichiers existent
if (-not (Test-Path $dbPath)) {
    Write-Host "❌ Base de données non trouvée: $dbPath" -ForegroundColor Red
    Write-Host "💡 Démarrez le serveur: npm run dev" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $sqlPath)) {
    Write-Host "❌ Script SQL non trouvé: $sqlPath" -ForegroundColor Red
    Write-Host "💡 Générez-le avec: npm run admin:sql" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Base de données trouvée: $dbPath" -ForegroundColor Green
Write-Host "✅ Script SQL trouvé: $sqlPath" -ForegroundColor Green
Write-Host ""

# Essayer d'utiliser sqlite3 si disponible
$sqlite3 = Get-Command sqlite3 -ErrorAction SilentlyContinue

if ($sqlite3) {
    Write-Host "📝 Exécution du script SQL avec sqlite3 CLI..." -ForegroundColor Cyan
    try {
        Get-Content $sqlPath | & sqlite3 $dbPath
        Write-Host "✅ Script SQL exécuté avec succès!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Vérification des utilisateurs admin..." -ForegroundColor Cyan
        $result = & sqlite3 $dbPath "SELECT id, phone, first_name, last_name, role FROM users WHERE role = 'admin';"
        if ($result) {
            Write-Host $result -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 Utilisateurs admin créés avec succès!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📱 Identifiants:" -ForegroundColor Cyan
            Write-Host "   Téléphone: 0612345678 ou admin_phone"
            Write-Host "   Mot de passe: Admin123!"
        } else {
            Write-Host "⚠️  Aucun utilisateur admin trouvé" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Erreur lors de l'exécution: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  sqlite3 CLI non trouvé" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Solutions:" -ForegroundColor Cyan
    Write-Host "   1. Installez sqlite3 CLI, OU" -ForegroundColor White
    Write-Host "   2. Utilisez DB Browser for SQLite:" -ForegroundColor White
    Write-Host "      - Téléchargez: https://sqlitebrowser.org/" -ForegroundColor Yellow
    Write-Host "      - Ouvrez: $dbPath" -ForegroundColor Yellow
    Write-Host "      - Exécutez: $sqlPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Commandes SQL à exécuter:" -ForegroundColor Cyan
    Get-Content $sqlPath | Write-Host
}
