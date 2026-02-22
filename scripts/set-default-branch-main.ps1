# Set default branch to main on GitHub (inoxya-bijoux)
# Run from project root: .\scripts\set-default-branch-main.ps1
# If not logged in, script will open the browser and copy the code; complete login, then run again.

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

Write-Host "=== Default branch -> main ===" -ForegroundColor Cyan
Write-Host ""

$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
    Write-Host "GitHub CLI (gh) not found. Install: winget install GitHub.cli" -ForegroundColor Yellow
    Write-Host "Then open a new terminal and run this script again." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or do it manually: https://github.com/basmaouarid/inoxya-bijoux/settings -> Default branch -> main -> Update" -ForegroundColor Gray
    exit 1
}

# Check if already logged in
$status = & gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in to GitHub. Opening browser and copying code to clipboard..." -ForegroundColor Yellow
    Write-Host ""
    & gh auth login -h github.com -p https -w --clipboard
    Write-Host ""
    Write-Host "If the browser opened: paste the code (already in clipboard), authorize, then run this script again:" -ForegroundColor Cyan
    Write-Host "  .\scripts\set-default-branch-main.ps1" -ForegroundColor White
    exit 0
}

# Logged in: set default branch
Write-Host "Setting default branch to 'main'..." -ForegroundColor Cyan
& gh repo edit basmaouarid/inoxya-bijoux --default-branch main
if ($LASTEXITCODE -eq 0) {
    Write-Host "Done. Default branch is now 'main'." -ForegroundColor Green
} else {
    Write-Host "Failed. Do it manually: https://github.com/basmaouarid/inoxya-bijoux/settings -> Default branch -> main -> Update" -ForegroundColor Yellow
    exit 1
}
