import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("favorites")
    .select("*, product:products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data || []).map((fav: any) => {
    const p = fav.product;
    if (!p) return null;
    return {
      titulo: p.title ?? "",
      preco: p.price ?? 0,
      preco_original: p.original_price ?? "",
      desconto_pct: p.discount ?? 0,
      marketplace: p.marketplace ?? "",
      rating: p.rating ?? 0,
      vendas: p.sales ?? 0,
      score: p.score ?? 0,
      frete_gratis: p.free_shipping ? "Sim" : "Não",
      url: p.url ?? "",
      salvo_em: fav.created_at ? new Date(fav.created_at).toLocaleDateString("pt-BR") : "",
      colecao: fav.collection_name ?? "",
    };
  }).filter(Boolean);

  if (rows.length === 0) {
    const csv = "titulo,preco,marketplace,rating,vendas,score,url\nNenhum favorito encontrado";
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="favoritos.csv"',
      },
    });
  }

  const headers = Object.keys(rows[0]!);
  const escape = (v: any) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv = [
    headers.join(","),
    ...rows.map((row: any) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="favoritos.csv"',
    },
  });
}
