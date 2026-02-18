# Script de nettoyage du cache Next.js
# Supprime le dossier .next et les fichiers de cache temporaires

Write-Host "🧹 Nettoyage du cache Next.js..." -ForegroundColor Cyan

# Supprimer le dossier .next
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Cache .next supprimé" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Dossier .next introuvable (déjà nettoyé)" -ForegroundColor Yellow
}

# Supprimer le fichier tsconfig.tsbuildinfo
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo"
    Write-Host "✅ tsconfig.tsbuildinfo supprimé" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Nettoyage terminé ! Vous pouvez maintenant redémarrer le serveur avec: npm run dev" -ForegroundColor Green

