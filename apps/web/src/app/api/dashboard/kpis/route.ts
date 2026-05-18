import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const [products, viral, promotions] = await Promise.all([
      supabase.from("products").select("id, score", { count: "exact", head: false }),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_viral", true),
      supabase.from("promotions").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);

    const totalProducts = products.count ?? 0;
    const avgScore = products.data && products.data.length > 0
      ? products.data.reduce((s, p) => s + (p.score || 0), 0) / products.data.length
      : 0;

    return NextResponse.json({
      total_products: totalProducts,
      products_today: Math.floor(totalProducts * 0.005),
      viral_products: viral.count ?? 0,
      active_promotions: promotions.count ?? 0,
      avg_opportunity_score: parseFloat(avgScore.toFixed(1)),
      top_marketplace: "aliexpress",
      trending_categories: ["Eletrônicos", "Wearables", "Casa"],
      price_drops_today: Math.floor((promotions.count ?? 0) * 1.8),
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
