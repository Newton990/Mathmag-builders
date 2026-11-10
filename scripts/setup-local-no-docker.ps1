# ==============================================================================
# MBMS — Local Setup WITHOUT Docker
# Sets up PostgreSQL directly on Windows, then runs API + web servers.
# ==============================================================================
$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path "."
Write-Host "=== MBMS Local Setup (No Docker) ===" -ForegroundColor Cyan

# ── 1. Check prerequisites ─────────────────────────────────────────────────────
Write-Host "`n[1/4] Checking prerequisites..." -ForegroundColor Yellow
$missing = @()
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { $missing += "node" }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { $missing += "npm" }
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { $missing += "postgresql (psql)" }
if ($missing.Count -gt 0) {
  Write-Host "MISSING: $($missing -join ', ')" -ForegroundColor Red
  Write-Host "Install Node.js from https://nodejs.org/" -ForegroundColor Gray
  Write-Host "Install PostgreSQL from https://www.postgresql.org/download/windows/" -ForegroundColor Gray
  exit 1
}
Write-Host "node $(node --version)" -ForegroundColor Green
Write-Host "npm $(npm --version)" -ForegroundColor Green
Write-Host "psql $(psql --version)" -ForegroundColor Green

# ── 2. Install npm dependencies ────────────────────────────────────────────────
Write-Host "`n[2/4] Installing npm dependencies..." -ForegroundColor Yellow
npm install --include=dev
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed" -ForegroundColor Red; exit 1 }

# ── 3. Setup PostgreSQL database ───────────────────────────────────────────────
Write-Host "`n[3/4] Setting up PostgreSQL database..." -ForegroundColor Yellow
Write-Host "You need to:" -ForegroundColor Gray
Write-Host "  1. Open pgAdmin or psql" -ForegroundColor Gray
Write-Host "  2. Create database: CREATE DATABASE mbms_dev;" -ForegroundColor Gray
Write-Host "  3. Create user (optional): CREATE USER mbms WITH PASSWORD 'your-password';" -ForegroundColor Gray
Write-Host "  4. Grant privileges: GRANT ALL PRIVILEGES ON DATABASE mbms_dev TO mbms;" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "Then copy .env.example to .env and set DATABASE_URL:" -ForegroundColor Gray
Write-Host "  DATABASE_URL='postgresql://mbms:your-password@localhost:5432/mbms_dev'" -ForegroundColor Gray
Write-Host "  JWT_SECRET=<64-char-hex>" -ForegroundColor Gray
Write-Host "  MFA_ENCRYPTION_KEY=<64-char-hex>" -ForegroundColor Gray
Write-Host "" -ForegroundColor Yellow
$envFile = Join-Path $repoRoot ".env"
$exampleFile = Join-Path $repoRoot ".env.example"
if (-not (Test-Path $envFile) -and (Test-Path $exampleFile)) {
  Copy-Item $exampleFile $envFile
  Write-Host "Created .env from .env.example — edit it with your values." -ForegroundColor Gray
} else {
  Write-Host ".env already exists or .env.example missing." -ForegroundColor Gray
}

# ── 4. Generate Prisma and run migrations ──────────────────────────────────────
Write-Host "`n[4/4] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate --workspace=apps/api
if ($LASTEXITCODE -ne 0) { Write-Host "prisma generate failed" -ForegroundColor Red; exit 1 }

Write-Host "" -ForegroundColor Yellow
Write-Host "Next steps:" -ForegroundColor Gray
Write-Host "  1. Edit .env with your DATABASE_URL, JWT_SECRET, MFA_ENCRYPTION_KEY" -ForegroundColor Gray
Write-Host "  2. Run: npx prisma migrate dev --workspace=apps/api" -ForegroundColor Gray
Write-Host "  3. Run: npm run db:seed --workspace=apps/api" -ForegroundColor Gray
Write-Host "  4. Run: npm run dev" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "API:  http://localhost:3001/api/health" -ForegroundColor Gray
Write-Host "Web:  http://localhost:5173" -ForegroundColor Gray
