-- ============================================================
-- SEED DATA - Sample products for development
-- ============================================================

INSERT INTO public.products (
  marketplace, external_id, title, slug, description, price, original_price,
  discount, sales, rating, reviews, images, thumbnail, supplier, category,
  tags, score, trend_score, profit_margin, free_shipping, is_dropshipping,
  is_viral, in_promotion, url, currency
) VALUES
(
  'aliexpress', 'AE001', 'Mini Projetor Portátil 4K LED WiFi Bluetooth',
  'mini-projetor-portatil-4k-led-wifi',
  'Projetor portátil com resolução 4K, conectividade WiFi e Bluetooth. Ideal para home theater.',
  45.99, 89.99, 49, 15420, 4.7, 3821,
  ARRAY['https://ae01.alicdn.com/kf/proj1.jpg', 'https://ae01.alicdn.com/kf/proj2.jpg'],
  'https://ae01.alicdn.com/kf/proj1.jpg',
  'TechGadgets Store', 'Eletrônicos',
  ARRAY['projetor', '4k', 'portátil', 'wifi', 'bluetooth', 'cinema'],
  87.5, 92.3, 312.0, TRUE, TRUE, TRUE, TRUE,
  'https://aliexpress.com/item/AE001.html', 'USD'
),
(
  'shopee', 'SH001', 'Luminária LED RGB Gamer com Controle Remoto 16 Cores',
  'luminaria-led-rgb-gamer-controle-remoto',
  'Luminária LED com 16 cores RGB, controle remoto e modo música. Perfeita para setup gamer.',
  12.50, 24.99, 50, 28750, 4.8, 9234,
  ARRAY['https://cf.shopee.com.br/file/led1.jpg', 'https://cf.shopee.com.br/file/led2.jpg'],
  'https://cf.shopee.com.br/file/led1.jpg',
  'GamerShop BR', 'Informática',
  ARRAY['led', 'rgb', 'gamer', 'luminária', 'setup'],
  91.2, 88.7, 180.0, TRUE, TRUE, TRUE, TRUE,
  'https://shopee.com.br/product/SH001', 'BRL'
),
(
  'amazon', 'AMZ001', 'Fone de Ouvido Bluetooth Noise Cancelling Premium',
  'fone-bluetooth-noise-cancelling-premium',
  'Fone com cancelamento ativo de ruído, 40h de bateria e drivers de 40mm.',
  49.90, 149.99, 67, 8932, 4.6, 2156,
  ARRAY['https://m.media-amazon.com/images/fone1.jpg'],
  'https://m.media-amazon.com/images/fone1.jpg',
  'AudioBrand', 'Áudio',
  ARRAY['fone', 'bluetooth', 'noise cancelling', 'premium', 'headphone'],
  78.4, 71.2, 220.0, FALSE, FALSE, FALSE, FALSE,
  'https://amazon.com.br/dp/AMZ001', 'BRL'
),
(
  'aliexpress', 'AE002', 'Smartwatch Fitness Tracker IP68 Monitor Cardíaco GPS',
  'smartwatch-fitness-tracker-ip68-gps',
  'Relógio inteligente com monitor cardíaco, GPS, resistência IP68 e 7 dias de bateria.',
  28.99, 59.99, 52, 45120, 4.5, 12890,
  ARRAY['https://ae01.alicdn.com/kf/watch1.jpg', 'https://ae01.alicdn.com/kf/watch2.jpg'],
  'https://ae01.alicdn.com/kf/watch1.jpg',
  'WearableTech', 'Wearables',
  ARRAY['smartwatch', 'fitness', 'gps', 'ip68', 'monitor cardíaco'],
  84.7, 79.5, 280.0, TRUE, TRUE, TRUE, FALSE,
  'https://aliexpress.com/item/AE002.html', 'USD'
),
(
  'shopee', 'SH002', 'Organizador Mochila Anti-Furto USB Charging Port',
  'mochila-anti-furto-usb-charging',
  'Mochila com fechamento anti-furto, porta USB externa e compartimento para laptop 15.6".',
  35.00, 65.00, 46, 19823, 4.7, 5621,
  ARRAY['https://cf.shopee.com.br/file/moch1.jpg'],
  'https://cf.shopee.com.br/file/moch1.jpg',
  'BagStore', 'Bolsas e Mochilas',
  ARRAY['mochila', 'anti-furto', 'usb', 'notebook', 'viagem'],
  82.1, 85.3, 260.0, FALSE, TRUE, FALSE, TRUE,
  'https://shopee.com.br/product/SH002', 'BRL'
);

-- Seed promotions
INSERT INTO public.promotions (product_id, type, discount, original_price, promo_price, ends_at, is_active)
SELECT
  id, 'flash_sale', discount, original_price, price,
  NOW() + INTERVAL '12 hours', TRUE
FROM products WHERE in_promotion = TRUE;

-- Seed trends
INSERT INTO public.trends (keyword, growth, volume, category, data_points) VALUES
('mini projetor', 145.3, 89420, 'Eletrônicos', '[{"date":"2024-01-01","volume":12000,"growth":50},{"date":"2024-02-01","volume":18000,"growth":80},{"date":"2024-03-01","volume":28000,"growth":145}]'),
('smartwatch barato', 89.7, 234500, 'Wearables', '[{"date":"2024-01-01","volume":50000,"growth":20},{"date":"2024-02-01","volume":78000,"volume":60},{"date":"2024-03-01","volume":120000,"growth":89}]'),
('mochila anti-furto', 67.2, 45200, 'Acessórios', '[{"date":"2024-01-01","volume":8000,"growth":15},{"date":"2024-02-01","volume":15000,"growth":40},{"date":"2024-03-01","volume":22000,"growth":67}]'),
('led rgb gamer', 210.5, 180000, 'Informática', '[{"date":"2024-01-01","volume":25000,"growth":80},{"date":"2024-02-01","volume":55000,"growth":150},{"date":"2024-03-01","volume":120000,"growth":210}]'),
('dropshipping 2024', 320.1, 95000, 'E-commerce', '[{"date":"2024-01-01","volume":15000,"growth":100},{"date":"2024-02-01","volume":40000,"growth":200},{"date":"2024-03-01","volume":80000,"growth":320}]');

-- Record product history
INSERT INTO public.product_history (product_id, price, sales, captured_at)
SELECT id, price * 1.2, sales * 0.8, NOW() - INTERVAL '30 days' FROM products;

INSERT INTO public.product_history (product_id, price, sales, captured_at)
SELECT id, price * 1.1, sales * 0.9, NOW() - INTERVAL '15 days' FROM products;

INSERT INTO public.product_history (product_id, price, sales, captured_at)
SELECT id, price, sales, NOW() FROM products;

-- Refresh materialized views
SELECT refresh_materialized_views();
