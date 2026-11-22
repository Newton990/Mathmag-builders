$ErrorActionPreference = "Stop"

Write-Host "=== MBMS Unified Local Setup ===" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 24 or later is required."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is required."
}

Write-Host "node $(node --version)"
Write-Host "npm $(npm --version)"
npm install --include=dev
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example. Fill in JWT_SECRET and MFA_ENCRYPTION_KEY."
}

Write-Host "Next:"
Write-Host "  npm run dev"
Write-Host "  npm test"
Write-Host "PostgreSQL migrations run automatically from apps/api/src/migrate.ts when node server.js starts."
