"""Shopee product scraper using their internal API."""
import asyncio
import random
from typing import Optional
import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from scrapers.common.proxies.proxy_manager import proxy_manager
from scrapers.common.utils.human_behavior import human_delay
from scrapers.shopee.parser import ShopeeParser


class ShopeeScraper:
    """
    Scrapes Shopee via their GraphQL API and search endpoints.
    More reliable than HTML scraping as Shopee has a stable API.
    """

    SEARCH_API = "https://shopee.com.br/api/v4/search/search_items"
    ITEM_API = "https://shopee.com.br/api/v4/item/get"
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Accept-Language": "pt-BR,pt;q=0.9",
        "Referer": "https://shopee.com.br/",
        "x-api-source": "pc",
        "x-shopee-language": "pt-BR",
    }

    def __init__(self):
        self.parser = ShopeeParser()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def search_products(
        self,
        keyword: str,
        page: int = 0,
        per_page: int = 60,
        max_price: float = 50.0,
    ) -> list[dict]:
        """Search Shopee products via API."""
        params = {
            "by": "relevancy",
            "keyword": keyword,
            "limit": per_page,
            "newest": page * per_page,
            "order": "desc",
            "page_type": "search",
            "scenario": "PAGE_GLOBAL_SEARCH",
            "version": 2,
            "price_max": int(max_price * 100000),  # Shopee uses cents * 100
        }

        async with await proxy_manager.get_proxied_client() as client:
            try:
                response = await client.get(
                    self.SEARCH_API,
                    params=params,
                    headers=self.HEADERS,
                )
                response.raise_for_status()
                data = response.json()

                items = data.get("items", [])
                logger.info(f"Shopee: Found {len(items)} products for '{keyword}'")
                return [self.parser.parse_item(item) for item in items if item]

            except httpx.HTTPError as e:
                logger.error(f"Shopee HTTP error: {e}")
                raise
            except Exception as e:
                logger.error(f"Shopee scrape error: {e}")
                raise

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def get_product(self, shop_id: int, item_id: int) -> Optional[dict]:
        """Get detailed product info from Shopee API."""
        async with await proxy_manager.get_proxied_client() as client:
            try:
                response = await client.get(
                    self.ITEM_API,
                    params={"shopid": shop_id, "itemid": item_id},
                    headers=self.HEADERS,
                )
                response.raise_for_status()
                data = response.json()
                return self.parser.parse_detail(data.get("item", {}))
            except Exception as e:
                logger.error(f"Error fetching Shopee product {item_id}: {e}")
                return None

    async def scrape_flash_deals(self) -> list[dict]:
        """Scrape current Shopee flash deals."""
        flash_url = "https://shopee.com.br/api/v4/flash_sale/flash_sale_get_items"
        params = {"limit": 40, "offset": 0, "need_main_info": 1, "need_price": 1}

        async with await proxy_manager.get_proxied_client() as client:
            try:
                resp = await client.get(flash_url, params=params, headers=self.HEADERS)
                data = resp.json()
                items = data.get("items", [])
                return [self.parser.parse_flash_deal(item) for item in items]
            except Exception as e:
                logger.error(f"Error fetching flash deals: {e}")
                return []
