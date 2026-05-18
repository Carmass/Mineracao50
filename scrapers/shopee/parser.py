"""Shopee API response parser."""
from scrapers.common.utils.slug import slugify


class ShopeeParser:
    """Parses Shopee API responses into normalized product data."""

    BASE_IMAGE_URL = "https://cf.shopee.com.br/file/"

    def parse_item(self, item: dict) -> dict:
        """Parse a search result item."""
        item_basic = item.get("item_basic", item)

        price_raw = item_basic.get("price", 0) / 100000
        original_price_raw = item_basic.get("price_before_discount", 0)
        original_price = original_price_raw / 100000 if original_price_raw else None

        discount = None
        if original_price and original_price > price_raw:
            discount = round((1 - price_raw / original_price) * 100, 1)

        image_ids = item_basic.get("images", [])
        images = [f"{self.BASE_IMAGE_URL}{img}" for img in image_ids[:5]]

        sales = item_basic.get("sold", 0) or item_basic.get("historical_sold", 0)
        rating = item_basic.get("item_rating", {}).get("rating_star", 0)
        reviews = item_basic.get("item_rating", {}).get("rating_count", [0])
        if isinstance(reviews, list):
            reviews = sum(reviews)

        title = item_basic.get("name", "")
        shop_id = item_basic.get("shopid", 0)
        item_id = item_basic.get("itemid", 0)

        return {
            "marketplace": "shopee",
            "external_id": f"{shop_id}_{item_id}",
            "title": title,
            "slug": slugify(title),
            "price": round(price_raw, 2),
            "original_price": round(original_price, 2) if original_price else None,
            "discount": discount,
            "currency": "BRL",
            "sales": sales,
            "rating": round(rating, 2),
            "reviews": reviews,
            "images": images,
            "thumbnail": images[0] if images else "",
            "url": f"https://shopee.com.br/product/{shop_id}/{item_id}",
            "free_shipping": bool(item_basic.get("show_free_shipping")),
            "is_dropshipping": True,
            "category": str(item_basic.get("catid", "")),
            "tags": item_basic.get("tags", []),
        }

    def parse_detail(self, item: dict) -> dict:
        """Parse detailed product data."""
        base = self.parse_item(item)
        base["description"] = item.get("description", "")
        base["supplier"] = item.get("shop_name", "")
        return base

    def parse_flash_deal(self, item: dict) -> dict:
        """Parse flash deal item."""
        base = self.parse_item(item)
        base["in_promotion"] = True
        base["promotion_type"] = "flash_sale"
        return base
