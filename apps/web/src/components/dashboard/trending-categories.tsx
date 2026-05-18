"use client";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const MOCK_CATEGORIES = [
  { category: "Eletrônicos", product_count: 1240, avg_trend_score: 88.4, total_sales: 542000 },
  { category: "Wearables", product_count: 890, avg_trend_score: 82.1, total_sales: 389000 },
  { category: "Casa & Jardim", product_count: 2100, avg_trend_score: 76.5, total_sales: 621000 },
  { category: "Informática", product_count: 1580, avg_trend_score: 74.2, total_sales: 415000 },
  { category: "Beleza", product_count: 3200, avg_trend_score: 71.8, total_sales: 289000 },
  { category: "Esportes", product_count: 980, avg_trend_score: 69.3, total_sales: 198000 },
];

export function DashboardTrendingCategories() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5 text-green-400" />
        <h2 className="font-bold text-white">Nichos em Alta</h2>
      </div>

      <div className="space-y-3">
        {MOCK_CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.category}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3"
          >
            <span className="text-xs text-white/30 w-4 font-mono">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white truncate">{cat.category}</span>
                <span className="text-xs text-green-400 font-bold ml-2">{cat.avg_trend_score.toFixed(0)}</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.avg_trend_score}%` }}
                  transition={{ duration: 0.8, delay: i * 0.06 + 0.3 }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                />
              </div>
            </div>
            <span className="text-xs text-white/40 flex-shrink-0">{formatNumber(cat.total_sales)}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
