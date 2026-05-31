"""
Scraper com Playwright — abre Chrome real (headless), executa JS completo.
Bypassa proteções de cookie/JS da Shopee e AliExpress.

Uso:
  python scrape_playwright.py --keyword "smartwatch" --limit 20
  python scrape_playwright.py --keyword "led rgb" --limit 15 --no-save
  python scrape_playwright.py --keyword "fone" --marketplace shopee --no-save
"""
import sys
import os
import json
import re
import argparse
import random
import time
from pathlib import Path
from urllib.parse import quote_plus

import httpx
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")


# ──────────────────────────────────────────────────────────────
# Shopee — abre navegador real, pega cookies, chama API JSON
# ──────────────────────────────────────────────────────────────

def scrape_shopee(keyword: str, limit: int = 20) -> list[dict]:
    """
    Intercepta a requisição de busca que o próprio Shopee faz ao carregar a página.
    Isso usa os cookies e headers exatos que o browser enviaria — sem imitação.
    """
    results = []
    captured: list[dict] = []

    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                ],
            )
            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1366, "height": 768},
                locale="pt-BR",
                timezone_id="America/Sao_Paulo",
            )
            context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
                window.chrome = { runtime: {} };
            """)

            page = context.new_page()

            # Interceptar respostas da API de busca do Shopee
            def on_response(response):
                if "api/v4/search/search_items" in response.url and not captured:
                    try:
                        data = response.json()
                        if data.get("items"):
                            captured.extend(data["items"])
                            sys.stderr.write(f"[shopee] Interceptou {len(data['items'])} itens!\n")
                    except Exception:
                        pass

            page.on("response", on_response)

            sys.stderr.write("[shopee] Abrindo página de busca (modo interceptação)...\n")
            page.goto(
                f"https://shopee.com.br/search?keyword={quote_plus(keyword)}",
                wait_until="domcontentloaded",
                timeout=35000,
            )

            # Aguardar a resposta da API ser capturada
            deadline = time.time() + 20
            while not captured and time.time() < deadline:
                time.sleep(0.5)

            if not captured:
                # Tentar scroll para forçar carregamento
                page.evaluate("window.scrollTo(0, 300)")
                time.sleep(3)

            sys.stderr.write(f"[shopee] Total interceptado: {len(captured)} itens\n")

            for item in captured[:limit]:
                b = item.get("item_basic") or {}
                price = (b.get("price") or 0) / 100_000
                orig_raw = b.get("price_before_discount") or 0
                original_price = orig_raw / 100_000 if orig_raw > 0 else None
                discount = (
                    round(((original_price - price) / original_price) * 100)
                    if original_price and original_price > price else 0
                )
                sales = b.get("sold") or b.get("historical_sold") or 0
                rating_raw = (b.get("item_rating") or {}).get("rating_star") or 0
                score = min(100, round((sales / 100) * 0.4 + discount * 0.3 + rating_raw * 6 + 10))
                image_hash = b.get("image") or ""
                shop_id = b.get("shopid") or ""
                item_id = b.get("itemid") or ""

                results.append({
                    "title": b.get("name") or "Produto Shopee",
                    "price": round(price * 100) / 100,
                    "original_price": round(original_price * 100) / 100 if original_price else None,
                    "discount_pct": discount,
                    "image_url": f"https://cf.shopee.com.br/file/{image_hash}" if image_hash else "",
                    "product_url": f"https://shopee.com.br/product/{shop_id}/{item_id}",
                    "marketplace": "shopee",
                    "marketplace_id": f"shopee_{item_id}",
                    "currency": "BRL",
                    "sales_count": sales,
                    "rating": round(float(rating_raw) * 10) / 10,
                    "opportunity_score": score,
                })

            browser.close()
    except Exception as e:
        sys.stderr.write(f"[shopee] Erro: {e}\n")

    return results


# ──────────────────────────────────────────────────────────────
# AliExpress — abre navegador, resolve desafio x5, extrai JSON
# ──────────────────────────────────────────────────────────────

def scrape_aliexpress(keyword: str, limit: int = 20) -> list[dict]:
    results = []
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                ],
            )
            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1440, "height": 900},
                locale="pt-BR",
                timezone_id="America/Sao_Paulo",
            )
            context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
                window.chrome = { runtime: {} };
            """)

            page = context.new_page()

            url = (
                f"https://www.aliexpress.com/wholesale"
                f"?SearchText={quote_plus(keyword)}&SortType=total_tranpro_desc"
            )

            sys.stderr.write("[aliexpress] Abrindo página de busca...\n")
            page.goto(url, wait_until="domcontentloaded", timeout=40000)

            # Aguardar desafio x5 ser resolvido e página carregar
            sys.stderr.write("[aliexpress] Aguardando JS/desafio carregar...\n")
            try:
                page.wait_for_load_state("networkidle", timeout=20000)
            except PWTimeout:
                pass

            time.sleep(3)

            # Verificar se ainda está no desafio
            current_url = page.url
            page_title = page.title()
            sys.stderr.write(f"[aliexpress] URL: {current_url[:80]}\n")
            sys.stderr.write(f"[aliexpress] Título: {page_title}\n")

            # Tentar extrair window.__runParams__ via JS no browser
            run_params = page.evaluate("""
                () => {
                    try {
                        if (window.__runParams__) return window.__runParams__;
                        if (window.runParams) return window.runParams;
                        return null;
                    } catch(e) { return null; }
                }
            """)

            if run_params:
                sys.stderr.write("[aliexpress] Encontrou __runParams__ no browser!\n")
                try:
                    items = (
                        run_params.get("data", {})
                        .get("root", {})
                        .get("fields", {})
                        .get("mods", {})
                        .get("itemList", {})
                        .get("content", [])
                    )
                    sys.stderr.write(f"[aliexpress] Itens no runParams: {len(items)}\n")
                    results = _parse_ali_items(items[:limit], keyword)
                except Exception as e:
                    sys.stderr.write(f"[aliexpress] Erro ao parsear runParams: {e}\n")

            # Se não achou via runParams, tenta interceptar requests de API
            if not results:
                sys.stderr.write("[aliexpress] Tentando extrair dados via DOM...\n")
                html = page.content()

                # Tentar encontrar JSON embutido no HTML
                for pattern in [
                    r'window\.__runParams__\s*=\s*(\{.*?\});\s*</script>',
                    r'window\.runParams\s*=\s*(\{.*?\});\s*</script>',
                ]:
                    m = re.search(pattern, html, re.DOTALL)
                    if m:
                        try:
                            data = json.loads(m.group(1))
                            items = (
                                data.get("data", {}).get("root", {}).get("fields", {})
                                .get("mods", {}).get("itemList", {}).get("content", [])
                            )
                            if items:
                                sys.stderr.write(f"[aliexpress] Achou {len(items)} itens via regex!\n")
                                results = _parse_ali_items(items[:limit], keyword)
                                break
                        except Exception:
                            continue

            # Última tentativa: extrair cards do DOM via seletores
            if not results:
                sys.stderr.write("[aliexpress] Tentando seletores CSS de produtos...\n")
                cards_data = page.evaluate("""
                    () => {
                        const selectors = [
                            'div[class*="search-card-item"]',
                            'div[class*="product-card"]',
                            'div[class*="SearchResults"] a[href*="/item/"]',
                            'a[href*="aliexpress.com/item/"]',
                        ];
                        for (const sel of selectors) {
                            const els = document.querySelectorAll(sel);
                            if (els.length > 0) {
                                return Array.from(els).slice(0, 30).map(el => ({
                                    title: (el.querySelector('[class*="title"]') || el.querySelector('h3') || {}).innerText || '',
                                    price: (el.querySelector('[class*="price"]') || {}).innerText || '',
                                    img: (el.querySelector('img') || {}).src || '',
                                    href: el.href || (el.querySelector('a') || {}).href || '',
                                }));
                            }
                        }
                        return [];
                    }
                """)

                for i, card in enumerate(cards_data):
                    title = (card.get("title") or "").strip()[:200]
                    price_str = re.sub(r"[^0-9.,]", "", card.get("price") or "")
                    price = float(price_str.replace(",", ".")) if price_str else 0.0
                    img = card.get("img") or ""
                    href = card.get("href") or ""
                    if href.startswith("//"):
                        href = "https:" + href
                    if title and price > 0:
                        results.append({
                            "title": title,
                            "price": round(price, 2),
                            "original_price": None,
                            "discount_pct": 0,
                            "image_url": img,
                            "product_url": href or f"https://www.aliexpress.com/wholesale?SearchText={quote_plus(keyword)}",
                            "marketplace": "aliexpress",
                            "marketplace_id": f"ali_pw_{abs(hash(title))}",
                            "currency": "USD",
                            "sales_count": 0,
                            "rating": 0.0,
                            "opportunity_score": 20,
                        })

                sys.stderr.write(f"[aliexpress] Extraídos via DOM: {len(results)}\n")

            browser.close()
    except Exception as e:
        sys.stderr.write(f"[aliexpress] Erro: {e}\n")

    return results


def _parse_ali_items(items: list, keyword: str) -> list[dict]:
    results = []
    for item in items:
        price = 0.0
        for fn in [
            lambda i: float(i.get("prices", {}).get("salePrice", {}).get("minPrice", 0) or 0),
            lambda i: float(i.get("salePrice", 0) or 0),
            lambda i: float(i.get("price", 0) or 0),
        ]:
            try:
                v = fn(item)
                if v > 0:
                    price = v
                    break
            except Exception:
                continue

        orig_price = None
        for fn in [
            lambda i: float(i.get("prices", {}).get("originalPrice", {}).get("minPrice", 0) or 0),
            lambda i: float(i.get("originalPrice", 0) or 0),
        ]:
            try:
                v = fn(item)
                if v > price:
                    orig_price = v
                    break
            except Exception:
                continue

        discount = round(((orig_price - price) / orig_price) * 100) if orig_price else 0

        img = ""
        for fn in [
            lambda i: i.get("image", {}).get("imgUrl", ""),
            lambda i: i.get("imageUrl", ""),
            lambda i: i.get("img", ""),
        ]:
            try:
                v = fn(item)
                if v:
                    img = v
                    break
            except Exception:
                continue
        if img.startswith("//"):
            img = "https:" + img

        prod_url = ""
        for fn in [
            lambda i: i.get("title", {}).get("detailUrl", ""),
            lambda i: i.get("productDetailUrl", ""),
            lambda i: i.get("itemUrl", ""),
        ]:
            try:
                v = fn(item)
                if v:
                    prod_url = v
                    break
            except Exception:
                continue
        if prod_url.startswith("//"):
            prod_url = "https:" + prod_url

        title = ""
        for fn in [
            lambda i: i.get("title", {}).get("displayTitle", ""),
            lambda i: i.get("title", "") if isinstance(i.get("title"), str) else "",
            lambda i: i.get("name", ""),
        ]:
            try:
                v = fn(item)
                if v:
                    title = str(v)
                    break
            except Exception:
                continue

        sales = 0
        for fn in [
            lambda i: int(str(i.get("trade", {}).get("realTradedCount", "0")).replace("+", "").replace(",", "") or 0),
            lambda i: int(i.get("tradeCount", 0) or 0),
        ]:
            try:
                v = fn(item)
                if v >= 0:
                    sales = v
                    break
            except Exception:
                continue

        rating = 0.0
        for fn in [
            lambda i: float(i.get("evaluation", {}).get("starRating", 0) or 0),
            lambda i: float(i.get("rating", 0) or 0),
        ]:
            try:
                v = fn(item)
                if v > 0:
                    rating = v
                    break
            except Exception:
                continue

        product_id = item.get("productId") or item.get("itemId") or item.get("id") or random.randint(100_000, 999_999)
        score = min(100, round((sales / 1000) * 30 + discount * 0.4 + rating * 8 + 10))

        results.append({
            "title": title or "Produto AliExpress",
            "price": round(price, 2),
            "original_price": round(orig_price, 2) if orig_price else None,
            "discount_pct": discount,
            "image_url": img,
            "product_url": prod_url or f"https://www.aliexpress.com/wholesale?SearchText={quote_plus(keyword)}",
            "marketplace": "aliexpress",
            "marketplace_id": f"ali_{product_id}",
            "currency": "USD",
            "sales_count": sales,
            "rating": round(rating, 1),
            "opportunity_score": score,
        })
    return results


# ──────────────────────────────────────────────────────────────
# Salvar no Supabase via REST API
# ──────────────────────────────────────────────────────────────

def save_to_supabase(products: list[dict]) -> int:
    base_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    service_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    if not base_url or not service_key:
        sys.stderr.write("SUPABASE_URL ou SUPABASE_SERVICE_KEY ausente no .env\n")
        return 0

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation",
    }

    def make_slug(title: str, ext_id: str) -> str:
        slug = re.sub(r"[^a-z0-9\s-]", "", title.lower())
        slug = re.sub(r"\s+", "-", slug).strip("-")[:60]
        return f"{slug}-{ext_id[-6:]}"

    rows = []
    for p in products:
        ext_id = str(p["marketplace_id"])
        rows.append({
            "external_id": ext_id,
            "marketplace": p["marketplace"],
            "title": p["title"][:500],
            "slug": make_slug(p["title"], ext_id),
            "price": p["price"],
            "original_price": p.get("original_price"),
            "discount": p.get("discount_pct"),
            "currency": p["currency"],
            "sales": p["sales_count"],
            "rating": min(5.0, float(p["rating"])),
            "thumbnail": p["image_url"],
            "images": [p["image_url"]] if p.get("image_url") else [],
            "url": p["product_url"],
            "category": "geral",
            "tags": [],
            "score": p["opportunity_score"],
            "trend_score": min(100, p["opportunity_score"] * 0.9),
            "metadata": {},
        })

    try:
        with httpx.Client(timeout=30) as client:
            r = client.post(
                f"{base_url}/rest/v1/products",
                headers=headers,
                json=rows,
                params={"on_conflict": "marketplace,external_id"},
            )
            if r.status_code in (200, 201):
                saved = r.json()
                return len(saved) if isinstance(saved, list) else len(rows)
            else:
                sys.stderr.write(f"Supabase erro {r.status_code}: {r.text[:300]}\n")
                return 0
    except Exception as e:
        sys.stderr.write(f"Supabase HTTP erro: {e}\n")
        return 0


# ──────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scraper Playwright para Shopee e AliExpress")
    parser.add_argument("--keyword", default="smartwatch")
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--no-save", action="store_true")
    parser.add_argument("--marketplace", choices=["shopee", "aliexpress", "both"], default="both")
    args = parser.parse_args()

    sys.stderr.write(f"[playwright] keyword={args.keyword!r} limit={args.limit} marketplace={args.marketplace}\n")

    shopee_products: list[dict] = []
    ali_products: list[dict] = []

    if args.marketplace in ("shopee", "both"):
        sys.stderr.write("[playwright] Iniciando Shopee...\n")
        shopee_products = scrape_shopee(args.keyword, args.limit)
        sys.stderr.write(f"[playwright] Shopee: {len(shopee_products)} produtos\n")

    if args.marketplace in ("aliexpress", "both"):
        sys.stderr.write("[playwright] Iniciando AliExpress...\n")
        ali_products = scrape_aliexpress(args.keyword, args.limit)
        sys.stderr.write(f"[playwright] AliExpress: {len(ali_products)} produtos\n")

    all_products = shopee_products + ali_products

    saved = 0
    if not args.no_save and all_products:
        sys.stderr.write(f"[playwright] Salvando {len(all_products)} produtos...\n")
        saved = save_to_supabase(all_products)
        sys.stderr.write(f"[playwright] Salvos: {saved}\n")

    output = {
        "success": True,
        "fetched": len(all_products),
        "saved": saved,
        "breakdown": {"shopee": len(shopee_products), "aliexpress": len(ali_products)},
        "products": all_products,
    }
    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    main()
