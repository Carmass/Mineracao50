import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "edge";

const AlertSchema = z.object({
  type: z.enum(["product_viral", "price_drop", "product_growing", "high_demand", "low_competition", "promotion_started"]),
  product_id: z.string().uuid().optional(),
  conditions: z.object({
    price_drop_percentage: z.number().min(1).max(100).optional(),
    min_score: z.number().min(0).max(100).optional(),
    max_price: z.number().positive().optional(),
    marketplace: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).default({}),
  channels: z.array(z.enum(["email", "push", "telegram", "whatsapp"])).min(1).default(["email"]),
  active: z.boolean().default(true),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("alerts")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = AlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  // Check plan limits
  const { count } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("active", true);

  const { data: userData } = await supabase.from("users").select("plan").eq("id", user.id).single();
  const planLimits: Record<string, number> = { free: 2, starter: 10, pro: 50, enterprise: -1 };
  const limit = planLimits[userData?.plan || "free"];
  if (limit !== -1 && (count || 0) >= limit) {
    return NextResponse.json({ error: `Limite de ${limit} alertas atingido para o seu plano` }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("alerts")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
