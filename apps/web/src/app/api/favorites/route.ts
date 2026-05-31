import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const collection = request.nextUrl.searchParams.get("collection");

  let query = supabase
    .from("favorites")
    .select("*, product:products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (collection && collection !== "Todos") {
    query = query.eq("collection_name", collection);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { product_id, collection_name = "default", notes } = body;

  if (!product_id) return NextResponse.json({ error: "product_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("favorites")
    .upsert({ user_id: user.id, product_id, collection_name, notes }, { onConflict: "user_id,product_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
