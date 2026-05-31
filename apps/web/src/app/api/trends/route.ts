import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const marketplace = searchParams.get("marketplace");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  let query = supabase
    .from("trends")
    .select("*")
    .order("growth", { ascending: false })
    .limit(limit);

  if (category) query = query.eq("category", category);
  if (marketplace) query = query.eq("marketplace", marketplace);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
