"""
Scraper curl_cffi + BeautifulSoup4 — impersona TLS do Chrome real.
Usa a API REST do Supabase diretamente via httpx (sem supabase-py).

Uso:
  python scrape_bs4.py --keyword "smartwatch" --limit 20
  python scrape_bs4.py --keyword "led rgb" --limit 15 --no-save
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
from curl_cffi import requests as cffi_req
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Cache-Control": "no-cache",
}

JSON_HEADERS = {
    **BROWSER_HEADERS,
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
}

# curl_cffi Session: impersona TLS do Chrome 124 (bypassa detecção de bot)
def make_session(timeout: int = 20) -> cffi_req.Session:
    s = cffi_req.Session(impersonate="chrome124")
    s.timeout = timeout
    return s


# ──────────────────────────────────────────────────────────────
# Shopee — API JSON pública
# ──────────────────────────────────────────────────────────────

def scrape_shopee(keyword: str, limit: int = 20) -> list[dict]:
    """
    Usa a API interna do Shopee com curl_cffi (impersona Chrome TLS).
    Retorna imagens reais no formato cf.shopee.com.br/file/{hash}
    e URLs reais /product/{shopid}/{itemid}.
    """
    url = (
        "https://shopee.com.br/api/v4/search/search_items"
        f"?by=sales&keyword={quote_plus(keyword)}&limit={limit}"
        "&newest=0&order=desc&page_type=search"
        "&scenario=PAGE_GLOBAL_SEARCH&version=2"
    )
    try:
        with make_session(timeout=20) as s:
            # Load search page first to get session cookies (csrftoken etc.)
            s.get(
                f"https://shopee.com.br/search?keyword={quote_plus(keyword)}",
                headers=BROWSER_HEADERS,
            )
            time.sleep(0.8)

            csrf = s.cookies.get("csrftoken") or "none"
            shopee_headers = {
                **JSON_HEADERS,
                "Referer": f"https://shopee.com.br/search?keyword={quote_plus(keyword)}",
                "x-api-source": "pc",
                "x-shopee-language": "pt-BR",
                "x-csrftoken": csrf,
                "if-none-match-": "",
            }

            r = s.get(url, headers=shopee_headers)
            if r.status_code != 200:
                sys.stderr.write(f"Shopee API status: {r.status_code}\n")
                return []

            data = r.json()
            items = data.get("items") or []
            results = []

            for item in items:
                b = item.get("item_basic") or {}
                price = (b.get("price") or 0) / 100_000
                orig_raw = b.get("price_before_discount") or 0
                original_price = orig_raw / 100_000 if orig_raw > 0 else None
                discount = (
                    round(((original_price - price) / original_price) * 100)
                    if original_price and original_price > price
                    else 0
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

            return results

    except Exception as e:
        sys.stderr.write(f"Shopee error: {e}\n")
        return []


# ──────────────────────────────────────────────────────────────
# AliExpress — glosearch JSON API (menos protegida que /wholesale)
# ──────────────────────────────────────────────────────────────

def scrape_aliexpress(keyword: str, limit: int = 20) -> list[dict]:
    """
    Tenta 3 estratégias em ordem:
    1. API glosearch (JSON, mobile-friendly, sem Cloudflare)
    2. API interna /glosearch/api/product
    3. Parse BS4 do HTML (fallback final)
    """
    results = _ali_glosearch_api(keyword, limit)
    if results:
        return results

    results = _ali_internal_api(keyword, limit)
    if results:
        return results

    return _ali_html_parse(keyword, limit)


def _ali_glosearch_api(keyword: str, limit: int) -> list[dict]:
    """AliExpress glosearch — usa curl_cffi para impersonar Chrome."""
    url = (
        "https://glosearch.aliexpress.com/api/v2/search"
        f"?keywords={quote_plus(keyword)}&page=1&pageSize={limit}"
        "&sort=orignalSales_desc&searchScene=all&lang=pt_BR&currency=BRL"
    )
    headers = {
        **JSON_HEADERS,
        "Referer": "https://www.aliexpress.com/",
        "Origin": "https://www.aliexpress.com",
    }
    try:
        with make_session() as s:
            r = s.get(url, headers=headers)
            if r.status_code != 200:
                sys.stderr.write(f"glosearch status: {r.status_code}\n")
                return []
            try:
                data = r.json()
            except Exception:
                sys.stderr.write(f"glosearch non-JSON: {r.text[:100]}\n")
                return []
            items = (
                data.get("data", {}).get("products")
                or data.get("result", {}).get("mods", {}).get("itemList", {}).get("content")
                or []
            )
            return _parse_ali_items(items, keyword)
    except Exception as e:
        sys.stderr.write(f"glosearch error: {e}\n")
        return []


def _ali_internal_api(keyword: str, limit: int) -> list[dict]:
    """AliExpress /glosearch/api/product — usa curl_cffi."""
    url = (
        f"https://www.aliexpress.com/glosearch/api/product"
        f"?keywords={quote_plus(keyword)}&page=1&limit={limit}"
        "&categoryId=0&sortType=5&shipToCountry=BR&currency=BRL&lang=pt_BR"
    )
    headers = {
        **JSON_HEADERS,
        "Referer": f"https://www.aliexpress.com/wholesale?SearchText={quote_plus(keyword)}",
    }
    try:
        with make_session() as s:
            r = s.get(url, headers=headers)
            if r.status_code != 200:
                sys.stderr.write(f"ali internal status: {r.status_code}\n")
                return []
            try:
                data = r.json()
            except Exception:
                sys.stderr.write(f"ali internal non-JSON: {r.text[:100]}\n")
                return []
            items = data.get("products") or data.get("data", {}).get("products") or []
            return _parse_ali_items(items, keyword)
    except Exception as e:
        sys.stderr.write(f"ali internal api error: {e}\n")
        return []


def _parse_ali_items(items: list, keyword: str) -> list[dict]:
    """Normaliza itens de qualquer endpoint JSON do AliExpress."""
    results = []
    for item in items:
        # Price — vários formatos possíveis
        price = 0.0
        for path in [
            lambda i: float(i.get("prices", {}).get("salePrice", {}).get("minPrice", 0) or 0),
            lambda i: float(i.get("price", {}).get("sale", {}).get("value", 0) or 0),
            lambda i: float(i.get("salePrice", 0) or 0),
            lambda i: float(i.get("price", 0) or 0),
        ]:
            try:
                v = path(item)
                if v > 0:
                    price = v
                    break
            except Exception:
                continue

        orig_price = None
        for path in [
            lambda i: float(i.get("prices", {}).get("originalPrice", {}).get("minPrice", 0) or 0),
            lambda i: float(i.get("price", {}).get("original", {}).get("value", 0) or 0),
            lambda i: float(i.get("originalPrice", 0) or 0),
        ]:
            try:
                v = path(item)
                if v > price:
                    orig_price = v
                    break
            except Exception:
                continue

        discount = round(((orig_price - price) / orig_price) * 100) if orig_price else 0

        # Image URL
        img = ""
        for path in [
            lambda i: i.get("image", {}).get("imgUrl", ""),
            lambda i: i.get("imageUrl", ""),
            lambda i: i.get("img", ""),
            lambda i: i.get("thumbnail", ""),
        ]:
            try:
                v = path(item)
                if v:
                    img = v
                    break
            except Exception:
                continue
        if img.startswith("//"):
            img = "https:" + img

        # Product URL
        prod_url = ""
        for path in [
            lambda i: i.get("title", {}).get("detailUrl", ""),
            lambda i: i.get("productDetailUrl", ""),
            lambda i: i.get("itemUrl", ""),
        ]:
            try:
                v = path(item)
                if v:
                    prod_url = v
                    break
            except Exception:
                continue
        if prod_url.startswith("//"):
            prod_url = "https:" + prod_url
        if not prod_url:
            prod_url = f"https://www.aliexpress.com/wholesale?SearchText={quote_plus(keyword)}"

        # Title
        title = ""
        for path in [
            lambda i: i.get("title", {}).get("displayTitle", ""),
            lambda i: i.get("title", "") if isinstance(i.get("title"), str) else "",
            lambda i: i.get("name", ""),
        ]:
            try:
                v = path(item)
                if v:
                    title = str(v)
                    break
            except Exception:
                continue
        if not title:
            title = "Produto AliExpress"

        # Sales + rating
        sales = 0
        for path in [
            lambda i: int(str(i.get("trade", {}).get("realTradedCount", "0")).replace("+", "").replace(",", "") or 0),
            lambda i: int(i.get("tradeCount", 0) or 0),
            lambda i: int(i.get("orders", 0) or 0),
        ]:
            try:
                v = path(item)
                if v >= 0:
                    sales = v
                    break
            except Exception:
                continue

        rating = 0.0
        for path in [
            lambda i: float(i.get("evaluation", {}).get("starRating", 0) or 0),
            lambda i: float(i.get("rating", 0) or 0),
            lambda i: float(i.get("averageStar", 0) or 0),
        ]:
            try:
                v = path(item)
                if v > 0:
                    rating = v
                    break
            except Exception:
                continue

        product_id = item.get("productId") or item.get("itemId") or item.get("id") or random.randint(100_000, 999_999)
        score = min(100, round((sales / 1000) * 30 + discount * 0.4 + rating * 8 + 10))

        results.append({
            "title": title,
            "price": round(price, 2),
            "original_price": round(orig_price, 2) if orig_price else None,
            "discount_pct": discount,
            "image_url": img,
            "product_url": prod_url,
            "marketplace": "aliexpress",
            "marketplace_id": f"ali_{product_id}",
            "currency": "USD",
            "sales_count": sales,
            "rating": round(rating, 1),
            "opportunity_score": score,
        })

    return results


def _ali_html_parse(keyword: str, limit: int) -> list[dict]:
    """
    Fallback: busca o HTML da página /wholesale via curl_cffi e extrai via BS4.
    AliExpress embeds os dados em window.__runParams__ ou window.runParams.
    """
    url = f"https://www.aliexpress.com/wholesale?SearchText={quote_plus(keyword)}&SortType=total_tranpro_desc"
    try:
        with make_session(timeout=25) as s:
            r = s.get(url, headers=BROWSER_HEADERS)
            if r.status_code != 200:
                sys.stderr.write(f"AliExpress HTML status: {r.status_code}\n")
                return []

            html = r.text

            # Strategy A: JSON embedded in <script>
            for pattern in [
                r'window\.__runParams__\s*=\s*(\{.*?\});\s*</script>',
                r'window\.runParams\s*=\s*(\{.*?\});\s*</script>',
                r'"mods"\s*:\s*\{.*?"itemList"\s*:\s*\{.*?"content"\s*:\s*(\[.*?\])',
            ]:
                m = re.search(pattern, html, re.DOTALL)
                if m:
                    try:
                        raw = m.group(1)
                        data = json.loads(raw)
                        items = (
                            data.get("data", {}).get("root", {}).get("fields", {})
                            .get("mods", {}).get("itemList", {}).get("content", [])
                        )
                        if items:
                            return _parse_ali_items(items[:limit], keyword)
                    except Exception:
                        continue

            # Strategy B: BS4 parse of product cards
            soup = BeautifulSoup(html, "lxml")
            results = []

            # AliExpress renders several different card formats — try all known selectors
            selectors = [
                "div.search-card-item",
                "div[class*='product-card']",
                "div[class*='SearchResultsModule']",
                "a[class*='manhattan--container']",
                "div[class*='list--gallery']",
            ]

            cards = []
            for sel in selectors:
                cards = soup.select(sel)
                if cards:
                    break

            if not cards:
                # Generic: find divs with both an image and a price
                for div in soup.find_all("div"):
                    if div.find("img") and (div.find(class_=re.compile("price", re.I)) or div.find(string=re.compile(r"US\s*\$"))):
                        cards.append(div)
                        if len(cards) >= limit:
                            break

            for card in cards[:limit]:
                # Title
                title_el = (
                    card.find(class_=re.compile(r"title|name", re.I))
                    or card.find("h3")
                    or card.find("span", string=re.compile(r"\w{5,}"))
                )
                title = title_el.get_text(strip=True)[:150] if title_el else "Produto AliExpress"

                # Price
                price_el = card.find(string=re.compile(r"US\s*\$\s*[\d,\.]+"))
                price_str = str(price_el).strip() if price_el else ""
                price_match = re.search(r"[\d,\.]+", price_str.replace(",", ""))
                price = float(price_match.group()) if price_match else 0.0

                # Image
                img_el = card.find("img")
                img_url = ""
                if img_el:
                    for attr in ["src", "data-src", "data-lazy-src"]:
                        v = img_el.get(attr, "")
                        if v and "http" in v:
                            img_url = v
                            break
                    if img_url.startswith("//"):
                        img_url = "https:" + img_url

                # Product URL
                link_el = card.find("a", href=True)
                prod_url = ""
                if link_el:
                    href = link_el["href"]
                    if href.startswith("//"):
                        prod_url = "https:" + href
                    elif href.startswith("http"):
                        prod_url = href
                    else:
                        prod_url = "https://www.aliexpress.com" + href

                if not title or price <= 0:
                    continue

                results.append({
                    "title": title,
                    "price": round(price, 2),
                    "original_price": None,
                    "discount_pct": 0,
                    "image_url": img_url,
                    "product_url": prod_url or f"https://www.aliexpress.com/wholesale?SearchText={quote_plus(keyword)}",
                    "marketplace": "aliexpress",
                    "marketplace_id": f"ali_bs4_{abs(hash(title + str(price)))}",
                    "currency": "USD",
                    "sales_count": 0,
                    "rating": 0.0,
                    "opportunity_score": 15,
                })

            sys.stderr.write(f"BS4 parsed {len(results)} products\n")
            return results

    except Exception as e:
        sys.stderr.write(f"AliExpress HTML parse error: {e}\n")
        return []


# ──────────────────────────────────────────────────────────────
# Salvar no Supabase via REST API (sem supabase-py)
# ──────────────────────────────────────────────────────────────

def save_to_supabase(products: list[dict]) -> int:
    base_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    service_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    if not base_url or not service_key:
        sys.stderr.write("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env\n")
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
                sys.stderr.write(f"Supabase upsert error {r.status_code}: {r.text[:300]}\n")
                return 0
    except Exception as e:
        sys.stderr.write(f"Supabase HTTP error: {e}\n")
        return 0


# ──────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scraper httpx+BS4 para AliExpress e Shopee")
    parser.add_argument("--keyword", default="smartwatch", help="Keyword de busca")
    parser.add_argument("--limit", type=int, default=20, help="Máximo de produtos por marketplace")
    parser.add_argument("--no-save", action="store_true", help="Não salvar no Supabase")
    parser.add_argument("--marketplace", choices=["shopee", "aliexpress", "both"], default="both")
    args = parser.parse_args()

    sys.stderr.write(f"[scrape_bs4] keyword={args.keyword!r} limit={args.limit}\n")

    shopee_products: list[dict] = []
    ali_products: list[dict] = []

    if args.marketplace in ("shopee", "both"):
        sys.stderr.write("[scrape_bs4] Buscando Shopee...\n")
        shopee_products = scrape_shopee(args.keyword, args.limit)
        sys.stderr.write(f"[scrape_bs4] Shopee: {len(shopee_products)} produtos\n")

    if args.marketplace in ("aliexpress", "both"):
        sys.stderr.write("[scrape_bs4] Buscando AliExpress...\n")
        ali_products = scrape_aliexpress(args.keyword, args.limit)
        sys.stderr.write(f"[scrape_bs4] AliExpress: {len(ali_products)} produtos\n")

    all_products = shopee_products + ali_products

    saved = 0
    if not args.no_save and all_products:
        sys.stderr.write(f"[scrape_bs4] Salvando {len(all_products)} produtos no Supabase...\n")
        saved = save_to_supabase(all_products)
        sys.stderr.write(f"[scrape_bs4] Salvos: {saved}\n")

    output = {
        "success": True,
        "fetched": len(all_products),
        "saved": saved,
        "breakdown": {"shopee": len(shopee_products), "aliexpress": len(ali_products)},
        "products": all_products,
    }
    print(json.dumps(output, ensure_ascii=False, indent=None))


if __name__ == "__main__":
    main()
