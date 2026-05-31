"""
AliExpress Affiliate API via IOP (International Open Platform).

Configuração (uma vez):
  1. Credenciais já estão no .env (ALI_APPKEY, ALI_APPSECRET)
  2. Gere o token OAuth:
       python scrape_aliexpress_affiliate.py --auth
       (Abra a URL no navegador, autorize e copie o code da barra de endereço)
       python scrape_aliexpress_affiliate.py --token SEU_CODE
  3. Usar normalmente:
       python scrape_aliexpress_affiliate.py --keyword "smartwatch" --limit 20
"""
import sys
import os
import json
import hmac
import hashlib
import time
import argparse
import re
from pathlib import Path
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

APPKEY    = os.getenv("ALI_APPKEY", "").strip()
APPSECRET = os.getenv("ALI_APPSECRET", "").strip()
API_URL   = os.getenv("ALI_API_URL", "https://api-sg.aliexpress.com/sync")
TOKEN_FILE = Path(__file__).parent / ".ali_token.json"


# ──────────────────────────────────────────────────────────────
# Assinatura IOP (HMAC-SHA256)
# ──────────────────────────────────────────────────────────────

def _sign(params: dict) -> str:
    sign_str = "".join(f"{k}{v}" for k, v in sorted(params.items()))
    return hmac.new(
        APPSECRET.encode("utf-8"),
        sign_str.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest().upper()


def _build_params(method: str, extra: dict, token: str | None = None) -> dict:
    params = {
        "method":      method,
        "app_key":     APPKEY,
        "sign_method": "sha256",
        "timestamp":   str(int(time.time() * 1000)),
        **extra,
    }
    if token:
        params["session"] = token
    params["sign"] = _sign(params)
    return params


# ──────────────────────────────────────────────────────────────
# OAuth — gerar token e renovar
# ──────────────────────────────────────────────────────────────

def get_auth_url() -> str:
    qs = urlencode({
        "response_type": "code",
        "force_auth":    "true",
        "redirect_uri":  "https://example.com",
        "client_id":     APPKEY,
    })
    return f"https://api-sg.aliexpress.com/oauth/authorize?{qs}"


def create_token(code: str) -> dict | None:
    params = _build_params("/auth/token/create", {"code": code})
    with httpx.Client(timeout=20) as c:
        r = c.post(API_URL, data=params)
    data = r.json()
    sys.stderr.write(f"[ALI] Resposta token: {json.dumps(data)[:400]}\n")

    # Resposta aninhada em "/auth/token/create_response"
    token_data = data.get("/auth/token/create_response", data)
    token = token_data.get("access_token")
    if not token:
        return None

    # expire_time é timestamp absoluto em milissegundos
    expire_ms = token_data.get("expire_time", 0)
    expires_at = expire_ms / 1000 if expire_ms > 1e12 else time.time() + 2592000

    info = {
        "access_token":  token,
        "refresh_token": token_data.get("refresh_token"),
        "expires_at":    expires_at,
    }
    TOKEN_FILE.write_text(json.dumps(info, indent=2))
    sys.stderr.write("[ALI] Token salvo em .ali_token.json\n")
    return info


def _load_token() -> str | None:
    if not TOKEN_FILE.exists():
        return None
    info = json.loads(TOKEN_FILE.read_text())
    token = info.get("access_token")
    expires_at = info.get("expires_at", 0)

    # Renova automaticamente se falta menos de 1 dia
    if time.time() > expires_at - 86400:
        rt = info.get("refresh_token")
        if rt:
            sys.stderr.write("[ALI] Renovando token...\n")
            params = _build_params("/auth/token/refresh", {"refresh_token": rt})
            try:
                with httpx.Client(timeout=20) as c:
                    r = c.post(API_URL, data=params)
                data = r.json()
                new_token = data.get("access_token")
                if new_token:
                    info["access_token"]  = new_token
                    info["refresh_token"] = data.get("refresh_token", rt)
                    info["expires_at"]    = time.time() + int(data.get("expire_time", 2592000))
                    TOKEN_FILE.write_text(json.dumps(info, indent=2))
                    token = new_token
                    sys.stderr.write("[ALI] Token renovado.\n")
            except Exception as e:
                sys.stderr.write(f"[ALI] Erro ao renovar token: {e}\n")

    return token


# ──────────────────────────────────────────────────────────────
# Busca de produtos
# ──────────────────────────────────────────────────────────────

def scrape_aliexpress_affiliate(keyword: str, limit: int = 20) -> list[dict]:
    if not APPKEY or not APPSECRET:
        sys.stderr.write("[ALI] ALI_APPKEY e ALI_APPSECRET não configurados no .env\n")
        return []

    token = _load_token()
    if not token:
        sys.stderr.write(
            "[ALI] Token não encontrado. Execute:\n"
            "  python scrape_aliexpress_affiliate.py --auth\n"
            "  python scrape_aliexpress_affiliate.py --token SEU_CODE\n"
        )
        return []

    params = _build_params(
        "aliexpress.affiliate.product.query",
        {
            "keywords":        keyword,
            "page_no":         "1",
            "page_size":       str(min(limit, 50)),
            "sort":            "LAST_VOLUME_DESC",
            "tracking_id":     "default",
            "target_currency": "BRL",
            "target_language": "PT",
            "country":         "BR",
        },
        token=token,
    )

    sys.stderr.write(f"[ALI] Buscando '{keyword}' (limit={limit})...\n")
    try:
        with httpx.Client(timeout=25) as c:
            r = c.post(API_URL, data=params)
        data = r.json()
    except Exception as e:
        sys.stderr.write(f"[ALI] Erro HTTP: {e}\n")
        return []

    resp   = data.get("aliexpress_affiliate_product_query_response", {})
    result = resp.get("resp_result", {})

    if result.get("resp_code") != 200:
        sys.stderr.write(f"[ALI] Erro da API: {result}\n")
        return []

    raw = result.get("result", {}).get("products", {}).get("product", [])
    sys.stderr.write(f"[ALI] {len(raw)} produtos recebidos.\n")

    products = []
    for p in raw:
        try:
            price    = float(str(p.get("sale_price", "0")).replace(",", ".") or 0)
            original = float(str(p.get("original_price", "0")).replace(",", ".") or 0)
            discount = 0
            if original and original > price:
                discount = round(((original - price) / original) * 100)

            sales     = int(p.get("lastest_volume", 0) or 0)
            rate_raw  = str(p.get("evaluate_rate", "0")).replace("%", "")
            rating    = round(float(rate_raw or 0) / 20, 1)  # 0–100% → 0–5

            score = min(100, round(
                (sales / 1000) * 30 +
                discount * 0.4 +
                rating * 5 +
                15
            ))

            main_img = p.get("product_main_image_url", "")
            # Extract small images and convert to full-size by removing thumbnail suffix
            raw_small = p.get("product_small_image_urls", {})
            small_list = raw_small.get("string", []) if isinstance(raw_small, dict) else []
            if isinstance(small_list, str):
                small_list = [small_list]
            # Remove duplicate of main image, clean up size suffixes
            extra_imgs = []
            for url in small_list:
                if url and url != main_img:
                    extra_imgs.append(url)
            all_imgs = ([main_img] if main_img else []) + extra_imgs[:5]

            products.append({
                "title":          p.get("product_title", "Produto AliExpress")[:500],
                "price":          round(price, 2),
                "original_price": round(original, 2) if original else None,
                "discount_pct":   discount,
                "image_url":      main_img,
                "extra_images":   extra_imgs[:5],
                "all_images":     all_imgs,
                "product_url":    p.get("promotion_link") or p.get("product_detail_url", ""),
                "marketplace":    "aliexpress",
                "marketplace_id": f"ali_{p.get('product_id', '')}",
                "currency":       p.get("sale_price_currency", "USD"),
                "sales_count":    sales,
                "rating":         rating,
                "opportunity_score": score,
                "free_shipping":  False,
                "category_id":    str(p.get("first_level_category_id", "")),
            })
        except Exception as e:
            sys.stderr.write(f"[ALI] Erro ao parsear produto: {e}\n")

    return products


# ──────────────────────────────────────────────────────────────
# Salvar no Supabase
# ──────────────────────────────────────────────────────────────

def save_to_supabase(products: list[dict]) -> int:
    base_url    = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    service_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    if not base_url or not service_key:
        sys.stderr.write("[ALI] SUPABASE_URL ou SUPABASE_SERVICE_KEY ausentes.\n")
        return 0

    def make_slug(title: str, ext_id: str) -> str:
        slug = re.sub(r"[^a-z0-9\s-]", "", title.lower())
        slug = re.sub(r"\s+", "-", slug).strip("-")[:60]
        return f"{slug}-{ext_id[-6:]}"

    headers = {
        "apikey":        service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates,return=representation",
    }

    rows = [{
        "external_id":    str(p["marketplace_id"]),
        "marketplace":    "aliexpress",
        "title":          p["title"],
        "slug":           make_slug(p["title"], str(p["marketplace_id"])),
        "price":          p["price"],
        "original_price": p.get("original_price"),
        "discount":       p.get("discount_pct"),
        "currency":       p.get("currency", "USD"),
        "sales":          p["sales_count"],
        "rating":         p["rating"],
        "thumbnail":      p["image_url"],
        "images":         p.get("all_images") or ([p["image_url"]] if p.get("image_url") else []),
        "url":            p["product_url"],
        "free_shipping":  p.get("free_shipping", False),
        "category":       "geral",
        "tags":           [],
        "score":          p["opportunity_score"],
        "trend_score":    min(100, p["opportunity_score"] * 0.9),
        "metadata":       {"ali_id": p["marketplace_id"], "category_id": p.get("category_id", "")},
    } for p in products]

    try:
        with httpx.Client(timeout=30) as c:
            r = c.post(
                f"{base_url}/rest/v1/products",
                headers=headers,
                json=rows,
                params={"on_conflict": "marketplace,external_id"},
            )
        if r.status_code in (200, 201):
            saved = r.json()
            return len(saved) if isinstance(saved, list) else len(rows)
        sys.stderr.write(f"[ALI] Supabase erro {r.status_code}: {r.text[:300]}\n")
    except Exception as e:
        sys.stderr.write(f"[ALI] Supabase HTTP erro: {e}\n")
    return 0


# ──────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="AliExpress Affiliate API scraper")
    parser.add_argument("--auth",    action="store_true", help="Gera URL de autorização OAuth")
    parser.add_argument("--token",   type=str, metavar="CODE", help="Troca code OAuth por access_token")
    parser.add_argument("--keyword", default="smartwatch", help="Palavra-chave de busca")
    parser.add_argument("--limit",   type=int, default=20, help="Máximo de produtos (max 50)")
    parser.add_argument("--no-save", action="store_true", help="Não salvar no Supabase")
    args = parser.parse_args()

    if args.auth:
        url = get_auth_url()
        sys.stderr.write(f"[ALI] Abra esta URL no navegador:\n\n{url}\n\n")
        sys.stderr.write("[ALI] Após autorizar, copie o 'code' da barra de endereço.\n")
        sys.stderr.write("[ALI] Execute: python scrape_aliexpress_affiliate.py --token SEU_CODE\n")
        print(json.dumps({"success": True, "auth_url": url}))
        return

    if args.token:
        info = create_token(args.token)
        if info:
            print(json.dumps({"success": True, "token_created": True}))
        else:
            sys.stderr.write("[ALI] Falha ao criar token. O code pode ter expirado — gere um novo com --auth.\n")
            print(json.dumps({"success": False, "error": "token_failed"}))
        return

    sys.stderr.write(f"[ALI] Iniciando: keyword={args.keyword!r} limit={args.limit}\n")
    products = scrape_aliexpress_affiliate(args.keyword, args.limit)
    sys.stderr.write(f"[ALI] Produtos obtidos: {len(products)}\n")

    saved = 0
    if not args.no_save and products:
        sys.stderr.write(f"[ALI] Salvando {len(products)} produtos no Supabase...\n")
        saved = save_to_supabase(products)
        sys.stderr.write(f"[ALI] Salvos: {saved}\n")

    print(json.dumps({
        "success": True,
        "fetched": len(products),
        "saved":   saved,
        "breakdown": {"aliexpress": len(products)},
        "products": products,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
