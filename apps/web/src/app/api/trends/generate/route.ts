import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServiceClient();

  // Fetch all products with category, trend_score, sales
  const { data: products, error } = await supabase
    .from("products")
    .select("category, trend_score, sales, marketplace, created_at")
    .not("category", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!products || products.length === 0) {
    return NextResponse.json({ message: "No products to generate trends from", generated: 0 });
  }

  // Group by category
  const byCategory: Record<string, { trend_scores: number[]; total_sales: number; marketplace: string }> = {};
  for (const p of products) {
    const cat = (p.category as string) || "Outros";
    if (!byCategory[cat]) byCategory[cat] = { trend_scores: [], total_sales: 0, marketplace: p.marketplace };
    byCategory[cat].trend_scores.push(p.trend_score ?? 0);
    byCategory[cat].total_sales += p.sales ?? 0;
  }

  const now = Date.now();
  const upserts = Object.entries(byCategory).map(([category, stats]) => {
    const avgTrend = stats.trend_scores.reduce((a, b) => a + b, 0) / stats.trend_scores.length;
    const growth = parseFloat((avgTrend * 2.5).toFixed(2)); // scale to reasonable %
    const volume = stats.total_sales;

    // Generate 7 data points going back 7 days
    const data_points = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * 86400000);
      const dateStr = d.toISOString().split("T")[0];
      const factor = 0.5 + (i / 6) * 0.5; // 50% → 100% over 7 days
      return {
        date: dateStr,
        volume: Math.round(volume * factor),
        growth: parseFloat((growth * factor).toFixed(1)),
      };
    });

    return {
      keyword: category,
      category,
      growth,
      volume,
      marketplace: stats.marketplace || null,
      data_points,
      updated_at: new Date().toISOString(),
    };
  });

  const { error: upsertError } = await supabase
    .from("trends")
    .upsert(upserts, { onConflict: "keyword,marketplace" });

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  return NextResponse.json({ generated: upserts.length });
}
