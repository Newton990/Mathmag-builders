# ==============================================================================
# MBMS — Run Everything (Setup + Tests + Build + Actions)
# One-stop script for local development validation.
# Scope: local folder only. Does NOT touch GitHub.
# ==============================================================================
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MBMS — Run All (Local Only)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Setup
Write-Host "`n[Step 1] Setup dev environment..." -ForegroundColor Yellow
& ./scripts/setup-dev.ps1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Setup failed. Stopping." -ForegroundColor Red
  exit $LASTEXITCODE
}

# Step 2: Build
Write-Host "`n[Step 2] Build all workspaces..." -ForegroundColor Yellow
& ./scripts/build-all.ps1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed. Stopping." -ForegroundColor Red
  exit $LASTEXITCODE
}

# Step 3: Tests
Write-Host "`n[Step 3] Run all unit tests..." -ForegroundColor Yellow
& ./scripts/test-all.ps1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Tests failed. Stopping." -ForegroundColor Red
  exit $LASTEXITCODE
}

# Step 4: Start dev servers (background) for action exerciser
Write-Host "`n[Step 4] Starting dev servers in background..." -ForegroundColor Yellow
Start-Process npm -ArgumentList "run","dev" -WorkingDirectory (Resolve-Path ".") -WindowStyle Hidden
Write-Host "Waiting 15 seconds for servers to come up..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Step 5: Exercise all actions
Write-Host "`n[Step 5] Exercising every API action..." -ForegroundColor Yellow
node scripts/exercise-actions.mjs
if ($LASTEXITCODE -ne 0) {
  Write-Host "Action exerciser reported failures." -ForegroundColor Red
} else {
  Write-Host "All actions exercised successfully." -ForegroundColor Green
}

Write-Host "`n=== Run-all complete ===" -ForegroundColor Cyan
