"""AliExpress HTML/JSON parser."""
import re
from typing import Optional
from bs4 import BeautifulSoup
from loguru import logger
from scrapers.common.utils.slug import slugify


class AliExpressParser:
    """Parses AliExpress search results and product pages."""

    def parse_search_results(self, html: str) -> list[dict]:
        """Parse search results page and extract product cards."""
        soup = BeautifulSoup(html, "lxml")
        products = []

        cards = soup.select(".search-item-card-wrapper-gallery")

        for card in cards:
            try:
                product = self._parse_card(card)
                if product:
                    products.append(product)
            except Exception as e:
                logger.warning(f"Error parsing card: {e}")

        return products

    def _parse_card(self, card) -> Optional[dict]:
        """Parse a single product card."""
        try:
            # Title
            title_el = card.select_one("h1[class*='title'], .multi--titleText--')
            if not title_el:
                return None
            title = title_el.get_text(strip=True)

            # Price
            price_el = card.select_one(".multi--price-sale--")
            if not price_el:
                return None
            price_text = price_el.get_text(strip=True)
            price = self._parse_price(price_text)

            # Original price
            orig_el = card.select_one(".multi--price-original--")
            original_price = None
            if orig_el:
                original_price = self._parse_price(orig_el.get_text(strip=True))

            # Discount
            discount = None
            if original_price and original_price > price:
                discount = round((1 - price / original_price) * 100, 1)

            # Image
            img_el = card.select_one("img")
            image = img_el.get("src") or img_el.get("data-src", "") if img_el else ""
            if image.startswith("//"):
                image = f"https:{image}"

            # Product URL & ID
            link_el = card.select_one("a[href]")
            url = link_el["href"] if link_el else ""
            if url.startswith("//"):
                url = f"https:{url}"

            external_id = self._extract_item_id(url)

            # Sales
            sales_el = card.select_one("[class*='sold']")
            sales = self._parse_sales(sales_el.get_text(strip=True) if sales_el else "0")

            # Rating
            rating_el = card.select_one("[class*='score'], [class*='rating']")
            rating = float(rating_el.get_text(strip=True) or "0") if rating_el else 0.0

            # Reviews
            reviews_el = card.select_one("[class*='feedback']")
            reviews = int(re.sub(r"\D", "", reviews_el.get_text(strip=True) or "0")) if reviews_el else 0

            # Shipping
            free_shipping = bool(card.select_one("[class*='free-shipping']"))

            return {
                "marketplace": "aliexpress",
                "external_id": external_id,
                "title": title,
                "slug": slugify(title),
                "price": price,
                "original_price": original_price,
                "discount": discount,
                "currency": "USD",
                "sales": sales,
                "rating": rating,
                "reviews": reviews,
                "images": [image] if image else [],
                "thumbnail": image,
                "url": url,
                "free_shipping": free_shipping,
                "is_dropshipping": True,
            }

        except Exception as e:
            logger.warning(f"Parse error: {e}")
            return None

    async def parse_product_detail(self, data: dict) -> dict:
        """Parse detailed product data from window.runParams JSON."""
        try:
            item_data = data.get("data", {}).get("root", {}).get("fields", {})
            title = item_data.get("subject", "")
            price_info = item_data.get("priceModule", {})
            sku_info = item_data.get("skuModule", {})
            ship_info = item_data.get("shippingModule", {})
            ratings = item_data.get("titleModule", {})

            images = [img.get("imageUrl", "") for img in item_data.get("imageModule", {}).get("imagePathList", [])]

            return {
                "title": title,
                "slug": slugify(title),
                "price": float(price_info.get("minAmount", {}).get("value", 0)),
                "original_price": float(price_info.get("maxActivityAmount", {}).get("value", 0) or 0),
                "images": images,
                "thumbnail": images[0] if images else "",
                "rating": float(ratings.get("feedbackRating", {}).get("averageStar", 0)),
                "reviews": int(ratings.get("feedbackRating", {}).get("totalValidNum", 0)),
                "free_shipping": ship_info.get("freightExt", {}).get("isFreeShipping", False),
            }
        except Exception as e:
            logger.error(f"Detail parse error: {e}")
            return {}

    @staticmethod
    def _parse_price(price_str: str) -> float:
        """Extract numeric price from string."""
        cleaned = re.sub(r"[^\d.,]", "", price_str).replace(",", ".")
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    @staticmethod
    def _parse_sales(sales_str: str) -> int:
        """Parse sales count from string like '1.2k sold'."""
        sales_str = sales_str.lower().strip()
        match = re.search(r"([\d.,]+)\s*([km]?)", sales_str)
        if not match:
            return 0
        num = float(match.group(1).replace(",", "."))
        multiplier = {"k": 1000, "m": 1_000_000}.get(match.group(2), 1)
        return int(num * multiplier)

    @staticmethod
    def _extract_item_id(url: str) -> str:
        """Extract item ID from AliExpress URL."""
        match = re.search(r"/item/(\d+)", url)
        return match.group(1) if match else url
