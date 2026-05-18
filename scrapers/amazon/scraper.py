"""Amazon product scraper using Playwright + BeautifulSoup."""
import asyncio
import re
from typing import Optional
from loguru import logger
from playwright.async_api import async_playwright
from tenacity import retry, stop_after_attempt, wait_exponential

from scrapers.common.proxies.proxy_manager import proxy_manager
from scrapers.common.utils.human_behavior import human_delay, random_viewport_scroll
from scrapers.amazon.parser import AmazonParser


class AmazonScraper:
    """
    Scrapes Amazon Brazil (amazon.com.br) with:
    - Playwright stealth mode
    - Proxy rotation
    - CAPTCHA detection
    - Rate limiting
    """

    BASE_URL = "https://www.amazon.com.br"
    SEARCH_URL = f"{BASE_URL}/s"

    def __init__(self):
        self.parser = AmazonParser()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=5, max=30))
    async def search_products(self, keyword: str, page: int = 1, max_price: float = 200.0) -> list[dict]:
        """Search Amazon products."""
        proxy = await proxy_manager.get_proxy()

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
            )

            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                proxy={"server": proxy.url} if proxy else None,
            )

            # Stealth
            await context.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )

            page_obj = await context.new_page()
            products = []

            try:
                params = f"?k={keyword.replace(' ', '+')}&page={page}"
                if max_price:
                    params += f"&price=0-{int(max_price)}"

                await page_obj.goto(f"{self.SEARCH_URL}{params}", timeout=30000)
                await human_delay(2000, 4000)

                # Check for CAPTCHA
                if "Type the characters" in await page_obj.content():
                    logger.warning("Amazon CAPTCHA detected")
                    return []

                await random_viewport_scroll(page_obj)

                content = await page_obj.content()
                products = self.parser.parse_search(content)
                logger.info(f"Amazon: Found {len(products)} products for '{keyword}'")

            except Exception as e:
                logger.error(f"Amazon scrape error: {e}")
            finally:
                await browser.close()

        return products

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=5, max=30))
    async def get_product(self, asin: str) -> Optional[dict]:
        """Get detailed Amazon product page."""
        proxy = await proxy_manager.get_proxy()

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                proxy={"server": proxy.url} if proxy else None,
            )

            page_obj = await context.new_page()
            product = None

            try:
                await page_obj.goto(f"{self.BASE_URL}/dp/{asin}", timeout=30000)
                await human_delay(1500, 3000)

                if "Type the characters" in await page_obj.content():
                    return None

                content = await page_obj.content()
                product = self.parser.parse_detail(content, asin)

            except Exception as e:
                logger.error(f"Amazon product detail error: {e}")
            finally:
                await browser.close()

        return product
