$ErrorActionPreference = "Stop"

Write-Host "=== MBMS Local PostgreSQL Setup ===" -ForegroundColor Cyan
npm install --include=dev
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example."
}

Write-Host "Set DATABASE_URL or Wasmer-style DB_* values, plus JWT_SECRET and MFA_ENCRYPTION_KEY."
Write-Host "Start the unified server with:"
Write-Host "  npm run build"
Write-Host "  node server.js"
