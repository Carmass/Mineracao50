import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Marketplace, OpportunityScore, Plan, PlanFeatures } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "BRL", locale = "pt-BR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, locale = "pt-BR") {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number, decimals = 1) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatDate(date: string | Date, locale = "pt-BR") {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return formatDate(date);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export const MARKETPLACE_CONFIG: Record<Marketplace, { label: string; color: string; bgColor: string; emoji: string }> = {
  aliexpress: { label: "AliExpress", color: "#e52e2e", bgColor: "bg-red-500/10", emoji: "🛒" },
  shopee: { label: "Shopee", color: "#f97316", bgColor: "bg-orange-500/10", emoji: "🛍️" },
  amazon: { label: "Amazon", color: "#f59e0b", bgColor: "bg-yellow-500/10", emoji: "📦" },
  temu: { label: "Temu", color: "#8b5cf6", bgColor: "bg-purple-500/10", emoji: "🏪" },
  mercadolivre: { label: "Mercado Livre", color: "#facc15", bgColor: "bg-yellow-400/10", emoji: "🛒" },
  cj: { label: "CJ Dropshipping", color: "#06b6d4", bgColor: "bg-cyan-500/10", emoji: "📫" },
  alibaba: { label: "Alibaba", color: "#f97316", bgColor: "bg-orange-600/10", emoji: "🏭" },
};

export function getOpportunityLabel(score: number): OpportunityScore["label"] {
  if (score >= 85) return "explosive";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low";
  return "saturated";
}

export function getOpportunityColor(label: OpportunityScore["label"]) {
  const colors: Record<OpportunityScore["label"], string> = {
    explosive: "text-green-400",
    high: "text-blue-400",
    medium: "text-yellow-400",
    low: "text-orange-400",
    saturated: "text-red-400",
  };
  return colors[label];
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
    plan: "free",
    name: "Gratuito",
    price_monthly: 0,
    price_yearly: 0,
    products_per_day: 10,
    saved_products: 20,
    alerts: 2,
    marketplaces: 2,
    ai_insights: false,
    ads_tracker: false,
    price_history: false,
    api_access: false,
    priority_support: false,
    team_members: 1,
  },
  starter: {
    plan: "starter",
    name: "Starter",
    price_monthly: 47,
    price_yearly: 397,
    products_per_day: 500,
    saved_products: 500,
    alerts: 10,
    marketplaces: 4,
    ai_insights: true,
    ads_tracker: false,
    price_history: true,
    api_access: false,
    priority_support: false,
    team_members: 1,
  },
  pro: {
    plan: "pro",
    name: "Pro",
    price_monthly: 97,
    price_yearly: 797,
    products_per_day: 5000,
    saved_products: 5000,
    alerts: 50,
    marketplaces: 7,
    ai_insights: true,
    ads_tracker: true,
    price_history: true,
    api_access: true,
    priority_support: true,
    team_members: 3,
  },
  enterprise: {
    plan: "enterprise",
    name: "Enterprise",
    price_monthly: 297,
    price_yearly: 2497,
    products_per_day: -1,
    saved_products: -1,
    alerts: -1,
    marketplaces: 7,
    ai_insights: true,
    ads_tracker: true,
    price_history: true,
    api_access: true,
    priority_support: true,
    team_members: -1,
  },
};

export function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
