"""AliExpress product scraper using Playwright with anti-detection."""
import asyncio
import json
import re
from typing import Optional
from loguru import logger
from playwright.async_api import async_playwright, Browser, BrowserContext
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from scrapers.common.proxies.proxy_manager import proxy_manager
from scrapers.common.utils.human_behavior import human_delay, human_scroll, random_viewport_scroll
from scrapers.aliexpress.parser import AliExpressParser


class AliExpressScraper:
    """
    Scrapes AliExpress products with:
    - Undetected Playwright browser
    - Proxy rotation
    - Human behavior simulation
    - CAPTCHA detection
    """

    BASE_URL = "https://www.aliexpress.com"
    SEARCH_URL = "https://www.aliexpress.com/wholesale"

    def __init__(self):
        self.parser = AliExpressParser()
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None

    async def __aenter__(self):
        await self._setup_browser()
        return self

    async def __aexit__(self, *args):
        await self._teardown()

    async def _setup_browser(self):
        """Launch Playwright with stealth configuration."""
        proxy = await proxy_manager.get_proxy()
        playwright = await async_playwright().start()

        self._browser = await playwright.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--single-process",
                "--disable-gpu",
                "--disable-blink-features=AutomationControlled",
            ],
        )

        context_kwargs = {
            "viewport": {"width": 1920, "height": 1080},
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "locale": "pt-BR",
            "timezone_id": "America/Sao_Paulo",
            "geolocation": {"longitude": -46.6333, "latitude": -23.5505},
            "permissions": ["geolocation"],
        }

        if proxy:
            context_kwargs["proxy"] = {"server": proxy.url}

        self._context = await self._browser.new_context(**context_kwargs)

        # Inject stealth scripts
        await self._context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
            Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
            window.chrome = { runtime: {} };
        """)

    async def _teardown(self):
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()

    async def _is_captcha(self, page) -> bool:
        """Detect CAPTCHA presence."""
        captcha_selectors = [
            ".nc_wrapper",
            "#captcha_dialog",
            ".baxia-dialog",
            ".aec-slide-button",
        ]
        for sel in captcha_selectors:
            try:
                elem = page.locator(sel)
                if await elem.count() > 0:
                    logger.warning("CAPTCHA detected!")
                    return True
            except Exception:
                pass
        return False

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(Exception),
    )
    async def search_products(self, keyword: str, page_num: int = 1, max_price: float = 50.0) -> list[dict]:
        """Search products by keyword with pagination."""
        page = await self._context.new_page()
        results = []

        try:
            url = f"{self.SEARCH_URL}?SearchText={keyword}&page={page_num}&maxPrice={max_price}"
            logger.info(f"Scraping AliExpress: {url}")

            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await human_delay(2000, 4000)

            if await self._is_captcha(page):
                raise Exception("CAPTCHA detected, aborting")

            await random_viewport_scroll(page)
            await human_delay(1000, 2000)

            # Wait for products
            await page.wait_for_selector(".search-item-card-wrapper-gallery", timeout=15000)

            # Extract product data
            content = await page.content()
            results = await self.parser.parse_search_results(content)

            logger.info(f"Found {len(results)} products for '{keyword}'")
        except Exception as e:
            logger.error(f"Error scraping AliExpress: {e}")
            raise
        finally:
            await page.close()

        return results

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def get_product_details(self, product_id: str) -> Optional[dict]:
        """Get detailed product information."""
        page = await self._context.new_page()

        try:
            url = f"{self.BASE_URL}/item/{product_id}.html"
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await human_delay(1500, 3000)

            if await self._is_captcha(page):
                raise Exception("CAPTCHA detected")

            # Extract JSON data from page scripts
            scripts = await page.query_selector_all("script")
            product_data = None

            for script in scripts:
                content = await script.inner_text()
                if "window.runParams" in content:
                    match = re.search(r"window\.runParams\s*=\s*(\{.+?\});", content, re.DOTALL)
                    if match:
                        try:
                            product_data = json.loads(match.group(1))
                            break
                        except json.JSONDecodeError:
                            pass

            if product_data:
                return await self.parser.parse_product_detail(product_data)

        except Exception as e:
            logger.error(f"Error getting AliExpress product {product_id}: {e}")
            raise
        finally:
            await page.close()

        return None

    async def scrape_category(self, category_url: str, max_pages: int = 5) -> list[dict]:
        """Scrape an entire category with pagination."""
        all_products = []

        for page_num in range(1, max_pages + 1):
            try:
                # Extract category from URL and construct paginated URL
                url = f"{category_url}&page={page_num}"
                products = await self.search_products("", page_num)
                if not products:
                    break
                all_products.extend(products)
                await human_delay(3000, 6000)
            except Exception as e:
                logger.error(f"Error on page {page_num}: {e}")
                break

        return all_products
