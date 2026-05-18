"""
Script de diagnóstico completo do sistema.
Execute: python test_system.py
Testa cada componente em ordem e mostra o que está OK ou falhou.
"""
import sys
import os
import time
import json

# ── Cores no terminal ──────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def ok(msg):   print(f"  {GREEN}✓ {msg}{RESET}")
def fail(msg): print(f"  {RED}✗ {msg}{RESET}")
def warn(msg): print(f"  {YELLOW}⚠ {msg}{RESET}")
def info(msg): print(f"  {CYAN}→ {msg}{RESET}")
def header(msg): print(f"\n{BOLD}{CYAN}{'='*55}{RESET}\n{BOLD}  {msg}{RESET}\n{CYAN}{'='*55}{RESET}")

results = {}

# ══════════════════════════════════════════════════════════════
# TESTE 1 — Python e dependências
# ══════════════════════════════════════════════════════════════
header("TESTE 1 — Python e Dependências")

# Python version
v = sys.version_info
if v.major == 3 and v.minor >= 11:
    ok(f"Python {v.major}.{v.minor}.{v.micro}")
    results["python"] = True
else:
    fail(f"Python {v.major}.{v.minor} — precisa de 3.11+")
    results["python"] = False

# Dependências críticas
deps = {
    "redis":         "redis",
    "celery":        "celery",
    "supabase":      "supabase",
    "playwright":    "playwright",
    "httpx":         "httpx",
    "curl_cffi":     "curl_cffi",
    "loguru":        "loguru",
    "fake_useragent":"fake_useragent",
    "bs4":           "bs4 (beautifulsoup4)",
    "dotenv":        "python-dotenv",
}

missing = []
for mod, name in deps.items():
    try:
        __import__(mod)
        ok(f"{name}")
    except ImportError:
        fail(f"{name} — NÃO instalado")
        missing.append(name)

results["deps"] = len(missing) == 0
if missing:
    warn(f"Instale: pip install {' '.join(m.split()[0] for m in missing)}")

# ══════════════════════════════════════════════════════════════
# TESTE 2 — Redis
# ══════════════════════════════════════════════════════════════
header("TESTE 2 — Redis (broker Celery)")

try:
    import redis as redis_lib
    r = redis_lib.Redis(host="localhost", port=6379, socket_connect_timeout=3)
    pong = r.ping()
    if pong:
        ok("Redis respondendo em localhost:6379")
        info(f"Versão: {r.info()['redis_version']}")
        info(f"Memória usada: {r.info()['used_memory_human']}")
        results["redis"] = True
    else:
        raise Exception("sem resposta")
except Exception as e:
    fail(f"Redis não disponível: {e}")
    warn("Suba o Redis: docker run -d -p 6379:6379 redis:alpine")
    results["redis"] = False

# ══════════════════════════════════════════════════════════════
# TESTE 3 — FlareSolverr
# ══════════════════════════════════════════════════════════════
header("TESTE 3 — FlareSolverr (bypass anti-bot)")

try:
    import httpx
    r = httpx.get("http://localhost:8191/", timeout=5)
    data = r.json()
    if data.get("msg") == "FlareSolverr is ready!":
        ok(f"FlareSolverr v{data.get('version', '?')} pronto em :8191")
        results["flaresolverr"] = True
    else:
        warn(f"FlareSolverr respondeu mas status inesperado: {data}")
        results["flaresolverr"] = False
except Exception as e:
    fail(f"FlareSolverr não disponível: {e}")
    warn("Suba: docker run -d -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest")
    results["flaresolverr"] = False

# ══════════════════════════════════════════════════════════════
# TESTE 4 — Supabase
# ══════════════════════════════════════════════════════════════
header("TESTE 4 — Supabase Database")

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

    from supabase import create_client
    url  = os.getenv("SUPABASE_URL")
    key  = os.getenv("SUPABASE_SERVICE_KEY")

    if not url or not key:
        fail("SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados em scrapers/.env")
        results["supabase"] = False
    else:
        client = create_client(url, key)
        result = client.table("products").select("id", count="exact").limit(1).execute()
        count = result.count or 0
        ok(f"Conectado ao Supabase")
        ok(f"{count} produto(s) no banco")
        results["supabase"] = True
except Exception as e:
    fail(f"Supabase: {e}")
    results["supabase"] = False

# ══════════════════════════════════════════════════════════════
# TESTE 5 — Stealth HTTP (curl-cffi)
# ══════════════════════════════════════════════════════════════
header("TESTE 5 — Stealth HTTP com curl-cffi")

try:
    from curl_cffi import requests as cffi_req
    import random

    fingerprints = ["chrome120", "chrome119", "edge120"]
    fp = random.choice(fingerprints)

    info(f"Testando httpbin.org com fingerprint {fp}...")
    r = cffi_req.get("https://httpbin.org/headers", impersonate=fp, timeout=15)
    if r.status_code == 200:
        ua = r.json().get("headers", {}).get("User-Agent", "?")
        ok(f"curl-cffi funcionando — User-Agent: {ua[:60]}...")
        results["cffi"] = True
    else:
        fail(f"Status: {r.status_code}")
        results["cffi"] = False
except Exception as e:
    fail(f"curl-cffi: {e}")
    results["cffi"] = False

# ══════════════════════════════════════════════════════════════
# TESTE 6 — Scrape real (AliExpress via curl-cffi)
# ══════════════════════════════════════════════════════════════
header("TESTE 6 — Scrape real AliExpress")

try:
    from curl_cffi import requests as cffi_req
    from fake_useragent import UserAgent
    import re

    ua_gen = UserAgent()
    headers = {
        "User-Agent": ua_gen.chrome,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
    }

    info("Buscando 'smartwatch' no AliExpress...")
    url = "https://www.aliexpress.com/wholesale?SearchText=smartwatch&sortType=total_tranpro_desc"

    r = cffi_req.get(url, impersonate="chrome120", headers=headers, timeout=20)

    if r.status_code == 200:
        html = r.text
        # Verifica se retornou produtos
        has_products = any(x in html for x in [
            "product-card", "search-item", "item-title", "SearchText"
        ])
        if has_products:
            # Tenta extrair preços
            prices = re.findall(r'US\s*\$\s*[\d,]+\.?\d*', html)
            ok(f"AliExpress respondeu (HTTP {r.status_code})")
            ok(f"Encontrou {len(prices)} preços na página")
            if prices:
                info(f"Exemplos: {', '.join(prices[:5])}")
            results["aliexpress"] = True
        else:
            warn(f"AliExpress respondeu mas sem produtos (possível bloqueio)")
            warn("Tente usar FlareSolverr para este site")
            results["aliexpress"] = "partial"
    elif r.status_code == 403:
        warn(f"AliExpress bloqueou (403) — use FlareSolverr")
        results["aliexpress"] = "blocked"
    else:
        fail(f"Status: {r.status_code}")
        results["aliexpress"] = False
except Exception as e:
    fail(f"AliExpress scrape: {e}")
    results["aliexpress"] = False

# ══════════════════════════════════════════════════════════════
# TESTE 7 — Scrape real (Shopee via curl-cffi)
# ══════════════════════════════════════════════════════════════
header("TESTE 7 — Scrape real Shopee API")

try:
    from curl_cffi import requests as cffi_req

    info("Consultando API da Shopee (flash deals)...")
    url = "https://shopee.com.br/api/v4/flash_sale/get_all_sessions"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://shopee.com.br/flash-sale",
        "x-api-source": "pc",
        "If-None-Match": "",
    }

    r = cffi_req.get(url, impersonate="chrome120", headers=headers, timeout=15)

    if r.status_code == 200:
        data = r.json()
        sessions = data.get("data", {}).get("sessions", [])
        ok(f"Shopee API respondeu (HTTP 200)")
        ok(f"{len(sessions)} sessões de flash sale encontradas")
        if sessions:
            info(f"Próxima flash sale: {sessions[0].get('name', '?')}")
        results["shopee"] = True
    else:
        warn(f"Shopee status: {r.status_code}")
        results["shopee"] = False
except Exception as e:
    fail(f"Shopee: {e}")
    results["shopee"] = False

# ══════════════════════════════════════════════════════════════
# TESTE 8 — Playwright
# ══════════════════════════════════════════════════════════════
header("TESTE 8 — Playwright (Chromium headless)")

try:
    import subprocess
    result = subprocess.run(
        [sys.executable, "-c", "from playwright.sync_api import sync_playwright; p=sync_playwright().start(); b=p.chromium.launch(headless=True); b.close(); p.stop(); print('OK')"],
        capture_output=True, text=True, timeout=30
    )
    if "OK" in result.stdout:
        ok("Playwright + Chromium funcionando")
        results["playwright"] = True
    else:
        fail(f"Playwright: {result.stderr[:200]}")
        warn("Execute: playwright install chromium")
        results["playwright"] = False
except Exception as e:
    fail(f"Playwright: {e}")
    results["playwright"] = False

# ══════════════════════════════════════════════════════════════
# SUMÁRIO FINAL
# ══════════════════════════════════════════════════════════════
header("RESULTADO FINAL")

labels = {
    "python":       "Python 3.11+",
    "deps":         "Dependências pip",
    "redis":        "Redis",
    "flaresolverr": "FlareSolverr",
    "supabase":     "Supabase DB",
    "cffi":         "curl-cffi stealth",
    "aliexpress":   "AliExpress scrape",
    "shopee":       "Shopee API",
    "playwright":   "Playwright",
}

total = len(results)
passed = sum(1 for v in results.values() if v is True)

for key, label in labels.items():
    val = results.get(key)
    if val is True:
        ok(f"{label}")
    elif val == "partial" or val == "blocked":
        warn(f"{label} — parcial (use FlareSolverr)")
    else:
        fail(f"{label}")

print(f"\n  {BOLD}Score: {passed}/{total}{RESET}")

if passed == total:
    print(f"\n  {GREEN}{BOLD}✓ Sistema 100% operacional! Rode os workers:{RESET}")
    print(f"  {CYAN}  celery -A worker worker --loglevel=info -c 2{RESET}")
elif passed >= total * 0.6:
    print(f"\n  {YELLOW}{BOLD}Sistema parcialmente funcional. Corrija os itens com ✗{RESET}")
else:
    print(f"\n  {RED}{BOLD}Sistema não está pronto. Instale os pré-requisitos.{RESET}")

print()
