# ==============================================================================
# MBMS — Local Development Setup Script
# Runs everything needed to get the repo running locally.
# Scope: local folder only. Does NOT touch GitHub.
# ==============================================================================
$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path "."
Write-Host "=== MBMS Local Dev Setup ===" -ForegroundColor Cyan
Write-Host "Repo root: $repoRoot" -ForegroundColor Gray

# ── 1. Prerequisite checks ─────────────────────────────────────────────────────
Write-Host "`n[1/6] Checking prerequisites..." -ForegroundColor Yellow

function Test-Command($cmd) {
  return (Get-Command $cmd -ErrorAction SilentlyContinue) -ne $null
}

$missing = @()
if (-not (Test-Command node)) { $missing += "node" }
if (-not (Test-Command npm))  { $missing += "npm" }
if (-not (Test-Command docker)) { $missing += "docker" }
if ($missing.Count -gt 0) {
  Write-Host "MISSING: $($missing -join ', ')" -ForegroundColor Red
  Write-Host "Please install Node.js 20+, npm 10+, and Docker Desktop, then re-run." -ForegroundColor Red
  exit 1
}
Write-Host "node $(node --version)" -ForegroundColor Green
Write-Host "npm $(npm --version)" -ForegroundColor Green
Write-Host "docker $(docker --version)" -ForegroundColor Green

# ── 2. Install dependencies ────────────────────────────────────────────────────
Write-Host "`n[2/6] Installing npm dependencies (all workspaces)..." -ForegroundColor Yellow
npm install --include=dev
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed" -ForegroundColor Red; exit 1 }
Write-Host "Dependencies installed." -ForegroundColor Green

# ── 3. Start Docker services ───────────────────────────────────────────────────
Write-Host "`n[3/6] Starting PostgreSQL + MinIO via Docker Compose..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) { Write-Host "docker compose up failed" -ForegroundColor Red; exit 1 }

Write-Host "Waiting for services to become healthy..." -ForegroundColor Gray
$healthy = $false
for ($i = 0; $i -lt 60; $i++) {
  $status = docker compose ps --format json | ConvertFrom-Json
  $allHealthy = ($status | Where-Object { $_.State -eq "healthy" }).Count -eq ($status | Measure-Object).Count
  if ($allHealthy) { $healthy = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $healthy) {
  Write-Host "Services did not become healthy in time. Run 'docker compose ps' to check." -ForegroundColor Red
  exit 1
}
Write-Host "All services healthy." -ForegroundColor Green

# ── 4. Generate Prisma client ──────────────────────────────────────────────────
Write-Host "`n[4/6] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate --workspace=apps/api
if ($LASTEXITCODE -ne 0) { Write-Host "prisma generate failed" -ForegroundColor Red; exit 1 }
Write-Host "Prisma client generated." -ForegroundColor Green

# ── 5. Run migrations ──────────────────────────────────────────────────────────
Write-Host "`n[5/6] Running database migrations..." -ForegroundColor Yellow
npm run db:migrate --workspace=apps/api
if ($LASTEXITCODE -ne 0) { Write-Host "db:migrate failed" -ForegroundColor Red; exit 1 }
Write-Host "Migrations applied." -ForegroundColor Green

# ── 6. Seed database ───────────────────────────────────────────────────────────
Write-Host "`n[6/6] Seeding database (fake data only)..." -ForegroundColor Yellow
npm run db:seed --workspace=apps/api
if ($LASTEXITCODE -ne 0) { Write-Host "db:seed failed" -ForegroundColor Red; exit 1 }
Write-Host "Database seeded." -ForegroundColor Green

Write-Host "`n=== Setup complete ===" -ForegroundColor Cyan
Write-Host "API:  http://localhost:3001/api/health" -ForegroundColor Gray
Write-Host "Web:  http://localhost:5173" -ForegroundColor Gray
Write-Host "MinIO: http://localhost:9001" -ForegroundColor Gray
Write-Host "`nNext: run '.\scripts\test-all.ps1' to verify, or start dev with 'npm run dev'." -ForegroundColor Gray
