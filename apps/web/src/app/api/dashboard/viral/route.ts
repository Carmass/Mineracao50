import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const limit = Math.min(parseInt(new URL(request.url).searchParams.get("limit") || "6"), 50);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_viral", true)
      .order("score", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
