"""Product Opportunity Score engine."""
from dataclasses import dataclass
from typing import TypedDict
import math


class ScoreBreakdown(TypedDict):
    sales_volume: float
    growth_rate: float
    saturation: float
    ad_count: float
    avg_ticket: float
    rating: float
    engagement: float
    social_trend: float
    markup_potential: float
    competitiveness: float


@dataclass
class OpportunityResult:
    total: float
    breakdown: ScoreBreakdown
    label: str
    recommendation: str


WEIGHTS = {
    "sales_volume": 0.20,
    "growth_rate": 0.25,
    "saturation": 0.10,
    "ad_count": 0.05,
    "avg_ticket": 0.10,
    "rating": 0.15,
    "engagement": 0.05,
    "social_trend": 0.05,
    "markup_potential": 0.05,
}


class OpportunityScorer:
    """
    Calculates a proprietary 0-100 Opportunity Score for products.

    Higher score = better opportunity for dropshipping/arbitrage.
    """

    def calculate(self, product: dict) -> dict:
        breakdown = self._calculate_breakdown(product)
        total = sum(breakdown[k] * WEIGHTS.get(k, 0) * 100 for k in breakdown)
        total = min(100, max(0, total))

        label = self._get_label(total)
        recommendation = self._get_recommendation(label, product)

        return {
            "total": round(total, 2),
            "breakdown": {k: round(v * 100, 1) for k, v in breakdown.items()},
            "label": label,
            "recommendation": recommendation,
        }

    def _calculate_breakdown(self, product: dict) -> ScoreBreakdown:
        sales = product.get("sales", 0)
        rating = product.get("rating", 0)
        reviews = product.get("reviews", 0)
        price = product.get("price", 0)
        original_price = product.get("original_price") or price
        discount = product.get("discount", 0) or 0
        free_shipping = product.get("free_shipping", False)

        # Sales volume score (0-1)
        sales_score = min(1.0, math.log10(max(1, sales)) / 6)

        # Rating score (0-1)
        rating_score = (rating / 5.0) ** 2  # Quadratic to reward high ratings

        # Markup potential (0-1)
        cost_multiplier = price / original_price if original_price > 0 else 1.0
        markup_potential = 1.0 - cost_multiplier  # Higher discount = more markup room

        # Price sweet spot (0-1) — products $5-$50 are best for dropship
        if 5 <= price <= 50:
            ticket_score = 1.0 - abs(price - 20) / 45
        elif price < 5:
            ticket_score = price / 5
        else:
            ticket_score = max(0, 1 - (price - 50) / 150)

        # Engagement (reviews signal)
        engagement = min(1.0, math.log10(max(1, reviews)) / 5)

        # Social trend (simulated from viral flag)
        social = 0.9 if product.get("is_viral") else 0.3

        # Growth (simulated from promotion + viral)
        growth = 0.8 if (product.get("in_promotion") and product.get("is_viral")) else 0.4

        # Saturation (inverse of sales for this model — very high sales = saturated)
        saturation = max(0, 1 - sales_score * 0.8)

        # Ad count (simulated)
        ad_count = 0.5

        # Competitiveness (lower price + better rating vs market)
        competitiveness = (rating_score + (1 - ticket_score * 0.3)) / 2

        return {
            "sales_volume": sales_score,
            "growth_rate": growth,
            "saturation": saturation,
            "ad_count": ad_count,
            "avg_ticket": ticket_score,
            "rating": rating_score,
            "engagement": engagement,
            "social_trend": social,
            "markup_potential": markup_potential,
            "competitiveness": competitiveness,
        }

    @staticmethod
    def _get_label(score: float) -> str:
        if score >= 85: return "explosive"
        if score >= 70: return "high"
        if score >= 50: return "medium"
        if score >= 30: return "low"
        return "saturated"

    @staticmethod
    def _get_recommendation(label: str, product: dict) -> str:
        recs = {
            "explosive": f"Produto explosivo! Estocar e anunciar imediatamente. Alta demanda com margem excelente.",
            "high": f"Excelente oportunidade. Testar com pequeno estoque inicial antes de escalar.",
            "medium": f"Produto com bom potencial. Recomendado para nicho específico.",
            "low": f"Produto com margem baixa. Considere outros produtos similares.",
            "saturated": f"Mercado saturado. Difícil competir sem diferenciação.",
        }
        return recs.get(label, "")
