import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "24"), 100);
  const from = (page - 1) * perPage;

  if (!q.trim()) {
    return NextResponse.json({ data: [], total: 0, page: 1, per_page: perPage, total_pages: 0, has_next: false, has_prev: false });
  }

  const { data, error, count } = await supabase
    .from("products")
    .select("*", { count: "exact" })
    .textSearch("search_vector", q, { type: "websearch" })
    .order("score", { ascending: false })
    .range(from, from + perPage - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
