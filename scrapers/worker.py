"""Celery worker configuration and tasks."""
import asyncio
import os
from celery import Celery
from loguru import logger
from supabase import create_client, Client

app = Celery("mineracao")

app.conf.update(
    broker_url=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    result_backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max
    worker_max_tasks_per_child=50,
    beat_schedule={
        "scrape-aliexpress-every-hour": {
            "task": "worker.scrape_aliexpress_trending",
            "schedule": 3600.0,
        },
        "scrape-shopee-flash-deals": {
            "task": "worker.scrape_shopee_flash",
            "schedule": 1800.0,
        },
        "refresh-materialized-views": {
            "task": "worker.refresh_views",
            "schedule": 3600.0,
        },
        "analyze-viral-products": {
            "task": "worker.analyze_viral",
            "schedule": 900.0,
        },
        "send-alerts": {
            "task": "worker.send_alerts",
            "schedule": 300.0,
        },
    },
)


def get_supabase() -> Client:
    return create_client(
        os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
    )


def run_async(coro):
    """Helper to run async code in sync celery tasks."""
    return asyncio.get_event_loop().run_until_complete(coro)


@app.task(bind=True, max_retries=3, default_retry_delay=60)
def scrape_aliexpress_trending(self, keywords: list[str] = None):
    """Scrape trending AliExpress products."""
    from scrapers.aliexpress.scraper import AliExpressScraper
    from scrapers.common.ai.opportunity_scorer import OpportunityScorer

    if not keywords:
        keywords = [
            "wireless earbuds", "led lights", "phone case", "smartwatch",
            "portable charger", "bluetooth speaker", "webcam", "ring light",
        ]

    supabase = get_supabase()
    scorer = OpportunityScorer()
    total_saved = 0

    async def _scrape():
        nonlocal total_saved
        async with AliExpressScraper() as scraper:
            for keyword in keywords[:5]:  # Limit per run
                try:
                    products = await scraper.search_products(keyword, max_price=50.0)
                    for product in products:
                        score = scorer.calculate(product)
                        product["score"] = score["total"]
                        product["trend_score"] = score["breakdown"]["engagement"]

                        # Upsert to database
                        result = supabase.table("products").upsert(
                            product,
                            on_conflict="marketplace,external_id",
                        ).execute()

                        if result.data:
                            # Record history
                            supabase.table("product_history").insert({
                                "product_id": result.data[0]["id"],
                                "price": product["price"],
                                "sales": product.get("sales", 0),
                            }).execute()
                            total_saved += 1

                except Exception as e:
                    logger.error(f"Error scraping keyword '{keyword}': {e}")

    run_async(_scrape())
    logger.info(f"Saved {total_saved} products from AliExpress")
    return {"saved": total_saved}


@app.task(bind=True, max_retries=3)
def scrape_shopee_flash(self):
    """Scrape Shopee flash deals."""
    from scrapers.shopee.scraper import ShopeeScraper

    supabase = get_supabase()

    async def _scrape():
        scraper = ShopeeScraper()
        deals = await scraper.scrape_flash_deals()
        saved = 0

        for deal in deals:
            try:
                # Upsert product
                result = supabase.table("products").upsert(
                    {**deal, "in_promotion": True},
                    on_conflict="marketplace,external_id",
                ).execute()

                if result.data:
                    product_id = result.data[0]["id"]
                    # Create promotion record
                    supabase.table("promotions").insert({
                        "product_id": product_id,
                        "type": "flash_sale",
                        "discount": deal.get("discount", 0),
                        "original_price": deal.get("original_price", deal["price"]),
                        "promo_price": deal["price"],
                        "is_active": True,
                    }).execute()
                    saved += 1
            except Exception as e:
                logger.error(f"Error saving flash deal: {e}")

        return saved

    saved = run_async(_scrape())
    logger.info(f"Saved {saved} Shopee flash deals")
    return {"saved": saved}


@app.task
def refresh_views():
    """Refresh materialized views in PostgreSQL."""
    supabase = get_supabase()
    supabase.rpc("refresh_materialized_views").execute()
    logger.info("Materialized views refreshed")
    return {"status": "ok"}


@app.task
def analyze_viral(threshold: float = 85.0):
    """Mark products as viral based on score and growth."""
    supabase = get_supabase()

    # Get recent products with high scores
    result = supabase.table("products").select("id, score, trend_score").gte("score", threshold).execute()

    viral_ids = [p["id"] for p in (result.data or []) if p["trend_score"] >= 70]

    if viral_ids:
        supabase.table("products").update({"is_viral": True}).in_("id", viral_ids).execute()
        logger.info(f"Marked {len(viral_ids)} products as viral")

    return {"viral_count": len(viral_ids)}


@app.task
def send_alerts():
    """Process and send active alerts to users."""
    from scrapers.common.notifications.sender import NotificationSender

    supabase = get_supabase()
    sender = NotificationSender()

    # Get active alerts
    alerts = supabase.table("alerts").select("*, users(email)").eq("active", True).execute()

    triggered = 0
    for alert in (alerts.data or []):
        try:
            triggered_alert = _check_alert_condition(alert, supabase)
            if triggered_alert:
                run_async(sender.send(alert, triggered_alert))
                supabase.table("alerts").update({"last_triggered_at": "now()"}).eq("id", alert["id"]).execute()
                triggered += 1
        except Exception as e:
            logger.error(f"Alert processing error: {e}")

    return {"triggered": triggered}


def _check_alert_condition(alert: dict, supabase: Client) -> dict | None:
    """Check if alert conditions are met. Returns trigger data if so."""
    conditions = alert.get("conditions", {})
    alert_type = alert.get("type")

    if alert_type == "price_drop":
        threshold = conditions.get("price_drop_percentage", 10)
        product_id = alert.get("product_id")
        if not product_id:
            return None

        # Get latest and previous price
        history = supabase.table("product_history").select("price").eq("product_id", product_id).order("captured_at", desc=True).limit(2).execute()

        if history.data and len(history.data) >= 2:
            latest = history.data[0]["price"]
            previous = history.data[1]["price"]
            if previous > 0 and ((previous - latest) / previous * 100) >= threshold:
                return {"price_change": latest - previous, "percentage": (previous - latest) / previous * 100}

    elif alert_type == "product_viral":
        result = supabase.table("products").select("*").eq("is_viral", True).gt("score", conditions.get("min_score", 80)).limit(5).execute()
        if result.data:
            return {"products": result.data}

    return None
