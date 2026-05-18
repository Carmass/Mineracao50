-- ============================================================
-- MINERAÇÃO DE PRODUTOS - Initial Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE marketplace_type AS ENUM (
  'aliexpress', 'shopee', 'amazon', 'temu', 'mercadolivre', 'cj', 'alibaba'
);

CREATE TYPE plan_type AS ENUM ('free', 'starter', 'pro', 'enterprise');

CREATE TYPE alert_type AS ENUM (
  'product_viral', 'price_drop', 'product_growing',
  'high_demand', 'low_competition', 'promotion_started'
);

CREATE TYPE ad_platform AS ENUM ('facebook', 'tiktok', 'pinterest', 'instagram');

CREATE TYPE promotion_type AS ENUM (
  'flash_sale', 'coupon', 'cashback', 'progressive_discount', 'seasonal'
);

CREATE TYPE subscription_status AS ENUM (
  'active', 'canceled', 'past_due', 'trialing', 'incomplete'
);

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  plan plan_type NOT NULL DEFAULT 'free',
  credits INTEGER NOT NULL DEFAULT 10,
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan plan_type NOT NULL,
  status subscription_status NOT NULL DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marketplace marketplace_type NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  discount DECIMAL(5, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  sales BIGINT NOT NULL DEFAULT 0,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
  reviews INTEGER NOT NULL DEFAULT 0,
  images TEXT[] NOT NULL DEFAULT '{}',
  thumbnail TEXT,
  supplier TEXT,
  supplier_url TEXT,
  category TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  trend_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  profit_margin DECIMAL(5, 2),
  shipping_cost DECIMAL(10, 2),
  shipping_days INTEGER,
  free_shipping BOOLEAN NOT NULL DEFAULT FALSE,
  country_origin VARCHAR(2),
  is_dropshipping BOOLEAN NOT NULL DEFAULT FALSE,
  is_viral BOOLEAN NOT NULL DEFAULT FALSE,
  in_promotion BOOLEAN NOT NULL DEFAULT FALSE,
  url TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(marketplace, external_id)
);

-- Full text search
ALTER TABLE public.products ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, ''))
  ) STORED;

-- ============================================================
-- PRODUCT HISTORY (price & sales tracking)
-- ============================================================
CREATE TABLE public.product_history (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  sales BIGINT,
  ranking INTEGER,
  score DECIMAL(5, 2),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, captured_at)
) PARTITION BY RANGE (captured_at);

-- Monthly partitions
CREATE TABLE product_history_2026_01 PARTITION OF product_history
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE product_history_2026_05 PARTITION OF product_history
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE product_history_2026_06 PARTITION OF product_history
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE product_history_default PARTITION OF product_history DEFAULT;

-- ============================================================
-- PROMOTIONS
-- ============================================================
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type promotion_type NOT NULL,
  discount DECIMAL(5, 2) NOT NULL,
  original_price DECIMAL(10, 2) NOT NULL,
  promo_price DECIMAL(10, 2) NOT NULL,
  coupon_code TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCT ADS
-- ============================================================
CREATE TABLE public.product_ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  platform ad_platform NOT NULL,
  ad_copy TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  landing_url TEXT,
  engagement BIGINT NOT NULL DEFAULT 0,
  likes BIGINT NOT NULL DEFAULT 0,
  comments BIGINT NOT NULL DEFAULT 0,
  shares BIGINT NOT NULL DEFAULT 0,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRENDS
-- ============================================================
CREATE TABLE public.trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL,
  growth DECIMAL(10, 2) NOT NULL DEFAULT 0,
  volume BIGINT NOT NULL DEFAULT 0,
  category TEXT,
  marketplace marketplace_type,
  data_points JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(keyword, marketplace)
);

-- ============================================================
-- FAVORITES
-- ============================================================
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  collection_name TEXT DEFAULT 'default',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- COLLECTIONS
-- ============================================================
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type alert_type NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  conditions JSONB NOT NULL DEFAULT '{}',
  channels TEXT[] NOT NULL DEFAULT '{email}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SCRAPER JOBS
-- ============================================================
CREATE TABLE public.scraper_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marketplace marketplace_type NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 5,
  payload JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI INSIGHTS
-- ============================================================
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES (Performance critical)
-- ============================================================

-- Products
CREATE INDEX idx_products_marketplace ON products(marketplace);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_score ON products(score DESC);
CREATE INDEX idx_products_sales ON products(sales DESC);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_is_viral ON products(is_viral) WHERE is_viral = TRUE;
CREATE INDEX idx_products_in_promotion ON products(in_promotion) WHERE in_promotion = TRUE;
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_embedding ON products USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_products_marketplace_external ON products(marketplace, external_id);
CREATE INDEX idx_products_composite_filter ON products(marketplace, score DESC, price);

-- Product History
CREATE INDEX idx_product_history_product_id ON product_history(product_id);
CREATE INDEX idx_product_history_captured_at ON product_history(captured_at DESC);

-- Promotions
CREATE INDEX idx_promotions_product_id ON promotions(product_id);
CREATE INDEX idx_promotions_active ON promotions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_promotions_ends_at ON promotions(ends_at);

-- Product Ads
CREATE INDEX idx_product_ads_platform ON product_ads(platform);
CREATE INDEX idx_product_ads_engagement ON product_ads(engagement DESC);

-- Trends
CREATE INDEX idx_trends_growth ON trends(growth DESC);
CREATE INDEX idx_trends_keyword ON trends USING GIN(to_tsvector('portuguese', keyword));

-- Favorites
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_product_id ON favorites(product_id);

-- Alerts
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_active ON alerts(active) WHERE active = TRUE;

-- ============================================================
-- MATERIALIZED VIEWS
-- ============================================================

CREATE MATERIALIZED VIEW mv_top_products AS
  SELECT
    p.*,
    COALESCE(ph_latest.price_7d_ago, p.price) as price_7d_ago,
    ((p.price - COALESCE(ph_latest.price_7d_ago, p.price)) / NULLIF(COALESCE(ph_latest.price_7d_ago, p.price), 0) * 100) as price_change_7d
  FROM products p
  LEFT JOIN LATERAL (
    SELECT price as price_7d_ago
    FROM product_history
    WHERE product_id = p.id
      AND captured_at <= NOW() - INTERVAL '7 days'
    ORDER BY captured_at DESC
    LIMIT 1
  ) ph_latest ON TRUE
  WHERE p.score >= 50
  ORDER BY p.score DESC;

CREATE UNIQUE INDEX ON mv_top_products(id);

CREATE MATERIALIZED VIEW mv_trending_categories AS
  SELECT
    category,
    COUNT(*) as product_count,
    AVG(score) as avg_score,
    SUM(sales) as total_sales,
    AVG(trend_score) as avg_trend_score
  FROM products
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY category
  ORDER BY avg_trend_score DESC;

CREATE UNIQUE INDEX ON mv_trending_categories(category);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_trends_updated_at BEFORE UPDATE ON trends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to calculate opportunity score
CREATE OR REPLACE FUNCTION calculate_opportunity_score(product_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  p products%ROWTYPE;
  score DECIMAL := 0;
BEGIN
  SELECT * INTO p FROM products WHERE id = product_id;

  -- Sales volume (0-20)
  score := score + LEAST(20, (p.sales::DECIMAL / 1000) * 20);

  -- Rating (0-15)
  score := score + (p.rating / 5.0 * 15);

  -- Trend score (0-25)
  score := score + (p.trend_score / 100 * 25);

  -- Price competitiveness (0-15) - lower price = higher score for dropship
  IF p.price < 10 THEN score := score + 15;
  ELSIF p.price < 25 THEN score := score + 10;
  ELSIF p.price < 50 THEN score := score + 5;
  END IF;

  -- Reviews count (0-10)
  score := score + LEAST(10, (p.reviews::DECIMAL / 500) * 10);

  -- Discount (0-15)
  IF p.discount IS NOT NULL THEN
    score := score + LEAST(15, p.discount * 0.5);
  END IF;

  RETURN ROUND(LEAST(100, score), 2);
END;
$$ LANGUAGE plpgsql;

-- Refresh materialized views function
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_products;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_categories;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Products are public to read
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON products FOR SELECT USING (TRUE);
CREATE POLICY "products_service_write" ON products FOR ALL USING (auth.role() = 'service_role');

-- Users can only see their own data
CREATE POLICY "users_own_data" ON users FOR ALL USING (auth.uid() = id);

CREATE POLICY "subscriptions_own" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_own" ON favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "collections_own_write" ON collections
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "collections_public_read" ON collections
  FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "alerts_own" ON alerts
  FOR ALL USING (auth.uid() = user_id);

-- Promotions, Ads, Trends are public
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promotions_public" ON promotions FOR SELECT USING (TRUE);
CREATE POLICY "promotions_service" ON promotions FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.product_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads_public" ON product_ads FOR SELECT USING (TRUE);
CREATE POLICY "ads_service" ON product_ads FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trends_public" ON trends FOR SELECT USING (TRUE);
CREATE POLICY "trends_service" ON trends FOR ALL USING (auth.role() = 'service_role');
