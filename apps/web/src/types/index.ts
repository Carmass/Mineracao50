// ============================================================
// Core Domain Types
// ============================================================

export type Marketplace = "aliexpress" | "shopee" | "amazon" | "temu" | "mercadolivre" | "cj" | "alibaba";

export type Plan = "free" | "starter" | "pro" | "enterprise";

export type AlertType =
  | "product_viral"
  | "price_drop"
  | "product_growing"
  | "high_demand"
  | "low_competition"
  | "promotion_started";

export type AdPlatform = "facebook" | "tiktok" | "pinterest" | "instagram";

// ============================================================
// User
// ============================================================
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  plan: Plan;
  credits: number;
  trial_ends_at?: string;
  created_at: string;
}

// ============================================================
// Product
// ============================================================
export interface Product {
  id: string;
  marketplace: Marketplace;
  external_id: string;
  title: string;
  slug: string;
  description?: string;
  price: number;
  original_price?: number;
  discount?: number;
  currency: string;
  sales: number;
  rating: number;
  reviews: number;
  images: string[];
  thumbnail?: string;
  supplier?: string;
  supplier_url?: string;
  category: string;
  tags: string[];
  score: number;
  trend_score: number;
  profit_margin?: number;
  shipping_cost?: number;
  shipping_days?: number;
  free_shipping: boolean;
  country_origin?: string;
  is_dropshipping: boolean;
  is_viral: boolean;
  in_promotion: boolean;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface ProductHistory {
  id: string;
  product_id: string;
  price: number;
  sales: number;
  ranking?: number;
  captured_at: string;
}

// ============================================================
// Promotion
// ============================================================
export interface Promotion {
  id: string;
  product_id: string;
  product?: Product;
  type: "flash_sale" | "coupon" | "cashback" | "progressive_discount" | "seasonal";
  discount: number;
  original_price: number;
  promo_price: number;
  coupon_code?: string;
  starts_at?: string;
  ends_at?: string;
  is_active: boolean;
  created_at: string;
}

// ============================================================
// Ad
// ============================================================
export interface ProductAd {
  id: string;
  product_id: string;
  product?: Product;
  platform: AdPlatform;
  ad_copy?: string;
  video_url?: string;
  thumbnail_url?: string;
  landing_url?: string;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  first_seen_at: string;
  last_seen_at: string;
  is_active: boolean;
  created_at: string;
}

// ============================================================
// Trend
// ============================================================
export interface Trend {
  id: string;
  keyword: string;
  growth: number;
  volume: number;
  category: string;
  marketplace?: Marketplace;
  data_points: TrendDataPoint[];
  created_at: string;
  updated_at?: string;
}

export interface TrendDataPoint {
  date: string;
  volume: number;
  growth: number;
}

// ============================================================
// Favorite / Collection
// ============================================================
export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  collection_name?: string;
  notes?: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  product_count: number;
  created_at: string;
}

// ============================================================
// Alert
// ============================================================
export interface Alert {
  id: string;
  user_id: string;
  type: AlertType;
  product_id?: string;
  product?: Product;
  conditions: AlertConditions;
  channels: AlertChannel[];
  active: boolean;
  last_triggered_at?: string;
  created_at: string;
}

export interface AlertConditions {
  price_drop_percentage?: number;
  min_score?: number;
  max_price?: number;
  marketplace?: Marketplace;
  keywords?: string[];
}

export type AlertChannel = "email" | "push" | "telegram" | "whatsapp";

// ============================================================
// Opportunity Score
// ============================================================
export interface OpportunityScore {
  total: number;
  breakdown: {
    sales_volume: number;
    growth_rate: number;
    saturation: number;
    ad_count: number;
    avg_ticket: number;
    rating: number;
    engagement: number;
    social_trend: number;
    markup_potential: number;
    competitiveness: number;
  };
  label: "explosive" | "high" | "medium" | "low" | "saturated";
  recommendation: string;
}

// ============================================================
// Search / Filter
// ============================================================
export interface ProductFilters {
  query?: string;
  marketplace?: Marketplace[];
  category?: string[];
  min_price?: number;
  max_price?: number;
  min_sales?: number;
  min_rating?: number;
  min_score?: number;
  is_dropshipping?: boolean;
  is_viral?: boolean;
  in_promotion?: boolean;
  free_shipping?: boolean;
  country?: string;
  sort_by?: ProductSortBy;
  sort_order?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export type ProductSortBy =
  | "score"
  | "sales"
  | "price"
  | "rating"
  | "growth"
  | "created_at"
  | "discount";

// ============================================================
// API Responses
// ============================================================
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  error: string;
  code: string;
  status: number;
}

// ============================================================
// Dashboard KPIs
// ============================================================
export interface DashboardKPIs {
  total_products: number;
  products_today: number;
  viral_products: number;
  active_promotions: number;
  avg_opportunity_score: number;
  top_marketplace: Marketplace;
  trending_categories: string[];
  price_drops_today: number;
}

// ============================================================
// Subscription
// ============================================================
export interface Subscription {
  id: string;
  user_id: string;
  plan: Plan;
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string;
  created_at: string;
}

export interface PlanFeatures {
  plan: Plan;
  name: string;
  price_monthly: number;
  price_yearly: number;
  products_per_day: number;
  saved_products: number;
  alerts: number;
  marketplaces: number;
  ai_insights: boolean;
  ads_tracker: boolean;
  price_history: boolean;
  api_access: boolean;
  priority_support: boolean;
  team_members: number;
}
