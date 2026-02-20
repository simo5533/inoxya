Write-Host "INOXYA BIJOUX - AUTO DEPLOY SCRIPT" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Step 1 - Clean cache
Write-Host "`nStep 1: Cleaning build cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
Write-Host "Cache cleaned" -ForegroundColor Green

# Step 2 - Install dependencies
Write-Host "`nStep 2: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed" -ForegroundColor Green

# Step 3 - Test build locally
Write-Host "`nStep 3: Testing build..." -ForegroundColor Yellow
npm run build 2>&1 | Tee-Object -Variable buildOutput

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nBUILD FAILED - Analyzing errors..." -ForegroundColor Red
    
    # Show only errors
    $buildOutput | Select-String -Pattern "Error|error|failed" | Select-Object -First 20
    
    Write-Host "`nCommon fixes to try:" -ForegroundColor Yellow
    Write-Host "  1. Check next.config.mjs for experimental flags" -ForegroundColor White
    Write-Host "  2. Check for missing npm packages" -ForegroundColor White
    Write-Host "  3. Check for 'fs' module in client components" -ForegroundColor White
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Step 4 - Git commit and push
Write-Host "`nStep 4: Pushing to GitHub..." -ForegroundColor Yellow
git add .
$commitMessage = "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm') - auto deploy"
git commit -m $commitMessage
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Git push failed" -ForegroundColor Red
    exit 1
}
Write-Host "Pushed to GitHub!" -ForegroundColor Green

# Step 5 - Deploy to Vercel
Write-Host "`nStep 5: Deploying to Vercel..." -ForegroundColor Yellow

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "Your site is live on Vercel!" -ForegroundColor Cyan
} else {
    Write-Host "`nVercel deployment failed" -ForegroundColor Red
    Write-Host "Check Vercel dashboard for details" -ForegroundColor Yellow
}
