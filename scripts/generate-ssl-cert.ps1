# Script PowerShell pour generer des certificats SSL auto-signes
$ErrorActionPreference = "Continue"

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$certDir = Join-Path $projectRoot "certs"

if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force | Out-Null
    Write-Host "Dossier certs/ cree" -ForegroundColor Green
}

$keyPath = Join-Path $certDir "localhost-key.pem"
$certPath = Join-Path $certDir "localhost.pem"

if ((Test-Path $keyPath) -and (Test-Path $certPath)) {
    Write-Host "Certificats SSL existent deja" -ForegroundColor Green
    Write-Host "   - $keyPath"
    Write-Host "   - $certPath"
    exit 0
}

Write-Host "Generation de certificats SSL..." -ForegroundColor Cyan

$cert = New-SelfSignedCertificate `
    -DnsName "localhost", "*.localhost", "127.0.0.1" `
    -CertStoreLocation "cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddYears(1) `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -FriendlyName "INOXYA BIJOUX Development Certificate"

if (-not $cert) {
    Write-Host "Erreur: Impossible de creer le certificat" -ForegroundColor Red
    exit 1
}

Write-Host "Certificat cree dans le magasin Windows" -ForegroundColor Green

$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
$certBase64 = [System.Convert]::ToBase64String($certBytes)
$certPEM = "-----BEGIN CERTIFICATE-----`n"
for ($i = 0; $i -lt $certBase64.Length; $i += 64) {
    $line = $certBase64.Substring($i, [Math]::Min(64, $certBase64.Length - $i))
    $certPEM += $line + "`n"
}
$certPEM += "-----END CERTIFICATE-----`n"
[System.IO.File]::WriteAllText($certPath, $certPEM)
Write-Host "Certificat exporte: $certPath" -ForegroundColor Green

$key = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
if ($key) {
    $keyBytes = $key.Export([System.Security.Cryptography.CngKeyBlobFormat]::Pkcs8PrivateBlob)
    $keyBase64 = [System.Convert]::ToBase64String($keyBytes)
    $keyPEM = "-----BEGIN PRIVATE KEY-----`n"
    for ($i = 0; $i -lt $keyBase64.Length; $i += 64) {
        $line = $keyBase64.Substring($i, [Math]::Min(64, $keyBase64.Length - $i))
        $keyPEM += $line + "`n"
    }
    $keyPEM += "-----END PRIVATE KEY-----`n"
    [System.IO.File]::WriteAllText($keyPath, $keyPEM)
    Write-Host "Cle privee exportee: $keyPath" -ForegroundColor Green
}

Remove-Item "cert:\CurrentUser\My\$($cert.Thumbprint)" -Force -ErrorAction SilentlyContinue
Write-Host "Certificat supprime du magasin Windows" -ForegroundColor Green

Write-Host ""
Write-Host "Certificats SSL generes avec succes!" -ForegroundColor Green
Write-Host ""
Write-Host "Fichiers crees:" -ForegroundColor Cyan
Write-Host "   - $certPath"
Write-Host "   - $keyPath"
Write-Host ""
Write-Host "Vous pouvez maintenant demarrer le serveur HTTPS:" -ForegroundColor Yellow
Write-Host "   npm run dev:https" -ForegroundColor White
