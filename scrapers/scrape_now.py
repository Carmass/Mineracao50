"""
Standalone scraper — runs without Redis/Celery.
Usage: python scrape_now.py --keyword "smartwatch" --limit 20
Returns JSON to stdout.
"""
import sys
import os
import json
import random
import argparse
import re
from pathlib import Path

# Load .env
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass

def scrape_shopee(keyword: str, limit: int = 20) -> list[dict]:
    try:
        from curl_cffi import requests as cffi_req
        url = (
            f"https://shopee.com.br/api/v4/search/search_items"
            f"?by=sales&keyword={keyword}&limit={limit}&newest=0&order=desc"
            f"&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2"
        )
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": f"https://shopee.com.br/search?keyword={keyword}",
            "x-api-source": "pc",
            "x-shopee-language": "pt-BR",
            "x-csrftoken": "none",
        }
        r = cffi_req.get(url, impersonate="chrome120", headers=headers, timeout=15)
        if r.status_code != 200:
            return []
        data = r.json()
        items = data.get("items") or []
        results = []
        for item in items:
            b = item.get("item_basic") or {}
            price = (b.get("price") or 0) / 100000
            orig = b.get("price_before_discount") or 0
            original_price = orig / 100000 if orig else None
            discount = round(((original_price - price) / original_price) * 100) if original_price and original_price > price else 0
            sales = b.get("sold") or b.get("historical_sold") or 0
            rating = (b.get("item_rating") or {}).get("rating_star") or 0
            score = min(100, round((sales / 100) * 0.4 + discount * 0.3 + rating * 6 + 10))
            image = b.get("image") or ""
            results.append({
                "title": b.get("name") or "Produto Shopee",
                "price": round(price * 100) / 100,
                "original_price": round(original_price * 100) / 100 if original_price else None,
                "discount_pct": discount,
                "image_url": f"https://cf.shopee.com.br/file/{image}" if image else "",
                "product_url": f"https://shopee.com.br/product/{b.get('shopid')}/{b.get('itemid')}",
                "marketplace": "shopee",
                "marketplace_id": f"shopee_{b.get('itemid')}",
                "currency": "BRL",
                "sales_count": sales,
                "rating": round(rating * 10) / 10,
                "opportunity_score": score,
            })
        return results
    except Exception as e:
        sys.stderr.write(f"Shopee error: {e}\n")
        return []


def scrape_aliexpress(keyword: str, limit: int = 20) -> list[dict]:
    try:
        from curl_cffi import requests as cffi_req
        from bs4 import BeautifulSoup
        url = f"https://www.aliexpress.com/wholesale?SearchText={keyword}&SortType=total_tranpro_desc"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
        }
        r = cffi_req.get(url, impersonate="chrome120", headers=headers, timeout=20)
        if r.status_code != 200:
            return []
        html = r.text
        # Try JSON embedded data
        m = re.search(r'window\.__runParams__\s*=\s*(\{[\s\S]*?\});\s*</script>', html)
        if m:
            try:
                data = json.loads(m.group(1))
                items = data.get("data", {}).get("root", {}).get("fields", {}).get("mods", {}).get("itemList", {}).get("content", [])
                results = []
                for item in items[:limit]:
                    price = float((item.get("prices") or {}).get("salePrice", {}).get("minPrice") or "0")
                    orig = float((item.get("prices") or {}).get("originalPrice", {}).get("minPrice") or "0")
                    orig_price = orig if orig > price else None
                    discount = round(((orig_price - price) / orig_price) * 100) if orig_price else 0
                    sales = int((item.get("trade") or {}).get("realTradedCount") or "0")
                    score = min(100, round((sales / 1000) * 30 + discount * 0.4 + 15))
                    img = (item.get("image") or {}).get("imgUrl") or ""
                    results.append({
                        "title": (item.get("title") or {}).get("displayTitle") or "Produto AliExpress",
                        "price": price,
                        "original_price": orig_price,
                        "discount_pct": discount,
                        "image_url": f"https:{img}" if img.startswith("//") else img,
                        "product_url": f"https:{(item.get('title') or {}).get('detailUrl') or f'/wholesale?SearchText={keyword}'}",
                        "marketplace": "aliexpress",
                        "marketplace_id": f"ali_{item.get('productId') or random.randint(100000,999999)}",
                        "currency": "USD",
                        "sales_count": sales,
                        "rating": float((item.get("evaluation") or {}).get("starRating") or "0"),
                        "opportunity_score": score,
                    })
                return results
            except Exception:
                pass
        return []
    except Exception as e:
        sys.stderr.write(f"AliExpress error: {e}\n")
        return []


def save_to_supabase(products: list[dict]) -> int:
    try:
        from supabase import create_client
        url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            sys.stderr.write("Missing Supabase credentials\n")
            return 0
        client = create_client(url, key)

        def make_slug(title: str, ext_id: str) -> str:
            slug = re.sub(r"[^a-z0-9\s-]", "", title.lower())
            slug = re.sub(r"\s+", "-", slug)[:60]
            return f"{slug}-{ext_id[-6:]}"

        rows = []
        for p in products:
            ext_id = p["marketplace_id"]
            rows.append({
                "external_id": ext_id,
                "marketplace": p["marketplace"],
                "title": p["title"],
                "slug": make_slug(p["title"], ext_id),
                "price": p["price"],
                "original_price": p.get("original_price"),
                "discount": p.get("discount_pct"),
                "currency": p["currency"],
                "sales": p["sales_count"],
                "rating": min(5.0, p["rating"]),
                "thumbnail": p["image_url"],
                "images": [p["image_url"]] if p["image_url"] else [],
                "url": p["product_url"],
                "category": "geral",
                "tags": [],
                "score": p["opportunity_score"],
                "trend_score": min(100, p["opportunity_score"] * 0.9),
                "metadata": {},
            })

        result = client.table("products").upsert(rows, on_conflict="marketplace,external_id").execute()
        return len(result.data) if result.data else 0
    except Exception as e:
        sys.stderr.write(f"Supabase save error: {e}\n")
        return 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--keyword", default="smartwatch")
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--no-save", action="store_true")
    args = parser.parse_args()

    shopee = scrape_shopee(args.keyword, args.limit)
    ali = scrape_aliexpress(args.keyword, args.limit)
    all_products = shopee + ali

    saved = 0
    if not args.no_save and all_products:
        saved = save_to_supabase(all_products)

    output = {
        "success": True,
        "fetched": len(all_products),
        "saved": saved,
        "breakdown": {"shopee": len(shopee), "aliexpress": len(ali)},
        "products": all_products,
    }
    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    main()
