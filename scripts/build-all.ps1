$ErrorActionPreference = "Stop"

Write-Host "=== MBMS Unified Build ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Unified build failed" }
npx tsc --project apps/api/tsconfig.json --noEmit
if ($LASTEXITCODE -ne 0) { throw "API typecheck failed" }
Write-Host "Unified build and API typecheck succeeded." -ForegroundColor Green
