"use client";
import { Bell, Zap, TrendingUp, Tag } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const MOCK_ALERTS = [
  { id: "1", type: "product_viral", message: "Mini Projetor 4K está viralizando", time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), icon: Zap, color: "text-yellow-400 bg-yellow-500/10" },
  { id: "2", type: "price_drop", message: "Smartwatch com queda de 52%", time: new Date(Date.now() - 1000 * 60 * 23).toISOString(), icon: Tag, color: "text-red-400 bg-red-500/10" },
  { id: "3", type: "product_growing", message: "LED RGB cresceu 210% em vendas", time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), icon: TrendingUp, color: "text-green-400 bg-green-500/10" },
  { id: "4", type: "promotion_started", message: "Flash sale de fones na Shopee", time: new Date(Date.now() - 1000 * 60 * 90).toISOString(), icon: Bell, color: "text-blue-400 bg-blue-500/10" },
];

export function DashboardRecentAlerts() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-400" />
          <h2 className="font-bold text-white">Alertas Recentes</h2>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs text-white/50 hover:text-white">
          <Link href="/alerts">Ver todos</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {MOCK_ALERTS.map((alert) => {
          const Icon = alert.icon;
          return (
            <div key={alert.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className={`w-8 h-8 rounded-lg ${alert.color.split(" ")[1]} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${alert.color.split(" ")[0]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{alert.message}</p>
                <p className="text-xs text-white/40 mt-0.5">{formatRelativeTime(alert.time)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
