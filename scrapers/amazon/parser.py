"""Amazon HTML parser."""
import re
from typing import Optional
from bs4 import BeautifulSoup
from scrapers.common.utils.slug import slugify


class AmazonParser:

    def parse_search(self, html: str) -> list[dict]:
        soup = BeautifulSoup(html, "lxml")
        products = []

        for item in soup.select('[data-asin]:not([data-asin=""])'):
            asin = item.get("data-asin", "")
            if not asin:
                continue

            title_el = item.select_one("h2 a span, .a-text-normal")
            if not title_el:
                continue
            title = title_el.get_text(strip=True)

            price_el = item.select_one(".a-price .a-offscreen, .a-price-whole")
            price = self._parse_price(price_el.get_text(strip=True) if price_el else "0")

            orig_el = item.select_one(".a-text-price .a-offscreen")
            original_price = self._parse_price(orig_el.get_text(strip=True) if orig_el else "0")

            discount = None
            if original_price and original_price > price and price > 0:
                discount = round((1 - price / original_price) * 100, 1)

            img_el = item.select_one("img.s-image")
            image = img_el.get("src", "") if img_el else ""

            rating_el = item.select_one(".a-icon-alt")
            rating_text = rating_el.get_text(strip=True) if rating_el else "0"
            rating_match = re.search(r"([\d,\.]+)", rating_text)
            rating = float(rating_match.group(1).replace(",", ".")) if rating_match else 0.0

            reviews_el = item.select_one(".a-size-base.s-underline-text")
            reviews_text = reviews_el.get_text(strip=True).replace(".", "").replace(",", "") if reviews_el else "0"
            reviews = int(re.sub(r"\D", "", reviews_text) or "0")

            products.append({
                "marketplace": "amazon",
                "external_id": asin,
                "title": title,
                "slug": slugify(title),
                "price": price,
                "original_price": original_price or None,
                "discount": discount,
                "currency": "BRL",
                "sales": 0,
                "rating": rating,
                "reviews": reviews,
                "images": [image],
                "thumbnail": image,
                "url": f"https://www.amazon.com.br/dp/{asin}",
                "free_shipping": False,
                "is_dropshipping": False,
            })

        return products

    def parse_detail(self, html: str, asin: str) -> Optional[dict]:
        soup = BeautifulSoup(html, "lxml")

        title_el = soup.select_one("#productTitle")
        if not title_el:
            return None
        title = title_el.get_text(strip=True)

        price_el = soup.select_one(".a-price .a-offscreen")
        price = self._parse_price(price_el.get_text(strip=True) if price_el else "0")

        images_data = []
        for script in soup.find_all("script"):
            if "colorImages" in script.get_text():
                matches = re.findall(r'"hiRes":"([^"]+)"', script.get_text())
                images_data = matches[:5]
                break

        rating_el = soup.select_one("#acrPopover")
        rating = float(rating_el.get("title", "0").split()[0].replace(",", ".")) if rating_el else 0.0

        reviews_el = soup.select_one("#acrCustomerReviewText")
        reviews_text = reviews_el.get_text(strip=True) if reviews_el else "0"
        reviews = int(re.sub(r"\D", "", reviews_text) or "0")

        desc_el = soup.select_one("#feature-bullets")
        description = desc_el.get_text(strip=True, separator=" ") if desc_el else ""

        return {
            "marketplace": "amazon",
            "external_id": asin,
            "title": title,
            "slug": slugify(title),
            "description": description,
            "price": price,
            "currency": "BRL",
            "rating": rating,
            "reviews": reviews,
            "images": images_data,
            "thumbnail": images_data[0] if images_data else "",
            "url": f"https://www.amazon.com.br/dp/{asin}",
            "free_shipping": bool(soup.select_one(".a-color-success")),
            "is_dropshipping": False,
        }

    @staticmethod
    def _parse_price(text: str) -> float:
        text = text.replace("R$", "").replace(".", "").replace(",", ".").strip()
        try:
            return float(re.sub(r"[^\d.]", "", text))
        except ValueError:
            return 0.0
