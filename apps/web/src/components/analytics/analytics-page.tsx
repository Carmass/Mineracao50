"use client";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Database, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0a0b0e] border border-white/10 rounded-lg p-3 text-sm">
        <p className="text-white/60 mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {typeof p.value === "number" ? p.value.toLocaleString("pt-BR") : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetch("/api/analytics").then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const totalProducts = analytics?.total_products ?? 0;
  const avgScore = analytics?.avg_score ?? 0;
  const marketplaceDist = analytics?.marketplace_distribution ?? [];
  const monthlyProducts = analytics?.monthly_products ?? [];
  const topTrends = analytics?.top_trends ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          Analytics da Plataforma
        </h1>
        <p className="text-sm text-white/50 mt-1">Métricas reais de produtos indexados</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Produtos Indexados", value: isLoading ? "—" : totalProducts.toLocaleString("pt-BR"), icon: Database, change: "total" },
          { label: "Marketplaces Ativos", value: isLoading ? "—" : String(marketplaceDist.length), icon: BarChart3, change: "conectados" },
          { label: "Score Médio", value: isLoading ? "—" : avgScore.toFixed(1), icon: TrendingUp, change: "/100" },
          { label: "Tendências Ativas", value: isLoading ? "—" : String(topTrends.length), icon: ArrowUpRight, change: "em alta" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4 text-white/40" />
                <span className="text-xs text-white/40">{stat.change}</span>
              </div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-white/50 mt-1">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Products indexed over time */}
      <div className="glass-card p-6">
        <h2 className="font-bold text-white mb-4">Produtos Indexados por Mês</h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={monthlyProducts}>
            <defs>
              <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="products" name="Produtos" stroke="#60a5fa" fill="url(#colorProducts)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketplace distribution */}
        <div className="glass-card p-6">
          <h2 className="font-bold text-white mb-4">Distribuição por Marketplace</h2>
          {marketplaceDist.length > 0 ? (
            <div className="flex items-center gap-6">
              <PieChart width={160} height={160}>
                <Pie data={marketplaceDist} cx={75} cy={75} innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {marketplaceDist.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="space-y-2">
                {marketplaceDist.map((item: any) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-white/70">{item.name}</span>
                    <span className="text-sm font-bold text-white ml-auto">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-white/30 text-sm">Busque produtos para ver a distribuição</div>
          )}
        </div>

        {/* Top Trends */}
        <div className="glass-card p-6">
          <h2 className="font-bold text-white mb-4">Top Tendências</h2>
          {topTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topTrends.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="keyword" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="growth" name="Crescimento %" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-white/30 text-sm">Nenhuma tendência registrada ainda</div>
          )}
        </div>
      </div>
    </div>
  );
}
