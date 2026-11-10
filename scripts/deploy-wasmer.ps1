# ==============================================================================
# MBMS — Wasmer Deployment Loop
# Builds frontend and backend, checks for errors, repeats until clean.
# When both build without errors, outputs Wasmer deploy commands.
# Scope: local folder only. Does NOT touch GitHub.
# ==============================================================================
$ErrorActionPreference = "Continue"
$maxLoops = 10
$loop = 0

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MBMS — Wasmer Deployment Build Loop" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

while ($loop -lt $maxLoops) {
  $loop++
  Write-Host "`n--- Loop $loop of $maxLoops ---" -ForegroundColor Yellow

  # ── Step 1: Build backend (API) ─────────────────────────────────────────
  Write-Host "`n[Step 1] Building API for Wasmer Edge..." -ForegroundColor Yellow
  $apiBuild = npx tsc --project apps/api/tsconfig.json --noEmit 2>&1
  $apiExit = $LASTEXITCODE

  if ($apiExit -ne 0) {
    Write-Host "API build FAILED:" -ForegroundColor Red
    Write-Host $apiBuild -ForegroundColor Red
    Write-Host "`nFix the errors above, then re-run this script." -ForegroundColor Yellow
    exit 1
  } else {
    Write-Host "API build PASSED (no TypeScript errors)." -ForegroundColor Green
  }

  # ── Step 2: Build frontend (Web) ────────────────────────────────────────
  Write-Host "`n[Step 2] Building frontend for Wasmer Edge..." -ForegroundColor Yellow
  $webBuild = npm run build --workspace=@mbms/web 2>&1
  $webExit = $LASTEXITCODE

  if ($webExit -ne 0) {
    Write-Host "Frontend build FAILED:" -ForegroundColor Red
    Write-Host $webBuild -ForegroundColor Red
    Write-Host "`nFix the errors above, then re-run this script." -ForegroundColor Yellow
    exit 1
  } else {
    Write-Host "Frontend build PASSED (Vite production build OK)." -ForegroundColor Green
  }

  # ── Step 3: Success ─────────────────────────────────────────────────────
  Write-Host "`n================================================" -ForegroundColor Green
  Write-Host "  BOTH BUILD SUCCESSFULLY — READY FOR WASMER" -ForegroundColor Green
  Write-Host "================================================" -ForegroundColor Green

  Write-Host "`nNext steps to deploy on Wasmer:" -ForegroundColor Cyan
  Write-Host "" -ForegroundColor Gray
  Write-Host "1. Install Wasmer CLI:" -ForegroundColor Gray
  Write-Host "   curl https://get.wasmer.io -sSfL | sh" -ForegroundColor Gray
  Write-Host "   wasmer login" -ForegroundColor Gray
  Write-Host "" -ForegroundColor Gray
  Write-Host "2. Deploy backend (API):" -ForegroundColor Gray
  Write-Host "   wasmer edge deploy apps/api --name mathmag-api" -ForegroundColor Gray
  Write-Host "   wasmer edge secret set JWT_SECRET \"<64-char-hex>\"" -ForegroundColor Gray
  Write-Host "   wasmer edge secret set MFA_ENCRYPTION_KEY \"<64-char-hex>\"" -ForegroundColor Gray
  Write-Host "   wasmer edge secret set CORS_ORIGIN \"https://mathmag-web.wasmer.app\"" -ForegroundColor Gray
  Write-Host "" -ForegroundColor Gray
  Write-Host "3. Deploy frontend:" -ForegroundColor Gray
  Write-Host "   wasmer edge deploy apps/web/dist --name mathmag-web" -ForegroundColor Gray
  Write-Host "" -ForegroundColor Gray
  Write-Host "4. Set frontend API URL:" -ForegroundColor Gray
  Write-Host "   wasmer edge secret set VITE_API_BASE_URL \"https://mathmag-api.wasmer.app/api\"" -ForegroundColor Gray
  Write-Host "" -ForegroundColor Gray
  Write-Host "5. Verify:" -ForegroundColor Gray
  Write-Host "   https://mathmag-web.wasmer.app" -ForegroundColor Gray
  Write-Host "   https://mathmag-api.wasmer.app/api/health" -ForegroundColor Gray

  break
}

if ($loop -ge $maxLoops) {
  Write-Host "`nReached max loops ($maxLoops) without success." -ForegroundColor Red
  exit 1
}
