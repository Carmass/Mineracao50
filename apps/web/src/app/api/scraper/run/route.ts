import { NextResponse } from "next/server";
import { load } from "cheerio";
import { createServiceClient } from "@/lib/supabase/server";
import { spawn } from "child_process";
import path from "path";

type ScrapedProduct = {
  title: string;
  price: number;
  original_price: number | null;
  discount_pct: number;
  image_url: string;
  product_url: string;
  marketplace: string;
  marketplace_id: string;
  currency: string;
  sales_count: number;
  rating: number;
  opportunity_score: number;
};

// ──────────────────────────────────────────────────────────────
// Curated product catalog — 50+ products, keyword-aware
// Images: specific Unsplash photo IDs per category (consistent)
// URLs: real marketplace search pages (always work)
// ──────────────────────────────────────────────────────────────

const CATALOG: ScrapedProduct[] = [
  // === SMARTWATCHES / WEARABLES ===
  { title: "Smartwatch HW67 Pro Max 45mm NFC Tela Infinita", price: 89.90, original_price: 179.90, discount_pct: 50, image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=smartwatch+hw67+pro+max+nfc", marketplace: "shopee", marketplace_id: "cat_sw_hw67", currency: "BRL", sales_count: 12400, rating: 4.7, opportunity_score: 88 },
  { title: "Smartwatch W17 Ultra 49mm Série 9 GPS NFC", price: 119.90, original_price: 249.90, discount_pct: 52, image_url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=smartwatch+w17+ultra+serie+9", marketplace: "shopee", marketplace_id: "cat_sw_w17", currency: "BRL", sales_count: 8700, rating: 4.6, opportunity_score: 85 },
  { title: "Smart Band M8 Pro Frequência Cardíaca SpO2", price: 29.90, original_price: 69.90, discount_pct: 57, image_url: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=400&fit=crop", product_url: "https://www.aliexpress.com/wholesale?SearchText=smart+band+m8+pro+heart+rate", marketplace: "aliexpress", marketplace_id: "cat_band_m8", currency: "BRL", sales_count: 28000, rating: 4.6, opportunity_score: 86 },
  { title: "Smartwatch Redondo Ultra Slim AMOLED 1.39\"", price: 79.90, original_price: 169.90, discount_pct: 53, image_url: "https://images.unsplash.com/photo-1617126695498-29b2b3f576ce?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=smartwatch+redondo+ultra+slim+amoled", marketplace: "shopee", marketplace_id: "cat_sw_round", currency: "BRL", sales_count: 6300, rating: 4.5, opportunity_score: 80 },
  { title: "Smart Ring Anel Inteligente Saúde Monitor", price: 15.99, original_price: 39.99, discount_pct: 60, image_url: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400&h=400&fit=crop", product_url: "https://www.aliexpress.com/wholesale?SearchText=smart+ring+health+monitor", marketplace: "aliexpress", marketplace_id: "cat_smart_ring", currency: "USD", sales_count: 15400, rating: 4.4, opportunity_score: 79 },

  // === FONES / AUDIO ===
  { title: "Fone Bluetooth TWS i12 Sem Fio 5.0 Bass", price: 29.90, original_price: 69.90, discount_pct: 57, image_url: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=fone+bluetooth+tws+i12+sem+fio", marketplace: "shopee", marketplace_id: "cat_fone_i12", currency: "BRL", sales_count: 34500, rating: 4.5, opportunity_score: 92 },
  { title: "Wireless Earbuds ANC Cancelamento Ruído TWS", price: 12.99, original_price: 34.99, discount_pct: 63, image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop", product_url: "https://www.aliexpress.com/wholesale?SearchText=wireless+earbuds+anc+noise+cancelling", marketplace: "aliexpress", marketplace_id: "cat_earbuds_anc", currency: "USD", sales_count: 44000, rating: 4.6, opportunity_score: 93 },
  { title: "Fone de Ouvido Gamer RGB USB 7.1 Surround", price: 49.90, original_price: 119.90, discount_pct: 58, image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=fone+gamer+rgb+usb+7.1+surround", marketplace: "shopee", marketplace_id: "cat_fone_gamer", currency: "BRL", sales_count: 9200, rating: 4.6, opportunity_score: 84 },
  { title: "Caixa de Som Bluetooth Portátil 30W IPX7", price: 99.90, original_price: 219.90, discount_pct: 55, image_url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=caixa+de+som+bluetooth+portatil+30w+ipx7", marketplace: "shopee", marketplace_id: "cat_caixa_bt", currency: "BRL", sales_count: 11800, rating: 4.7, opportunity_score: 87 },
  { title: "Mini Speaker Bluetooth LED RGB 10W", price: 6.99, original_price: 18.99, discount_pct: 63, image_url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=400&fit=crop", product_url: "https://www.aliexpress.com/wholesale?SearchText=mini+speaker+bluetooth+rgb+led", marketplace: "aliexpress", marketplace_id: "cat_mini_spk", currency: "USD", sales_count: 32000, rating: 4.4, opportunity_score: 82 },

  // === LED / ILUMINAÇÃO ===
  { title: "LED Strip RGB 5M Bluetooth App Control 12V", price: 8.99, original_price: 24.99, discount_pct: 64, image_url: "https://images.unsplash.com/photo-1558171813-1fcdc2a62157?w=400&h=400&fit=crop", product_url: "https://www.aliexpress.com/wholesale?SearchText=led+strip+rgb+5m+bluetooth+app", marketplace: "aliexpress", marketplace_id: "cat_led_strip", currency: "USD", sales_count: 92000, rating: 4.7, opportunity_score: 95 },
  { title: "Lâmpada LED Inteligente RGB WiFi Alexa 15W", price: 39.90, original_price: 89.90, discount_pct: 56, image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=lampada+led+inteligente+rgb+wifi+alexa", marketplace: "shopee", marketplace_id: "cat_lampada_led", currency: "BRL", sales_count: 18300, rating: 4.6, opportunity_score: 88 },
  { title: "Painel LED Hexagonal RGB Controle Remoto", price: 49.90, original_price: 129.90, discount_pct: 62, image_url: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=painel+led+hexagonal+rgb+controle", marketplace: "shopee", marketplace_id: "cat_led_hex", currency: "BRL", sales_count: 7600, rating: 4.7, opportunity_score: 86 },
  { title: "LED Neon Flex Bendable Strip 12V 5M Rosa", price: 7.49, original_price: 19.99, discount_pct: 63, image_url: "https://images.unsplash.com/photo-1603539947678-cd3954ed515d?w=400&h=400&fit=crop", product_url: "https://www.aliexpress.com/wholesale?SearchText=neon+flex+led+strip+bendable+pink", marketplace: "aliexpress", marketplace_id: "cat_neon_flex", currency: "USD", sales_count: 41000, rating: 4.5, opportunity_score: 83 },

  // === GADGETS CASA / SMART HOME ===
  { title: "Smart Plug WiFi Tomada Inteligente Alexa Google", price: 39.90, original_price: 89.90, discount_pct: 56, image_url: "https://images.unsplash.com/photo-1558089687-f282ffcbc0d3?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=smart+plug+wifi+tomada+alexa+google", marketplace: "shopee", marketplace_id: "cat_smartplug", currency: "BRL", sales_count: 9800, rating: 4.4, opportunity_score: 80 },
  { title: "Câmera IP WiFi 1080p Visão Noturna Interno", price: 69.90, original_price: 139.90, discount_pct: 50, image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=camera+ip+wifi+1080p+visao+noturna", marketplace: "shopee", marketplace_id: "cat_camera_ip", currency: "BRL", sales_count: 5600, rating: 4.4, opportunity_score: 76 },
  { title: "Fechadura Digital Biométrica WiFi Smart Lock", price: 299.90, original_price: 599.90, discount_pct: 50, image_url: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=fechadura+digital+biometrica+wifi+smart", marketplace: "shopee", marketplace_id: "cat_fechadura_dig", currency: "BRL", sales_count: 3100, rating: 4.5, opportunity_score: 75 },
  { title: "Aspirador de Pó Robô WiFi LiDAR Auto-Dock", price: 299.90, original_price: 699.90, discount_pct: 57, image_url: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=aspirador+robo+wifi+lidar+auto+dock", marketplace: "shopee", marketplace_id: "cat_robo_aspirador", currency: "BRL", sales_count: 3400, rating: 4.5, opportunity_score: 77 },
  { title: "Umidificador Ultrassônico LED 5L Silencioso", price: 89.90, original_price: 189.90, discount_pct: 53, image_url: "https://images.unsplash.com/photo-1631209121426-f8012b37a1f2?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=umidificador+ultrassonico+led+5l+silencioso", marketplace: "shopee", marketplace_id: "cat_umidif", currency: "BRL", sales_count: 4500, rating: 4.5, opportunity_score: 78 },

  // === CARREGADORES / ACESSÓRIOS ===
  { title: "Carregador Rápido 65W GaN USB-C 3 Portas", price: 49.90, original_price: 119.90, discount_pct: 58, image_url: "https://images.unsplash.com/photo-1609592806596-bb2a75c71e5e?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=carregador+65w+gan+usb-c+3+portas", marketplace: "shopee", marketplace_id: "cat_carregador_65w", currency: "BRL", sales_count: 7800, rating: 4.8, opportunity_score: 90 },
  { title: "Power Bank 20000mAh 22.5W Display LED", price: 79.90, original_price: 159.90, discount_pct: 50, image_url: "https://images.unsplash.com/photo-1625840016340-85e90c0e55ce?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=power+bank+20000mah+22.5w+display+led", marketplace: "shopee", marketplace_id: "cat_powerbank", currency: "BRL", sales_count: 11200, rating: 4.5, opportunity_score: 87 },
  { title: "Cabo USB-C 100W 5A Fast Charge 2m Nylon", price: 19.90, original_price: 49.90, discount_pct: 60, image_url: "https://images.unsplash.com/photo-1601999009162-2459b78386a8?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=cabo+usb-c+100w+5a+fast+charge+nylon", marketplace: "shopee", marketplace_id: "cat_cabo_usbc", currency: "BRL", sales_count: 22000, rating: 4.6, opportunity_score: 85 },
  { title: "Carregador Sem Fio MagSafe 15W iPhone", price: 34.90, original_price: 79.90, discount_pct: 56, image_url: "https://images.unsplash.com/photo-1618842676088-c4d48a6a7571?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=carregador+sem+fio+magsafe+15w+iphone", marketplace: "shopee", marketplace_id: "cat_magsafe_15w", currency: "BRL", sales_count: 8600, rating: 4.7, opportunity_score: 83 },

  // === SUPORTES / CELULAR ===
  { title: "Suporte Celular Carro Magnético 360° Universal", price: 19.90, original_price: 49.90, discount_pct: 60, image_url: "https://images.unsplash.com/photo-1586993451228-09813e5f1959?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=suporte+celular+carro+magnetico+360", marketplace: "shopee", marketplace_id: "cat_suporte_carro", currency: "BRL", sales_count: 8900, rating: 4.6, opportunity_score: 82 },
  { title: "Capa MagSafe iPhone 15 Pro Transparente Anti-Impacto", price: 34.90, original_price: 79.90, discount_pct: 56, image_url: "https://images.unsplash.com/photo-1601972599748-31622e30a0dd?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=capa+magsafe+iphone+15+pro+transparente", marketplace: "shopee", marketplace_id: "cat_capa_ip15", currency: "BRL", sales_count: 6200, rating: 4.7, opportunity_score: 83 },
  { title: "Suporte Tripé Mesa Câmera Selfie 1.7m Flexível", price: 39.90, original_price: 89.90, discount_pct: 56, image_url: "https://images.unsplash.com/photo-1619961602105-16fa2a5465c1?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=suporte+tripe+mesa+camera+selfie+flexivel", marketplace: "shopee", marketplace_id: "cat_tripe_selfie", currency: "BRL", sales_count: 4700, rating: 4.5, opportunity_score: 76 },

  // === DRONE / CÂMERA ===
  { title: "Mini Drone Dobrável Câmera 4K GPS Brushless", price: 39.99, original_price: 89.99, discount_pct: 56, image_url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=400&fit=crop", product_url: "https://www.aliexpress.com/wholesale?SearchText=mini+drone+4k+gps+brushless+foldable", marketplace: "aliexpress", marketplace_id: "cat_drone_4k", currency: "USD", sales_count: 15000, rating: 4.5, opportunity_score: 84 },
  { title: "Câmera de Ação 4K 60fps EIS WiFi Esportes", price: 89.90, original_price: 199.90, discount_pct: 55, image_url: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=camera+acao+4k+60fps+eis+wifi+esportes", marketplace: "shopee", marketplace_id: "cat_cam_acao", currency: "BRL", sales_count: 5200, rating: 4.6, opportunity_score: 80 },

  // === BELEZA / SAÚDE ===
  { title: "Massageador Ocular Shiatsu Aquecimento Bluetooth", price: 24.90, original_price: 59.90, discount_pct: 58, image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=massageador+ocular+shiatsu+aquecimento", marketplace: "shopee", marketplace_id: "cat_massageador_oc", currency: "BRL", sales_count: 4300, rating: 4.6, opportunity_score: 79 },
  { title: "Escova Elétrica Rotativa Limpeza Facial 4 Cabeças", price: 44.90, original_price: 99.90, discount_pct: 55, image_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=escova+eletrica+limpeza+facial+4+cabecas", marketplace: "shopee", marketplace_id: "cat_escova_facial", currency: "BRL", sales_count: 7500, rating: 4.6, opportunity_score: 81 },
  { title: "Chapinha Cabelo Titanium Profissional 450°F 3D", price: 79.90, original_price: 199.90, discount_pct: 60, image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=chapinha+titanium+profissional+450+cabelo", marketplace: "shopee", marketplace_id: "cat_chapinha_tit", currency: "BRL", sales_count: 13500, rating: 4.7, opportunity_score: 89 },
  { title: "Depilador a Laser IPL 500000 Pulsos Indolor", price: 49.99, original_price: 129.99, discount_pct: 62, image_url: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400&h=400&fit=crop", product_url: "https://www.aliexpress.com/wholesale?SearchText=ipl+laser+hair+removal+500000+pulses", marketplace: "aliexpress", marketplace_id: "cat_ipl_laser", currency: "USD", sales_count: 31000, rating: 4.5, opportunity_score: 88 },
  { title: "Massageador Elétrico Pescoço Coluna Vibração", price: 59.90, original_price: 129.90, discount_pct: 54, image_url: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=massageador+eletrico+pescoco+coluna+vibracao", marketplace: "shopee", marketplace_id: "cat_massageador_pc", currency: "BRL", sales_count: 6800, rating: 4.5, opportunity_score: 80 },

  // === GAMER / PC ===
  { title: "Teclado Mecânico Gamer RGB 60% Hot-Swap TKL", price: 149.90, original_price: 299.90, discount_pct: 50, image_url: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=teclado+mecanico+gamer+rgb+60+hot+swap", marketplace: "shopee", marketplace_id: "cat_teclado_mec", currency: "BRL", sales_count: 4100, rating: 4.7, opportunity_score: 85 },
  { title: "Mouse Gamer RGB 16000 DPI Ergonômico 7 Botões", price: 59.90, original_price: 129.90, discount_pct: 54, image_url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=mouse+gamer+rgb+16000+dpi+ergonomico", marketplace: "shopee", marketplace_id: "cat_mouse_gamer", currency: "BRL", sales_count: 6700, rating: 4.6, opportunity_score: 82 },
  { title: "Ring Light 10 Polegadas LED 3 Cores + Tripé", price: 89.90, original_price: 199.90, discount_pct: 55, image_url: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=ring+light+10+polegadas+led+3+cores+tripe", marketplace: "shopee", marketplace_id: "cat_ringlight_10", currency: "BRL", sales_count: 3200, rating: 4.5, opportunity_score: 74 },
  { title: "Controle PS5 DualSense Haptic Feedback", price: 289.90, original_price: 499.90, discount_pct: 42, image_url: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=controle+ps5+dualsense+haptic+feedback", marketplace: "shopee", marketplace_id: "cat_controle_ps5", currency: "BRL", sales_count: 8900, rating: 4.8, opportunity_score: 87 },
  { title: "SSD NVMe M.2 1TB 7000MB/s PCIe 4.0 Gamer", price: 19.99, original_price: 49.99, discount_pct: 60, image_url: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=400&fit=crop", product_url: "https://www.aliexpress.com/wholesale?SearchText=ssd+nvme+m2+1tb+7000mbs+pcie+4", marketplace: "aliexpress", marketplace_id: "cat_ssd_nvme", currency: "USD", sales_count: 22000, rating: 4.6, opportunity_score: 83 },

  // === FITNESS / ESPORTES ===
  { title: "Corda de Pular Speed Rope Rolamento Crossfit", price: 29.90, original_price: 69.90, discount_pct: 57, image_url: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=corda+pular+speed+rope+rolamento+crossfit", marketplace: "shopee", marketplace_id: "cat_speed_rope", currency: "BRL", sales_count: 9400, rating: 4.7, opportunity_score: 82 },
  { title: "Garrafa Térmica 1L Inox Aço 24h Frio/Quente", price: 49.90, original_price: 119.90, discount_pct: 58, image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=garrafa+termica+1l+inox+24h+frio+quente", marketplace: "shopee", marketplace_id: "cat_garrafa_inox", currency: "BRL", sales_count: 14700, rating: 4.7, opportunity_score: 87 },
  { title: "Elástico Resistência Musculação Kit 5 Níveis", price: 39.90, original_price: 89.90, discount_pct: 56, image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=elastico+resistencia+musculacao+kit+5+niveis", marketplace: "shopee", marketplace_id: "cat_elastico_res", currency: "BRL", sales_count: 12300, rating: 4.6, opportunity_score: 84 },

  // === ORGANIZAÇÃO / CASA ===
  { title: "Organizador Gaveta Modular Ajustável Plástico", price: 24.90, original_price: 59.90, discount_pct: 58, image_url: "https://images.unsplash.com/photo-1558997519-83ea9252edc8?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=organizador+gaveta+modular+ajustavel+plastico", marketplace: "shopee", marketplace_id: "cat_org_gaveta", currency: "BRL", sales_count: 18900, rating: 4.7, opportunity_score: 85 },
  { title: "Vacuum Sealer Seladora Vácuo Alimentos 220V", price: 89.90, original_price: 199.90, discount_pct: 55, image_url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=seladora+vacuo+alimentos+220v+vacuum+sealer", marketplace: "shopee", marketplace_id: "cat_seladora", currency: "BRL", sales_count: 5600, rating: 4.5, opportunity_score: 77 },
  { title: "Compressor de Ar Digital Portátil Pneu USB-C", price: 59.90, original_price: 129.90, discount_pct: 54, image_url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=compressor+ar+digital+portatil+pneu+usb-c", marketplace: "shopee", marketplace_id: "cat_compressor_ar", currency: "BRL", sales_count: 7200, rating: 4.6, opportunity_score: 81 },

  // === IMPRESSÃO / DIGITAL ===
  { title: "Impressora Foto Portátil Bluetooth Zink Sem Tinta", price: 129.90, original_price: 279.90, discount_pct: 54, image_url: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400&h=400&fit=crop", product_url: "https://www.aliexpress.com/wholesale?SearchText=portable+photo+printer+bluetooth+zink+no+ink", marketplace: "aliexpress", marketplace_id: "cat_impressora_foto", currency: "BRL", sales_count: 2800, rating: 4.4, opportunity_score: 72 },
  { title: "Caneta 3D Impressão Filamento PLA/ABS 2 Cores", price: 49.90, original_price: 119.90, discount_pct: 58, image_url: "https://images.unsplash.com/photo-1612392160052-31534a6b9ea5?w=400&h=400&fit=crop", product_url: "https://www.aliexpress.com/wholesale?SearchText=3d+printing+pen+pla+abs+filament", marketplace: "aliexpress", marketplace_id: "cat_caneta_3d", currency: "BRL", sales_count: 3600, rating: 4.4, opportunity_score: 71 },

  // === PETS ===
  { title: "Comedouro Automático Pet WiFi 5L Com Camera", price: 149.90, original_price: 329.90, discount_pct: 55, image_url: "https://images.unsplash.com/photo-1601758174493-4eea4b8ef0b7?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=comedouro+automatico+pet+wifi+5l+camera", marketplace: "shopee", marketplace_id: "cat_comedouro_pet", currency: "BRL", sales_count: 3100, rating: 4.5, opportunity_score: 73 },
  { title: "GPS Tracker Pet Rastreador Cão Gato Tempo Real", price: 39.99, original_price: 99.99, discount_pct: 60, image_url: "https://images.unsplash.com/photo-1514984879728-be0aff75a6e8?w=400&h=400&fit=crop", product_url: "https://www.aliexpress.com/wholesale?SearchText=gps+tracker+pet+dog+cat+real+time", marketplace: "aliexpress", marketplace_id: "cat_gps_pet", currency: "USD", sales_count: 8700, rating: 4.4, opportunity_score: 78 },

  // === KIDS / EDUCAÇÃO ===
  { title: "Projetor Estrelado Galaxy Bluetooth LED Quarto", price: 59.90, original_price: 139.90, discount_pct: 57, image_url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=400&fit=crop", product_url: "https://shopee.com.br/search?keyword=projetor+estrelado+galaxy+bluetooth+led+quarto", marketplace: "shopee", marketplace_id: "cat_projetor_gal", currency: "BRL", sales_count: 6400, rating: 4.7, opportunity_score: 82 },
  { title: "Robô Educacional Programável Bluetooth Crianças", price: 34.99, original_price: 89.99, discount_pct: 61, image_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop", product_url: "https://www.aliexpress.com/wholesale?SearchText=educational+robot+programmable+bluetooth+kids", marketplace: "aliexpress", marketplace_id: "cat_robo_edu", currency: "USD", sales_count: 9200, rating: 4.5, opportunity_score: 79 },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  smartwatch: ["smartwatch", "watch", "relógio", "relogio", "wearable", "band", "smart ring"],
  audio: ["fone", "earbuds", "headphone", "bluetooth", "speaker", "caixa", "som", "áudio", "audio"],
  led: ["led", "strip", "tira", "neon", "rgb", "iluminação", "iluminacao", "lâmpada", "lampada"],
  home: ["câmera", "camera", "smart home", "aspirador", "plug", "tomada", "fechadura", "umidificador"],
  charging: ["carregador", "power bank", "cabo", "usb", "carga", "carregamento"],
  gamer: ["gamer", "gaming", "teclado", "mouse", "controle", "game", "pc", "ssd"],
  beauty: ["chapinha", "massageador", "laser", "beleza", "escova", "depilador", "cabelo"],
  fitness: ["fitness", "academia", "crossfit", "corda", "elástico", "elastico", "garrafa", "esporte"],
  drone: ["drone", "câmera de ação", "camera acao", "gopro", "ação", "video"],
  pet: ["pet", "cachorro", "gato", "dog", "cat", "animal"],
};

function getRelevantProducts(keyword: string): ScrapedProduct[] {
  const kw = keyword.toLowerCase();

  // Find matching category
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some(w => kw.includes(w) || w.includes(kw))) {
      const catMap: Record<string, string[]> = {
        smartwatch: ["smartwatch", "band", "ring"],
        audio: ["fone", "earbuds", "speaker", "caixa"],
        led: ["led", "neon", "lampada", "lâmpada"],
        home: ["camera", "plug", "aspirador", "fechadura", "umidificador"],
        charging: ["carregador", "power bank", "cabo", "magsafe"],
        gamer: ["teclado", "mouse", "ring light", "ps5", "ssd"],
        beauty: ["massageador", "escova", "chapinha", "laser"],
        fitness: ["corda", "garrafa", "elástico", "elastico"],
        drone: ["drone", "câmera", "camera"],
        pet: ["pet", "gps"],
      };
      const titleWords = catMap[cat] ?? [];
      const catProducts = CATALOG.filter(p =>
        titleWords.some(w => p.title.toLowerCase().includes(w))
      );
      if (catProducts.length >= 5) return catProducts;
    }
  }

  // Generic keyword match
  const matches = CATALOG.filter(p => p.title.toLowerCase().includes(kw));
  if (matches.length >= 3) return matches;

  // Return all shuffled (for generic searches like "produtos")
  return [...CATALOG].sort(() => Math.random() - 0.5).slice(0, 20);
}

// ──────────────────────────────────────────────────────────────
// Python scraper runner
// Order: scrape_mercadolivre.py → scrape_bs4.py → scrape_now.py
// ──────────────────────────────────────────────────────────────

async function runScript(pythonBin: string, script: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(pythonBin, [script, ...args], { timeout: 45000, env: { ...process.env } });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) => {
      if (code === 0 && stdout.trim()) resolve(stdout.trim());
      else reject(new Error(stderr || `exit ${code}`));
    });
    proc.on("error", reject);
  });
}

async function runPythonScraper(keyword: string, limit: number = 25): Promise<{ products: ScrapedProduct[]; source: string } | null> {
  const scraperDir = path.join(process.cwd(), "..", "..", "scrapers");
  const limitStr = String(Math.min(limit, 50));

  const scripts: Array<{ file: string; args: string[]; source: string }> = [
    {
      file: path.join(scraperDir, "scrape_mercadolivre.py"),
      args: ["--keyword", keyword, "--limit", limitStr, "--no-save"],
      source: "mercadolivre",
    },
    {
      file: path.join(scraperDir, "scrape_aliexpress_affiliate.py"),
      args: ["--keyword", keyword, "--limit", limitStr, "--no-save"],
      source: "aliexpress_affiliate",
    },
    {
      file: path.join(scraperDir, "scrape_bs4.py"),
      args: ["--keyword", keyword, "--limit", limitStr, "--no-save"],
      source: "python",
    },
    {
      file: path.join(scraperDir, "scrape_now.py"),
      args: ["--keyword", keyword, "--limit", limitStr, "--no-save"],
      source: "python",
    },
  ];

  for (const { file, args, source } of scripts) {
    for (const pythonBin of ["python", "python3"]) {
      try {
        const result = await runScript(pythonBin, file, args);
        const parsed = JSON.parse(result);
        if (parsed.success && Array.isArray(parsed.products) && parsed.products.length > 0) {
          return { products: parsed.products as ScrapedProduct[], source };
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// JS scrapers (Shopee + AliExpress) — may be blocked
// ──────────────────────────────────────────────────────────────

const STEALTH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
};

async function fetchShopee(keyword: string): Promise<ScrapedProduct[]> {
  const url = `https://shopee.com.br/api/v4/search/search_items?by=sales&keyword=${encodeURIComponent(keyword)}&limit=20&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`;
  try {
    const res = await fetch(url, {
      headers: { ...STEALTH_HEADERS, "Referer": `https://shopee.com.br/search?keyword=${encodeURIComponent(keyword)}`, "x-api-source": "pc", "x-shopee-language": "pt-BR", "x-csrftoken": "none" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items = json?.items ?? [];
    return items.filter((i: any) => i?.item_basic).map((item: any) => {
      const b = item.item_basic;
      const price = (b.price ?? 0) / 100000;
      const originalPrice = b.price_before_discount ? b.price_before_discount / 100000 : null;
      const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
      const sales = b.sold ?? b.historical_sold ?? 0;
      const rating = b.item_rating?.rating_star ?? 0;
      const slug = (b.name ?? "produto").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
      const imageHash = b.image ?? "";
      const imageUrl = imageHash
        ? `https://down-br.img.susercontent.com/file/${imageHash}`
        : "";
      return {
        title: b.name ?? "Produto Shopee",
        price: Math.round(price * 100) / 100,
        original_price: originalPrice ? Math.round(originalPrice * 100) / 100 : null,
        discount_pct: discount,
        image_url: imageUrl,
        product_url: `https://shopee.com.br/${slug}-i.${b.shopid}.${b.itemid}`,
        marketplace: "shopee",
        marketplace_id: `shopee_${b.itemid}`,
        currency: "BRL",
        sales_count: sales,
        rating: Math.round(rating * 10) / 10,
        opportunity_score: Math.min(100, Math.round((sales / 100) * 0.4 + discount * 0.3 + rating * 6 + 10)),
      } satisfies ScrapedProduct;
    });
  } catch { return []; }
}

async function fetchAliExpress(keyword: string): Promise<ScrapedProduct[]> {
  const url = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(keyword)}&SortType=total_tranpro_desc`;
  try {
    const res = await fetch(url, { headers: STEALTH_HEADERS, signal: AbortSignal.timeout(20000) });
    if (!res.ok) return [];
    const html = await res.text();
    const dataMatch = html.match(/window\.__runParams__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/);
    if (dataMatch) {
      try {
        const data = JSON.parse(dataMatch[1]);
        const items: any[] = data?.data?.root?.fields?.mods?.itemList?.content ?? [];
        return items.slice(0, 20).map((item: any) => {
          const price = parseFloat(item?.prices?.salePrice?.minPrice ?? "0");
          const originalPrice = parseFloat(item?.prices?.originalPrice?.minPrice ?? "0") || null;
          const discount = originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
          const sales = parseInt(item?.trade?.realTradedCount ?? "0") || 0;
          const productId = item?.productId ?? item?.itemId ?? null;
          const productUrl = productId
            ? `https://www.aliexpress.com/item/${productId}.html`
            : item?.title?.detailUrl
            ? `https:${item.title.detailUrl}`
            : `https://pt.aliexpress.com/w/wholesale-${encodeURIComponent(keyword)}.html`;
          return {
            title: item?.title?.displayTitle ?? "Produto AliExpress",
            price, original_price: originalPrice, discount_pct: discount,
            image_url: item?.image?.imgUrl ? `https:${item.image.imgUrl}` : "",
            product_url: productUrl,
            marketplace: "aliexpress", marketplace_id: `ali_${productId ?? Date.now()}`,
            currency: "USD", sales_count: sales, rating: parseFloat(item?.evaluation?.starRating ?? "0"),
            opportunity_score: Math.min(100, Math.round((sales / 1000) * 30 + discount * 0.4 + 15)),
          } satisfies ScrapedProduct;
        });
      } catch { /* fall through */ }
    }
    const $ = load(html);
    const products: ScrapedProduct[] = [];
    $("[class*='product-card'], [class*='item-list'] [class*='item']").each((i, el) => {
      if (i >= 20) return false;
      const title = $(el).find("[class*='title']").first().text().trim();
      const price = parseFloat($(el).find("[class*='price']").first().text().replace(/[^0-9.]/g, "")) || 0;
      const img = $(el).find("img").attr("src") ?? "";
      const href = $(el).find("a").attr("href") ?? "";
      const aliId = href.match(/\/item\/(\d+)\.html/)?.[1] ?? null;
      const aliUrl = aliId
        ? `https://www.aliexpress.com/item/${aliId}.html`
        : `https://pt.aliexpress.com/w/wholesale-${encodeURIComponent(keyword)}.html`;
      if (title && price > 0) products.push({ title, price, original_price: null, discount_pct: 0, image_url: img.startsWith("//") ? `https:${img}` : img, product_url: aliUrl, marketplace: "aliexpress", marketplace_id: aliId ? `ali_${aliId}` : `ali_html_${i}_${Date.now()}`, currency: "USD", sales_count: 0, rating: 0, opportunity_score: 10 });
    });
    return products;
  } catch { return []; }
}

// ──────────────────────────────────────────────────────────────
// Persist to Supabase
// ──────────────────────────────────────────────────────────────

function makeSlug(title: string, id: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60) + "-" + id.slice(-6);
}

async function saveProducts(products: ScrapedProduct[], supabase: Awaited<ReturnType<typeof createServiceClient>>) {
  if (products.length === 0) return 0;
  const rows = products.map((p) => ({
    external_id: p.marketplace_id,
    marketplace: p.marketplace,
    title: p.title,
    slug: makeSlug(p.title, p.marketplace_id),
    price: p.price,
    original_price: p.original_price,
    discount: p.discount_pct,
    currency: p.currency,
    sales: p.sales_count,
    rating: Math.min(5, p.rating),
    thumbnail: p.image_url,
    images: p.image_url ? [p.image_url] : [],
    url: p.product_url,
    category: "geral",
    tags: [],
    score: p.opportunity_score,
    trend_score: Math.min(100, p.opportunity_score * 0.9),
    metadata: {},
  }));

  const { data, error } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "marketplace,external_id", ignoreDuplicates: false })
    .select("id");

  if (error) { console.error("Supabase upsert error:", error.message); return 0; }
  return data?.length ?? 0;
}

// ──────────────────────────────────────────────────────────────
// POST /api/scraper/run
// ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const authClient = await createServiceClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const rawKeyword = String(body.keyword ?? "smartwatch").slice(0, 100).replace(/[^a-zA-Z0-9 áéíóúàèìòùâêîôûãõçñüÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇÑÜ+\-_.]/g, "");
    const keyword = rawKeyword.trim() || "smartwatch";
    const limit = Math.min(Math.max(parseInt(body.limit) || 20, 10), 60);
    const forceFallback = body.force_fallback === true;

    let all: ScrapedProduct[] = [];
    let source = "catalog";

    if (!forceFallback) {
      // 1. Try Python scrapers (ML API first, then curl-cffi scrapers)
      const pythonResult = await runPythonScraper(keyword, limit);
      if (pythonResult && pythonResult.products.length > 0) {
        all = pythonResult.products;
        source = pythonResult.source;
      }

      // 2. Try JS scrapers (Shopee + AliExpress)
      if (all.length === 0) {
        const [shopeeRes, aliRes] = await Promise.allSettled([fetchShopee(keyword), fetchAliExpress(keyword)]);
        all = [
          ...(shopeeRes.status === "fulfilled" ? shopeeRes.value : []),
          ...(aliRes.status === "fulfilled" ? aliRes.value : []),
        ];
        if (all.length > 0) source = "js";
      }
    }

    // 3. Always fall back to curated catalog if scrapers returned nothing
    const usedFallback = all.length === 0;
    if (usedFallback) {
      all = getRelevantProducts(keyword).slice(0, limit);
      source = "catalog";
    }

    const supabase = await createServiceClient();
    const saved = await saveProducts(all, supabase);

    return NextResponse.json({
      success: true,
      fetched: all.length,
      saved,
      source,
      used_fallback: usedFallback,
      breakdown: {
        aliexpress: all.filter(p => p.marketplace === "aliexpress").length,
        mercadolivre: all.filter(p => p.marketplace === "mercadolivre").length,
        shopee: all.filter(p => p.marketplace === "shopee").length,
        catalog: usedFallback ? all.length : 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
