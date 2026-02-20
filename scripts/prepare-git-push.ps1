# Script PowerShell pour préparer le push vers GitHub
# Exécutez: .\scripts\prepare-git-push.ps1

Write-Host "=== 🔐 PRÉPARATION PUSH GITHUB SÉCURISÉ ===" -ForegroundColor Green
Write-Host ""

# Vérifier que nous sommes dans le bon dossier
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Vérifier que Git est initialisé
if (-not (Test-Path ".git")) {
    Write-Host "❌ Erreur: Git n'est pas initialisé" -ForegroundColor Red
    Write-Host "   Exécutez: git init" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git initialisé" -ForegroundColor Green
Write-Host ""

# Vérifier le statut Git
Write-Host "📊 Vérification du statut Git..." -ForegroundColor Yellow
$gitStatus = git status --porcelain 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la vérification Git" -ForegroundColor Red
    exit 1
}

# Compter les fichiers modifiés et non trackés
$modifiedFiles = ($gitStatus | Select-String "^ M" | Measure-Object).Count
$untrackedFiles = ($gitStatus | Select-String "^??" | Measure-Object).Count

Write-Host "   Fichiers modifiés: $modifiedFiles" -ForegroundColor Cyan
Write-Host "   Fichiers non trackés: $untrackedFiles" -ForegroundColor Cyan
Write-Host ""

# Vérifier les fichiers sensibles qui ne doivent PAS être commités
Write-Host "🔒 Vérification des fichiers sensibles..." -ForegroundColor Yellow

$sensitiveFiles = @(
    ".env.local",
    "data/inoxya_bijoux.db",
    ".env",
    "*.db"
)

$foundSensitive = $false
foreach ($file in $sensitiveFiles) {
    if (Test-Path $file -ErrorAction SilentlyContinue) {
        $gitStatusCheck = git status --porcelain $file 2>&1
        if ($gitStatusCheck -match "^\?\?") {
            Write-Host "   ⚠️  Fichier sensible trouvé mais non tracké (OK): $file" -ForegroundColor Yellow
        } elseif ($gitStatusCheck -match "^ M" -or $gitStatusCheck -match "^A ") {
            Write-Host "   ❌ ATTENTION: Fichier sensible à commiter: $file" -ForegroundColor Red
            $foundSensitive = $true
        }
    }
}

if ($foundSensitive) {
    Write-Host ""
    Write-Host "❌ ERREUR: Des fichiers sensibles sont sur le point d'être commités !" -ForegroundColor Red
    Write-Host "   Vérifiez votre .gitignore et retirez ces fichiers du commit" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Aucun fichier sensible détecté" -ForegroundColor Green
Write-Host ""

# Vérifier .gitignore
Write-Host "📋 Vérification de .gitignore..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    $requiredIgnores = @(".env.local", "data/", "*.db", "node_modules/")
    $missingIgnores = @()
    
    foreach ($ignore in $requiredIgnores) {
        if ($gitignoreContent -notmatch [regex]::Escape($ignore)) {
            $missingIgnores += $ignore
        }
    }
    
    if ($missingIgnores.Count -gt 0) {
        Write-Host "   ⚠️  Patterns manquants dans .gitignore:" -ForegroundColor Yellow
        foreach ($ignore in $missingIgnores) {
            Write-Host "      - $ignore" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ .gitignore correct" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  .gitignore non trouvé (création recommandée)" -ForegroundColor Yellow
}

Write-Host ""

# Afficher les fichiers qui seront ajoutés
Write-Host "📦 Fichiers qui seront ajoutés au commit:" -ForegroundColor Yellow
Write-Host ""

# Fichiers modifiés
if ($modifiedFiles -gt 0) {
    Write-Host "   Modifiés:" -ForegroundColor Cyan
    $gitStatus | Select-String "^ M" | ForEach-Object {
        $file = ($_ -replace "^ M\s+", "").Trim()
        Write-Host "      - $file" -ForegroundColor White
    }
    Write-Host ""
}

# Fichiers non trackés (seulement les importants)
if ($untrackedFiles -gt 0) {
    Write-Host "   Nouveaux fichiers importants:" -ForegroundColor Cyan
    $importantFiles = @(
        "DEPLOIEMENT_ETAPE_PAR_ETAPE_FACILE.md",
        "CHECKLIST_DEPLOIEMENT_VISUELLE.md",
        "GUIDE_PUSH_GITHUB_SECURISE.md",
        "RAPPORT_COMPLET_PROJET_CLAUDE.md",
        "AUDIT_APPROFONDI_100_PERCENT.md",
        "scripts/prepare-deployment.ps1",
        "scripts/prepare-git-push.ps1"
    )
    
    foreach ($file in $importantFiles) {
        if (Test-Path $file) {
            $status = git status --porcelain $file 2>&1
            if ($status -match "^\?\?") {
                Write-Host "      + $file" -ForegroundColor Green
            }
        }
    }
    Write-Host ""
}

# Demander confirmation
Write-Host "❓ Voulez-vous continuer et créer un commit ?" -ForegroundColor Yellow
Write-Host "   Tapez 'O' pour Oui, 'N' pour Non" -ForegroundColor Cyan
$response = Read-Host

if ($response -ne "O" -and $response -ne "o" -and $response -ne "Y" -and $response -ne "y") {
    Write-Host ""
    Write-Host "❌ Opération annulée" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Ajouter les fichiers
Write-Host "📝 Ajout des fichiers..." -ForegroundColor Yellow

# Ajouter les fichiers modifiés
git add app/ lib/ middleware.ts 2>&1 | Out-Null

# Ajouter les nouveaux fichiers importants
$newFiles = @(
    "DEPLOIEMENT_ETAPE_PAR_ETAPE_FACILE.md",
    "CHECKLIST_DEPLOIEMENT_VISUELLE.md",
    "GUIDE_PUSH_GITHUB_SECURISE.md",
    "RAPPORT_COMPLET_PROJET_CLAUDE.md",
    "AUDIT_APPROFONDI_100_PERCENT.md",
    "scripts/prepare-deployment.ps1",
    "scripts/prepare-git-push.ps1",
    "scripts/create-admin-sqljs.js"
)

foreach ($file in $newFiles) {
    if (Test-Path $file) {
        git add $file 2>&1 | Out-Null
        Write-Host "   ✅ Ajouté: $file" -ForegroundColor Green
    }
}

Write-Host ""

# Créer le commit
Write-Host "💾 Création du commit..." -ForegroundColor Yellow
$commitMessage = "feat: Add deployment guides and prepare for Vercel deployment

- Add step-by-step deployment guide
- Add deployment checklist
- Add GitHub push guide
- Add deployment preparation scripts
- Add project audit and reports
- Fix TypeScript errors
- Improve admin authentication"

git commit -m $commitMessage 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit créé avec succès !" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la création du commit" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Vérifier le remote
Write-Host "🔗 Vérification du remote GitHub..." -ForegroundColor Yellow
$remote = git remote -v 2>&1

if ($remote -match "origin") {
    Write-Host "✅ Remote 'origin' configuré" -ForegroundColor Green
    Write-Host "   $remote" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📤 Pour pousser vers GitHub:" -ForegroundColor Yellow
    Write-Host "   git push -u origin $(git branch --show-current)" -ForegroundColor White
} else {
    Write-Host "⚠️  Aucun remote configuré" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "   1. Créez un repository sur GitHub" -ForegroundColor White
    Write-Host "   2. Ajoutez le remote:" -ForegroundColor White
    Write-Host "      git remote add origin https://github.com/VOTRE-USERNAME/inoxya-bijoux.git" -ForegroundColor White
    Write-Host "   3. Poussez le code:" -ForegroundColor White
    Write-Host "      git push -u origin $(git branch --show-current)" -ForegroundColor White
}

Write-Host ""
Write-Host "=== ✅ PRÉPARATION TERMINÉE ===" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Guide complet: GUIDE_PUSH_GITHUB_SECURISE.md" -ForegroundColor Cyan
Write-Host ""

