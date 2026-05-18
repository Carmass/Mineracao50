"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Plus, Trash2, Toggle, Zap, TrendingUp, Tag, ArrowDownRight } from "lucide-react";
import { alertsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { Alert, AlertType } from "@/types";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";

const ALERT_ICONS: Record<AlertType, { icon: typeof Zap; color: string }> = {
  product_viral: { icon: Zap, color: "text-yellow-400" },
  price_drop: { icon: ArrowDownRight, color: "text-red-400" },
  product_growing: { icon: TrendingUp, color: "text-green-400" },
  high_demand: { icon: TrendingUp, color: "text-blue-400" },
  low_competition: { icon: TrendingUp, color: "text-purple-400" },
  promotion_started: { icon: Tag, color: "text-orange-400" },
};

const ALERT_LABELS: Record<AlertType, string> = {
  product_viral: "Produto Viral",
  price_drop: "Queda de Preço",
  product_growing: "Produto Crescendo",
  high_demand: "Alta Demanda",
  low_competition: "Baixa Concorrência",
  promotion_started: "Promoção Iniciada",
};

const MOCK_ALERTS: Alert[] = [
  { id: "1", user_id: "u1", type: "product_viral", conditions: { min_score: 85 }, channels: ["email", "telegram"], active: true, trigger_count: 12, created_at: new Date(Date.now() - 1000*60*60*24*3).toISOString() },
  { id: "2", user_id: "u1", type: "price_drop", conditions: { price_drop_percentage: 30 }, channels: ["email"], active: true, trigger_count: 5, created_at: new Date(Date.now() - 1000*60*60*24*7).toISOString() },
  { id: "3", user_id: "u1", type: "promotion_started", conditions: { marketplace: "aliexpress" }, channels: ["push", "telegram"], active: false, trigger_count: 3, created_at: new Date(Date.now() - 1000*60*60*24*14).toISOString() },
];

export function AlertsPage() {
  const queryClient = useQueryClient();

  const { data: alerts = MOCK_ALERTS } = useQuery({
    queryKey: ["alerts"],
    queryFn: alertsApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alerta removido");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      alertsApi.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-400" />
            Alertas Inteligentes
          </h1>
          <p className="text-sm text-white/50 mt-1">{(alerts as Alert[]).filter(a => a.active).length} alertas ativos</p>
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 border-0">
          <Plus className="w-4 h-4 mr-2" />
          Novo Alerta
        </Button>
      </div>

      {/* Alert type cards (quick create) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(ALERT_LABELS).map(([type, label]) => {
          const config = ALERT_ICONS[type as AlertType];
          const Icon = config.icon;
          return (
            <button
              key={type}
              className="glass-card p-3 text-center hover:border-white/20 transition-colors group"
            >
              <Icon className={`w-5 h-5 mx-auto mb-2 ${config.color} group-hover:scale-110 transition-transform`} />
              <p className="text-xs text-white/60 font-medium">{label}</p>
            </button>
          );
        })}
      </div>

      {/* Active alerts list */}
      <div className="space-y-3">
        {(alerts as Alert[]).map((alert, i) => {
          const config = ALERT_ICONS[alert.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`glass-card p-4 flex items-center gap-4 ${!alert.active ? "opacity-50" : ""}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white text-sm">{ALERT_LABELS[alert.type]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${alert.active ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/40"}`}>
                    {alert.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span>Canais: {alert.channels.join(", ")}</span>
                  {alert.last_triggered_at && (
                    <span>Último disparo: {formatRelativeTime(alert.last_triggered_at)}</span>
                  )}
                  <span>{alert.trigger_count} disparos</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleMutation.mutate({ id: alert.id, active: !alert.active })}
                  className={`w-10 h-6 rounded-full transition-colors relative ${alert.active ? "bg-blue-600" : "bg-white/20"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${alert.active ? "left-4.5" : "left-0.5"}`} />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(alert.id)}
                  className="text-white/30 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
