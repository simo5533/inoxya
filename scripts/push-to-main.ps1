# Push to main (not fix/dev-server-restore)
# Run from project root: .\scripts\push-to-main.ps1
# Commits on current branch are merged into main, then main is pushed.

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

Write-Host "=== Push to main ===" -ForegroundColor Cyan
Write-Host ""

$branch = git branch --show-current 2>&1
$status = git status --porcelain 2>&1

if ($status) {
    Write-Host "You have uncommitted changes. Commit first, then run this script again:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  git add -A" -ForegroundColor Gray
    Write-Host '  git commit -m "fix: ready for main"' -ForegroundColor Gray
    Write-Host "  .\scripts\push-to-main.ps1" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Fetch and checkout main
git fetch origin 2>&1 | Out-Null
git checkout main 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Could not checkout main. Create it: git checkout -b main" -ForegroundColor Red
    exit 1
}

# If we were on fix/dev-server-restore, merge it into main so main has the latest
if ($branch -match "fix/dev-server-restore") {
    Write-Host "Merging $branch into main..." -ForegroundColor Cyan
    git merge $branch --no-edit 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Merge had conflicts. Resolve them, then: git push origin main" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Pushing main to origin..." -ForegroundColor Cyan
git push origin main 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Done. main pushed to GitHub." -ForegroundColor Green
} else {
    Write-Host "Push failed. Check remote and run: git push origin main" -ForegroundColor Red
    exit 1
}
