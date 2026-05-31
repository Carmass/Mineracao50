"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight, Sparkles, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { trendsApi } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type { Trend } from "@/types";

const COLORS = ["#60a5fa","#a78bfa","#34d399","#fbbf24","#f87171","#818cf8"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0a0b0e] border border-white/10 rounded-lg p-3">
        <p className="text-white text-sm font-medium">{payload[0].payload.date}</p>
        <p className="text-blue-300 text-sm">{formatNumber(payload[0].value)} buscas</p>
      </div>
    );
  }
  return null;
};

export function TrendsPage() {
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);

  const { data: trends = [], isLoading, refetch } = useQuery<Trend[]>({
    queryKey: ["trends"],
    queryFn: () => trendsApi.list() as Promise<Trend[]>,
    staleTime: 10 * 60 * 1000,
  });

  const generateMutation = useMutation({
    mutationFn: () => fetch("/api/trends/generate", { method: "POST" }).then((r) => r.json()),
    onSuccess: () => refetch(),
  });

  useEffect(() => {
    if (!isLoading && trends.length === 0) {
      generateMutation.mutate();
    }
  }, [isLoading, trends.length]);

  useEffect(() => {
    if (trends.length > 0 && !selectedTrend) {
      setSelectedTrend(trends[0]);
    }
  }, [trends]);

  const active = selectedTrend ?? trends[0];
  const generating = generateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            Tendências de Mercado
          </h1>
          <p className="text-sm text-white/50 mt-1">
            {generating ? "Gerando tendências dos seus produtos..." : "Keywords com maior crescimento nas últimas semanas"}
          </p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generating}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          Regenerar
        </button>
      </div>

      {/* Loading / empty */}
      {(isLoading || generating) && (
        <div className="glass-card p-10 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 text-white/30 animate-spin" />
          <p className="text-white/40 text-sm">{generating ? "Analisando produtos..." : "Carregando..."}</p>
        </div>
      )}

      {/* Chart */}
      {active && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-white capitalize">{active.keyword}</h2>
              <p className="text-sm text-white/50">{active.category}</p>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <ArrowUpRight className="w-4 h-4" />
              <span className="font-bold">+{active.growth.toFixed(1)}%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={active.data_points}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="volume" stroke="#60a5fa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trend cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(trends as Trend[]).map((trend, i) => (
          <motion.div
            key={trend.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => setSelectedTrend(trend)}
            className={`glass-card p-5 cursor-pointer transition-all ${active?.id === trend.id ? "border-blue-500/40" : "hover:border-white/20"}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white capitalize">{trend.keyword}</h3>
                <span className="text-xs text-white/40">{trend.category}</span>
              </div>
              <div className={`flex items-center gap-1 text-sm font-bold ${trend.growth > 100 ? "text-green-400" : trend.growth > 50 ? "text-blue-400" : "text-yellow-400"}`}>
                <ArrowUpRight className="w-4 h-4" />
                +{trend.growth.toFixed(1)}%
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div>
                <p className="text-white/40 text-xs">Volume</p>
                <p className="text-white font-semibold">{formatNumber(trend.volume)}</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex-1">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, trend.growth / 4)}%` }}
                    transition={{ duration: 0.8, delay: i * 0.06 }}
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
            </div>

            {trend.growth > 150 && (
              <div className="mt-3 flex items-center gap-1 text-xs text-yellow-300 bg-yellow-500/10 px-2 py-1 rounded-lg w-fit">
                <Sparkles className="w-3 h-3" />
                Tendência explosiva
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
