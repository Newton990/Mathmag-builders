# Build the unified MBMS application before deploying it with `wasmer deploy`.
$ErrorActionPreference = "Stop"

Write-Host "Building MBMS API and frontend for Wasmer..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed; fix the reported errors before deploying." -ForegroundColor Red
  exit $LASTEXITCODE
}

if (!(Test-Path "apps\api\dist\edge.js") -or !(Test-Path "public\index.html")) {
  Write-Host "Build completed without producing the expected API or frontend output." -ForegroundColor Red
  exit 1
}

Write-Host "Unified build passed. Deploy the application with: wasmer deploy" -ForegroundColor Green
