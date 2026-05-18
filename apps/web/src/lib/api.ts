import axios from "axios";
import type { Product, ProductFilters, PaginatedResponse, Trend, Promotion, ProductAd, Alert, DashboardKPIs, Favorite } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.error || "Erro inesperado";
    return Promise.reject(new Error(message));
  }
);

// ---- Products ----
export const productsApi = {
  list: (filters: ProductFilters = {}) =>
    api.get<PaginatedResponse<Product>>("/api/products", { params: filters }).then((r) => r.data),

  get: (id: string) =>
    api.get<Product>(`/api/products/${id}`).then((r) => r.data),

  search: (query: string, filters: Partial<ProductFilters> = {}) =>
    api.get<PaginatedResponse<Product>>("/api/search", { params: { q: query, ...filters } }).then((r) => r.data),

  similar: (id: string) =>
    api.get<Product[]>(`/api/products/${id}/similar`).then((r) => r.data),

  history: (id: string) =>
    api.get(`/api/products/${id}/history`).then((r) => r.data),
};

// ---- Dashboard ----
export const dashboardApi = {
  kpis: () => api.get<DashboardKPIs>("/api/dashboard/kpis").then((r) => r.data),
  viral: (limit = 10) => api.get<Product[]>("/api/dashboard/viral", { params: { limit } }).then((r) => r.data),
  topSelling: (limit = 10) => api.get<Product[]>("/api/dashboard/top-selling", { params: { limit } }).then((r) => r.data),
  growing: (limit = 10) => api.get<Product[]>("/api/dashboard/growing", { params: { limit } }).then((r) => r.data),
};

// ---- Trends ----
export const trendsApi = {
  list: (params: { category?: string; marketplace?: string; limit?: number } = {}) =>
    api.get<Trend[]>("/api/trends", { params }).then((r) => r.data),

  get: (id: string) => api.get<Trend>(`/api/trends/${id}`).then((r) => r.data),
};

// ---- Promotions ----
export const promotionsApi = {
  list: (params: { marketplace?: string; limit?: number; page?: number } = {}) =>
    api.get<PaginatedResponse<Promotion>>("/api/promotions", { params }).then((r) => r.data),

  flash: () => api.get<Promotion[]>("/api/promotions/flash").then((r) => r.data),
};

// ---- Ads ----
export const adsApi = {
  list: (params: { platform?: string; limit?: number; page?: number } = {}) =>
    api.get<PaginatedResponse<ProductAd>>("/api/ads", { params }).then((r) => r.data),

  winners: () => api.get<ProductAd[]>("/api/ads/winners").then((r) => r.data),
};

// ---- Favorites ----
export const favoritesApi = {
  list: (collection?: string) =>
    api.get<Favorite[]>("/api/favorites", { params: { collection } }).then((r) => r.data),

  add: (productId: string, collection?: string, notes?: string) =>
    api.post("/api/favorites", { product_id: productId, collection_name: collection, notes }).then((r) => r.data),

  remove: (productId: string) =>
    api.delete(`/api/favorites/${productId}`).then((r) => r.data),

  exportCsv: () =>
    api.get("/api/favorites/export", { responseType: "blob" }).then((r) => r.data),
};

// ---- Alerts ----
export const alertsApi = {
  list: () => api.get<Alert[]>("/api/alerts").then((r) => r.data),
  create: (data: Partial<Alert>) => api.post<Alert>("/api/alerts", data).then((r) => r.data),
  update: (id: string, data: Partial<Alert>) => api.patch<Alert>(`/api/alerts/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/alerts/${id}`).then((r) => r.data),
};

// ---- AI Insights ----
export const aiApi = {
  productInsight: (productId: string) =>
    api.post<{ insights: string }>("/api/ai/product-insight", { product_id: productId }).then((r) => r.data),

  generateCopy: (productId: string, type: "title" | "description" | "ad_copy") =>
    api.post<{ content: string }>("/api/ai/generate-copy", { product_id: productId, type }).then((r) => r.data),

  trendPrediction: (keyword: string) =>
    api.post<{ prediction: string; confidence: number }>("/api/ai/trend-prediction", { keyword }).then((r) => r.data),
};

export default api;
