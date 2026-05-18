import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { product_id, type = "insight" } = await req.json();

    // Get product data
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", product_id)
      .single();

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), { status: 404, headers: corsHeaders });
    }

    const prompts: Record<string, string> = {
      insight: `Analise este produto de e-commerce e gere insights de negócio em português brasileiro:

        Produto: ${product.title}
        Marketplace: ${product.marketplace}
        Preço: $${product.price}
        Vendas: ${product.sales}
        Avaliação: ${product.rating}/5
        Score de Oportunidade: ${product.score}/100
        Trend Score: ${product.trend_score}/100

        Forneça: 1) Análise de oportunidade, 2) Estratégia de preço, 3) Potencial de nicho, 4) Riscos. Seja conciso (máx 200 palavras).`,

      title_seo: `Crie 5 títulos SEO otimizados para este produto em português:
        "${product.title}"

        Regras: keywords relevantes, até 80 chars, focado em conversão, sem caps excessivo.`,

      ad_copy: `Crie 3 variações de copy para anúncio Facebook/Instagram deste produto em português:
        "${product.title}" - R$${product.price}

        Formato: Gancho + Benefício + CTA. Máx 125 chars por variação.`,
    };

    const prompt = prompts[type] || prompts.insight;

    const openaiRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um especialista em e-commerce, dropshipping e marketing digital no Brasil." },
          { role: "user", content: prompt },
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    const openaiData = await openaiRes.json();
    const content = openaiData.choices?.[0]?.message?.content || "";

    // Save insight to DB
    await supabase.from("ai_insights").insert({
      product_id,
      insight_type: type,
      content,
      metadata: { model: "gpt-4o-mini", user_id: user.id },
    });

    return new Response(
      JSON.stringify({ content, type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
