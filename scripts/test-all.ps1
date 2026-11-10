# ==============================================================================
# MBMS — Run All Tests
# Executes API unit tests (Vitest) + shared package tests.
# Scope: local folder only. Does NOT touch GitHub.
# ==============================================================================
$ErrorActionPreference = "Stop"
Write-Host "=== MBMS Test Runner ===" -ForegroundColor Cyan

Write-Host "`n[1/3] API unit tests (apps/api)..." -ForegroundColor Yellow
npm test --workspace=apps/api
$apiCode = $LASTEXITCODE
Write-Host "API exit code: $apiCode" -ForegroundColor Gray

Write-Host "`n[2/3] Shared package tests (packages/shared)..." -ForegroundColor Yellow
npm test --workspace=packages/shared
$sharedCode = $LASTEXITCODE
Write-Host "Shared exit code: $sharedCode" -ForegroundColor Gray

Write-Host "`n[3/3] Web e2e tests (apps/web) — requires dev servers running..." -ForegroundColor Yellow
Write-Host "Skipping e2e unless servers are up. Run: 'npm run test:e2e --workspace=apps/web'" -ForegroundColor Gray

if ($apiCode -eq 0 -and $sharedCode -eq 0) {
  Write-Host "`n=== All unit tests PASSED ===" -ForegroundColor Green
  exit 0
} else {
  Write-Host "`n=== Some tests FAILED ===" -ForegroundColor Red
  exit 1
}
