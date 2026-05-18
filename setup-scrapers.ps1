# ============================================================
# Setup Script - Mineracao Scrapers (Windows)
# Execute: Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
# Depois:  .\setup-scrapers.ps1
# ============================================================

Write-Host "=== Mineracao Scrapers Setup ===" -ForegroundColor Cyan

# 1. Verificar Python
Write-Host "`n[1/5] Verificando Python..." -ForegroundColor Yellow
$pythonCmd = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $ver = & $cmd --version 2>&1
        if ($ver -match "Python 3\.(1[1-9]|[2-9]\d)") {
            $pythonCmd = $cmd
            Write-Host "OK: $ver" -ForegroundColor Green
            break
        }
    } catch {}
}

if (-not $pythonCmd) {
    Write-Host "ERRO: Python 3.11+ nao encontrado!" -ForegroundColor Red
    Write-Host "Instale em: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "Marque 'Add Python to PATH' durante instalacao!" -ForegroundColor Yellow
    exit 1
}

# 2. Criar venv
Write-Host "`n[2/5] Criando ambiente virtual..." -ForegroundColor Yellow
$venvPath = "scrapers\venv"
if (-not (Test-Path $venvPath)) {
    & $pythonCmd -m venv $venvPath
    Write-Host "OK: venv criado" -ForegroundColor Green
} else {
    Write-Host "OK: venv ja existe" -ForegroundColor Green
}

# 3. Instalar dependencias
Write-Host "`n[3/5] Instalando dependencias Python..." -ForegroundColor Yellow
$pip = ".\scrapers\venv\Scripts\pip.exe"
& $pip install --upgrade pip -q
& $pip install -r scrapers\requirements.txt
Write-Host "OK: Dependencias instaladas" -ForegroundColor Green

# 4. Instalar Playwright
Write-Host "`n[4/5] Instalando Playwright Chromium..." -ForegroundColor Yellow
$playwright = ".\scrapers\venv\Scripts\playwright.exe"
& $playwright install chromium
Write-Host "OK: Chromium instalado" -ForegroundColor Green

# 5. Verificar Docker
Write-Host "`n[5/5] Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVer = docker --version 2>&1
    Write-Host "OK: $dockerVer" -ForegroundColor Green

    Write-Host "`nSubindo Redis + FlareSolverr via Docker..." -ForegroundColor Yellow
    docker-compose up -d redis flaresolverr
    Write-Host "OK: Servicos Docker iniciados" -ForegroundColor Green
} catch {
    Write-Host "AVISO: Docker nao encontrado." -ForegroundColor Yellow
    Write-Host "Instale Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host "Ou instale Redis manualmente: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Yellow
}

Write-Host "`n=== Setup concluido! ===" -ForegroundColor Cyan
Write-Host @"

Para iniciar os workers, abra 2 terminais na pasta do projeto:

Terminal 1 (Worker):
  .\scrapers\venv\Scripts\activate
  cd scrapers
  celery -A worker worker --loglevel=info -c 2

Terminal 2 (Scheduler):
  .\scrapers\venv\Scripts\activate
  cd scrapers
  celery -A worker beat --loglevel=info

Monitor (opcional):
  http://localhost:5555  (Flower - apos subir via Docker)

"@ -ForegroundColor White
