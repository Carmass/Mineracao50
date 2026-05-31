import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "20"), 100);
  const from = (page - 1) * perPage;
  const platform = searchParams.get("platform");

  let query = supabase
    .from("product_ads")
    .select("*, product:products(id,title,thumbnail,marketplace,price,score)", { count: "exact" })
    .eq("is_active", true)
    .order("engagement", { ascending: false })
    .range(from, from + perPage - 1);

  if (platform) query = query.eq("platform", platform);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If DB is empty, return curated mock ads so the page is never blank
  const ads = data && data.length > 0 ? data : getMockAds();
  const total = count || ads.length;
  const totalPages = Math.ceil(total / perPage);

  return NextResponse.json({
    data: ads,
    total,
    page,
    per_page: perPage,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1,
  });
}

function getMockAds() {
  return [
    { id: "m1", platform: "facebook", product: null, ad_copy: "🔥 Transforme qualquer parede em cinema! Mini Projetor 4K WiFi — de R$899 por apenas R$249. Frete grátis! ✅", thumbnail_url: "https://images.unsplash.com/photo-1478416272538-5f7e51dc5400?w=400&h=300&fit=crop", landing_url: "https://shopee.com.br/search?keyword=mini+projetor+4k", engagement: 245000, likes: 18500, comments: 3200, shares: 8900, is_active: true, first_seen_at: "2025-01-15", last_seen_at: new Date().toISOString() },
    { id: "m2", platform: "tiktok", product: null, ad_copy: "Setup dos sonhos por menos de R$50! LED RGB que muda sua vida 🎮✨ Link na bio com desconto exclusivo!", thumbnail_url: "https://images.unsplash.com/photo-1558171813-1fcdc2a62157?w=400&h=300&fit=crop", landing_url: "https://shopee.com.br/search?keyword=led+rgb+gamer", engagement: 892000, likes: 67000, comments: 12400, shares: 34500, is_active: true, first_seen_at: "2025-01-20", last_seen_at: new Date().toISOString() },
    { id: "m3", platform: "instagram", product: null, ad_copy: "Cuide da sua saúde com estilo 💪⌚ Smartwatch com GPS, Monitor Cardíaco e 7 dias de bateria. Só R$189!", thumbnail_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop", landing_url: "https://shopee.com.br/search?keyword=smartwatch+fitness", engagement: 134000, likes: 9800, comments: 1560, shares: 4200, is_active: true, first_seen_at: "2025-01-18", last_seen_at: new Date().toISOString() },
    { id: "m4", platform: "facebook", product: null, ad_copy: "Viaje com segurança! Mochila com cadeado embutido + porta USB + espaço para notebook. Já são +50.000 felizes! 🎒", thumbnail_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop", landing_url: "https://shopee.com.br/search?keyword=mochila+anti+furto+usb", engagement: 178000, likes: 14200, comments: 2890, shares: 6700, is_active: true, first_seen_at: "2025-01-12", last_seen_at: new Date().toISOString() },
    { id: "m5", platform: "tiktok", product: null, ad_copy: "Fone que cancela TODO o barulho por R$35?! Sim, existe 😱 ANC real + qualidade premium. Aproveita antes que acabar!", thumbnail_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=300&fit=crop", landing_url: "https://www.aliexpress.com/wholesale?SearchText=earbuds+anc", engagement: 620000, likes: 48000, comments: 9200, shares: 21000, is_active: true, first_seen_at: "2025-02-01", last_seen_at: new Date().toISOString() },
    { id: "m6", platform: "pinterest", product: null, ad_copy: "Sua pele radiante com a escova de limpeza elétrica que o mercado não quer que você conheça ✨ 3x mais eficiente", thumbnail_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop", landing_url: "https://shopee.com.br/search?keyword=escova+limpeza+facial+eletrica", engagement: 89000, likes: 7200, comments: 890, shares: 3400, is_active: true, first_seen_at: "2025-02-05", last_seen_at: new Date().toISOString() },
    { id: "m7", platform: "instagram", product: null, ad_copy: "O drone que está esgotando em toda parte 🚁📸 Câmera 4K, GPS, retorno automático. 56% OFF hoje só!", thumbnail_url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop", landing_url: "https://www.aliexpress.com/wholesale?SearchText=mini+drone+4k+gps", engagement: 302000, likes: 23400, comments: 4100, shares: 11200, is_active: true, first_seen_at: "2025-02-10", last_seen_at: new Date().toISOString() },
    { id: "m8", platform: "facebook", product: null, ad_copy: "Power Bank 20000mAh por R$79? Carregou meu celular 6x seguidas 🔋 Corre — só 500 unidades no estoque!", thumbnail_url: "https://images.unsplash.com/photo-1625840016340-85e90c0e55ce?w=400&h=300&fit=crop", landing_url: "https://shopee.com.br/search?keyword=power+bank+20000mah", engagement: 156000, likes: 12000, comments: 2300, shares: 5800, is_active: true, first_seen_at: "2025-02-15", last_seen_at: new Date().toISOString() },
  ];
}
