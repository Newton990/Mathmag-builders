# ==============================================================================
# MBMS — Build All Workspaces
# Type-checks and builds API, web, and shared packages.
# Scope: local folder only. Does NOT touch GitHub.
# ==============================================================================
$ErrorActionPreference = "Stop"
Write-Host "=== MBMS Build All ===" -ForegroundColor Cyan

Write-Host "`n[1/3] Building shared package..." -ForegroundColor Yellow
npm run build --workspace=packages/shared
if ($LASTEXITCODE -ne 0) { Write-Host "shared build failed" -ForegroundColor Red; exit 1 }

Write-Host "`n[2/3] Building API (prisma generate + tsc)..." -ForegroundColor Yellow
npm run build --workspace=apps/api
if ($LASTEXITCODE -ne 0) { Write-Host "API build failed" -ForegroundColor Red; exit 1 }

Write-Host "`n[3/3] Building web (vite build)..." -ForegroundColor Yellow
npm run build --workspace=apps/web
if ($LASTEXITCODE -ne 0) { Write-Host "web build failed" -ForegroundColor Red; exit 1 }

Write-Host "`n=== All workspaces built successfully ===" -ForegroundColor Green
