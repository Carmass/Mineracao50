"""
Scraper do Mercado Livre via API Oficial (gratuita).

Como configurar:
  1. Acesse https://developers.mercadolivre.com.br
  2. Clique em "Criar aplicação"
  3. Preencha nome/descrição, selecione "Leitura" nas permissões
  4. Copie o APP_ID e SECRET_KEY para o arquivo .env:
       ML_APP_ID=seu_app_id
       ML_SECRET_KEY=seu_secret_key

Uso:
  python scrape_mercadolivre.py --keyword "smartwatch" --limit 20
  python scrape_mercadolivre.py --keyword "led rgb" --no-save
"""
import sys
import os
import json
import re
import argparse
import time
from pathlib import Path
from urllib.parse import quote_plus

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

ML_API = "https://api.mercadolibre.com"
TOKEN_CACHE: dict = {}  # { "token": str, "expires_at": float }


# ──────────────────────────────────────────────────────────────
# OAuth2 — Application Token (não precisa de login do usuário)
# ──────────────────────────────────────────────────────────────

def get_access_token(client: httpx.Client) -> str | None:
    """Obtém token de acesso via client_credentials. Dura 6 horas."""
    now = time.time()
    if TOKEN_CACHE.get("token") and TOKEN_CACHE.get("expires_at", 0) > now + 60:
        return TOKEN_CACHE["token"]

    app_id = os.getenv("ML_APP_ID", "").strip()
    secret_key = os.getenv("ML_SECRET_KEY", "").strip()

    if not app_id or not secret_key:
        sys.stderr.write(
            "[ML] ML_APP_ID e ML_SECRET_KEY não configurados.\n"
            "[ML] Cadastre-se em https://developers.mercadolivre.com.br\n"
        )
        return None

    try:
        r = client.post(
            f"{ML_API}/oauth/token",
            data={
                "grant_type": "client_credentials",
                "client_id": app_id,
                "client_secret": secret_key,
            },
            headers={"Accept": "application/json"},
            timeout=15,
        )
        if r.status_code != 200:
            sys.stderr.write(f"[ML] Erro ao obter token: {r.status_code} {r.text[:200]}\n")
            return None

        data = r.json()
        token = data.get("access_token")
        expires_in = data.get("expires_in", 21600)
        TOKEN_CACHE["token"] = token
        TOKEN_CACHE["expires_at"] = now + expires_in
        sys.stderr.write(f"[ML] Token obtido, válido por {expires_in//3600}h\n")
        return token

    except Exception as e:
        sys.stderr.write(f"[ML] Erro ao autenticar: {e}\n")
        return None


# ──────────────────────────────────────────────────────────────
# Busca de produtos
# ──────────────────────────────────────────────────────────────

def scrape_mercadolivre(keyword: str, limit: int = 20) -> list[dict]:
    """
    Busca produtos no Mercado Livre Brasil via API oficial.
    Retorna lista com imagens reais e URLs diretas dos produtos.
    """
    with httpx.Client(timeout=20) as client:
        token = get_access_token(client)
        if not token:
            return []

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }

        # Busca por vendidos (sold_quantity_desc) — melhor para dropshipping
        params = {
            "q": keyword,
            "sort": "sold_quantity_desc",
            "limit": min(limit, 50),
            "condition": "new",           # apenas produtos novos
            "shipping_cost": "free",      # frete grátis preferencial
        }

        sys.stderr.write(f"[ML] Buscando '{keyword}' (limit={limit})...\n")
        try:
            r = client.get(f"{ML_API}/sites/MLB/search", headers=headers, params=params)
            if r.status_code != 200:
                sys.stderr.write(f"[ML] Busca retornou {r.status_code}: {r.text[:200]}\n")
                return []
        except Exception as e:
            sys.stderr.write(f"[ML] Erro na busca: {e}\n")
            return []

        data = r.json()
        results_raw = data.get("results", [])
        total = data.get("paging", {}).get("total", 0)
        sys.stderr.write(f"[ML] {total} produtos encontrados, processando {len(results_raw)}\n")

        # Buscar imagens em alta resolução em lote (até 20 ids por vez)
        item_ids = [p["id"] for p in results_raw]
        hd_images = fetch_hd_images(client, headers, item_ids)

        results = []
        for p in results_raw:
            item_id = p.get("id", "")
            price = float(p.get("price") or 0)
            original_price = float(p.get("original_price") or 0) or None
            discount = 0
            if original_price and original_price > price:
                discount = round(((original_price - price) / original_price) * 100)

            sold = int(p.get("sold_quantity") or 0)
            rating_data = p.get("seller_reputation", {})

            # Imagem: preferir HD buscada separadamente, fallback thumbnail
            thumbnail = hd_images.get(item_id) or _upgrade_thumbnail(p.get("thumbnail", ""))

            # Score de oportunidade: vendas + desconto + frete grátis
            free_shipping = bool((p.get("shipping") or {}).get("free_shipping"))
            score = min(100, round(
                (sold / 500) * 40 +
                discount * 0.5 +
                (20 if free_shipping else 0) +
                10
            ))

            # Categorias
            category_id = p.get("category_id", "")

            results.append({
                "title": (p.get("title") or "Produto ML")[:500],
                "price": round(price, 2),
                "original_price": round(original_price, 2) if original_price else None,
                "discount_pct": discount,
                "image_url": thumbnail,
                "product_url": p.get("permalink") or f"https://www.mercadolivre.com.br/s#D={quote_plus(keyword)}",
                "marketplace": "mercadolivre",
                "marketplace_id": f"ml_{item_id}",
                "currency": "BRL",
                "sales_count": sold,
                "rating": 0.0,  # ML não expõe rating público via search API
                "opportunity_score": score,
                "free_shipping": free_shipping,
                "category_id": category_id,
            })

        return results


def fetch_hd_images(client: httpx.Client, headers: dict, item_ids: list[str]) -> dict[str, str]:
    """
    Busca imagem em alta resolução via /items/{id}/pictures.
    Usa multiget do ML (/items?ids=...) para eficiência.
    """
    if not item_ids:
        return {}

    hd: dict[str, str] = {}
    # ML suporta multiget com até 20 IDs
    batch = item_ids[:20]
    ids_str = ",".join(batch)

    try:
        r = client.get(
            f"{ML_API}/items",
            headers=headers,
            params={"ids": ids_str, "attributes": "id,pictures"},
            timeout=15,
        )
        if r.status_code != 200:
            return {}

        for entry in r.json():
            if entry.get("code") != 200:
                continue
            body = entry.get("body", {})
            item_id = body.get("id", "")
            pictures = body.get("pictures", [])
            if pictures:
                # Pegar a imagem principal em resolução máxima
                first = pictures[0]
                url = first.get("secure_url") or first.get("url") or ""
                # Substituir tamanho pelo maior disponível
                url = re.sub(r"-[A-Z]+\.", "-O.", url)  # -F → -O (original)
                if url:
                    hd[item_id] = url
    except Exception as e:
        sys.stderr.write(f"[ML] Erro ao buscar imagens HD: {e}\n")

    return hd


def _upgrade_thumbnail(url: str) -> str:
    """Transforma thumbnail pequeno em imagem maior substituindo o sufixo de tamanho."""
    if not url:
        return ""
    # ML usa sufixos como -I (small), -V (medium), -O (original/large)
    return re.sub(r"-[A-Z]\.", "-O.", url)


# ──────────────────────────────────────────────────────────────
# Salvar no Supabase via REST API
# ──────────────────────────────────────────────────────────────

def save_to_supabase(products: list[dict]) -> int:
    base_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    service_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    if not base_url or not service_key:
        sys.stderr.write("[ML] SUPABASE_URL ou SUPABASE_SERVICE_KEY ausente\n")
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
            "marketplace": "mercadolivre",
            "title": p["title"],
            "slug": make_slug(p["title"], ext_id),
            "price": p["price"],
            "original_price": p.get("original_price"),
            "discount": p.get("discount_pct"),
            "currency": "BRL",
            "sales": p["sales_count"],
            "rating": 0.0,
            "thumbnail": p["image_url"],
            "images": [p["image_url"]] if p.get("image_url") else [],
            "url": p["product_url"],
            "free_shipping": p.get("free_shipping", False),
            "category": "geral",
            "tags": [],
            "score": p["opportunity_score"],
            "trend_score": min(100, p["opportunity_score"] * 0.9),
            "metadata": {"ml_id": p["marketplace_id"], "category_id": p.get("category_id", "")},
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
                sys.stderr.write(f"[ML] Supabase erro {r.status_code}: {r.text[:300]}\n")
                return 0
    except Exception as e:
        sys.stderr.write(f"[ML] Supabase HTTP erro: {e}\n")
        return 0


# ──────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scraper Mercado Livre via API oficial")
    parser.add_argument("--keyword", default="smartwatch", help="Palavra-chave de busca")
    parser.add_argument("--limit", type=int, default=20, help="Máximo de produtos (max 50)")
    parser.add_argument("--no-save", action="store_true", help="Não salvar no Supabase")
    args = parser.parse_args()

    sys.stderr.write(f"[ML] Iniciando: keyword={args.keyword!r} limit={args.limit}\n")

    products = scrape_mercadolivre(args.keyword, args.limit)
    sys.stderr.write(f"[ML] Produtos obtidos: {len(products)}\n")

    saved = 0
    if not args.no_save and products:
        sys.stderr.write(f"[ML] Salvando {len(products)} produtos no Supabase...\n")
        saved = save_to_supabase(products)
        sys.stderr.write(f"[ML] Salvos: {saved}\n")

    output = {
        "success": True,
        "fetched": len(products),
        "saved": saved,
        "breakdown": {"mercadolivre": len(products)},
        "products": products,
    }
    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    main()
