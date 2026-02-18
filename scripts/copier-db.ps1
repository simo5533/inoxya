# Script PowerShell pour copier le fichier DB du sous-dossier vers data/

$projectRoot = 'c:\Users\Basma\Desktop\inoxya-bijoux 2'
$source = Join-Path $projectRoot 'inoxya-bijoux 2\data\inoxya_bijoux.db'
$target = Join-Path $projectRoot 'data\inoxya_bijoux.db'

Write-Host ''
Write-Host '=== COPIE DU FICHIER DE BASE DE DONNEES ===' -ForegroundColor Cyan
Write-Host ''

# Verifier si le fichier source existe
if (Test-Path $source) {
    $sourceFile = Get-Item $source
    Write-Host 'Fichier source trouve:' -ForegroundColor Green
    Write-Host "   $source" -ForegroundColor White
    Write-Host "   Taille: $([math]::Round($sourceFile.Length/1KB, 2)) KB" -ForegroundColor Cyan
    Write-Host "   Date: $($sourceFile.LastWriteTime)" -ForegroundColor Gray
    Write-Host ''
    
    # Creer le repertoire data si necessaire
    $dataDir = Split-Path $target -Parent
    if (-not (Test-Path $dataDir)) {
        New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
        Write-Host "Repertoire cree: $dataDir" -ForegroundColor Green
    }
    
    # Verifier si le fichier cible existe deja
    if (Test-Path $target) {
        $targetFile = Get-Item $target
        Write-Host 'Fichier cible existe deja:' -ForegroundColor Yellow
        Write-Host "   $target" -ForegroundColor White
        Write-Host "   Taille actuelle: $([math]::Round($targetFile.Length/1KB, 2)) KB" -ForegroundColor Cyan
        Write-Host ''
        Write-Host 'Remplacement par le fichier source...' -ForegroundColor Yellow
    } else {
        Write-Host 'Copie du fichier source vers la cible...' -ForegroundColor Yellow
    }
    
    # Copier le fichier
    try {
        Copy-Item $source $target -Force
        $newTarget = Get-Item $target
        Write-Host ''
        Write-Host 'Fichier copie avec succes!' -ForegroundColor Green
        Write-Host "   $target" -ForegroundColor White
        Write-Host "   Taille: $([math]::Round($newTarget.Length/1KB, 2)) KB" -ForegroundColor Cyan
        Write-Host ''
        Write-Host 'Prochaines etapes:' -ForegroundColor Yellow
        Write-Host '   1. Redemarrez le serveur: npm run dev' -ForegroundColor White
        Write-Host '   2. Verifiez: http://localhost:3003/api/health' -ForegroundColor White
        Write-Host '   3. Verifiez: http://localhost:3003/api/products' -ForegroundColor White
    } catch {
        Write-Host ''
        Write-Host "Erreur lors de la copie: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host 'Fichier source non trouve:' -ForegroundColor Red
    Write-Host "   $source" -ForegroundColor White
    Write-Host ''
    Write-Host 'Recherche d autres fichiers DB...' -ForegroundColor Yellow
    
    # Chercher d'autres fichiers DB
    $dbFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter '*.db' -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 100KB }
    
    if ($dbFiles.Count -gt 0) {
        Write-Host ''
        Write-Host 'Fichiers DB trouves:' -ForegroundColor Cyan
        foreach ($file in $dbFiles) {
            Write-Host "   - $($file.FullName)" -ForegroundColor White
            Write-Host "     Taille: $([math]::Round($file.Length/1KB, 2)) KB" -ForegroundColor Cyan
        }
    } else {
        Write-Host '   Aucun fichier DB volumineux trouve' -ForegroundColor Yellow
    }
    
    exit 1
}

Write-Host ''
