"use client";
import { motion } from "framer-motion";
import { TrendingUp, Package, Zap, Tag, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/utils";

const kpiConfig = [
  {
    key: "total_products",
    label: "Produtos Indexados",
    icon: Package,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    change: +12.3,
    format: (v: number) => formatNumber(v),
  },
  {
    key: "viral_products",
    label: "Produtos Virais Hoje",
    icon: Zap,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    change: +34.7,
    format: (v: number) => formatNumber(v),
  },
  {
    key: "active_promotions",
    label: "Promoções Ativas",
    icon: Tag,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    change: +8.1,
    format: (v: number) => formatNumber(v),
  },
  {
    key: "avg_opportunity_score",
    label: "Score Médio",
    icon: TrendingUp,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    change: +2.4,
    format: (v: number) => v.toFixed(1),
  },
];

export function DashboardKPICards() {
  const { data: kpis = {} as Record<string, number> } = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: dashboardApi.kpis,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiConfig.map((config, i) => {
        const Icon = config.icon;
        const value = (kpis as Record<string, number>)[config.key] || 0;
        const isPositive = config.change >= 0;

        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {formatPercent(Math.abs(config.change))}
              </div>
            </div>
            <div className="text-2xl font-black text-white mb-1">
              {config.format(value)}
            </div>
            <div className="text-sm text-white/50">{config.label}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
