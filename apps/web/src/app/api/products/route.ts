import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "24"), 100);
  const from = (page - 1) * perPage;

  let query = supabase.from("products").select("*", { count: "exact" });

  // Marketplace filter
  const marketplace = searchParams.getAll("marketplace");
  if (marketplace.length > 0) query = query.in("marketplace", marketplace);

  // Price filters
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  if (minPrice) query = query.gte("price", parseFloat(minPrice));
  if (maxPrice) query = query.lte("price", parseFloat(maxPrice));

  // Boolean filters
  if (searchParams.get("is_viral") === "true") query = query.eq("is_viral", true);
  if (searchParams.get("in_promotion") === "true") query = query.eq("in_promotion", true);
  if (searchParams.get("is_dropshipping") === "true") query = query.eq("is_dropshipping", true);
  if (searchParams.get("free_shipping") === "true") query = query.eq("free_shipping", true);

  // Score filter
  const minScore = searchParams.get("min_score");
  if (minScore) query = query.gte("score", parseFloat(minScore));

  // Rating filter
  const minRating = searchParams.get("min_rating");
  if (minRating) query = query.gte("rating", parseFloat(minRating));

  // Text search
  const q = searchParams.get("query");
  if (q) query = query.textSearch("search_vector", q, { type: "websearch" });

  // Sorting
  const sortBy = searchParams.get("sort_by") || "score";
  const sortOrder = searchParams.get("sort_order") === "asc" ? true : false;
  const validSorts = ["score", "sales", "price", "rating", "created_at", "discount", "trend_score"];
  const safeSort = validSorts.includes(sortBy) ? sortBy : "score";
  query = query.order(safeSort, { ascending: sortOrder });

  // Pagination
  query = query.range(from, from + perPage - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message, code: "DB_ERROR", status: 500 }, { status: 500 });
  }

  const totalPages = Math.ceil((count || 0) / perPage);

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    per_page: perPage,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1,
  });
}
