"use client";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Eye } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

const MONTHLY_DATA = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i],
  products: Math.floor(50000 + Math.random() * 100000),
  viral: Math.floor(100 + Math.random() * 500),
  users: Math.floor(500 + i * 200 + Math.random() * 200),
}));

const MARKETPLACE_DIST = [
  { name: "AliExpress", value: 42, color: "#e52e2e" },
  { name: "Shopee", value: 28, color: "#f97316" },
  { name: "Amazon", value: 18, color: "#f59e0b" },
  { name: "Temu", value: 7, color: "#8b5cf6" },
  { name: "Outros", value: 5, color: "#6b7280" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0a0b0e] border border-white/10 rounded-lg p-3 text-sm">
        <p className="text-white/60 mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.value.toLocaleString("pt-BR")}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          Analytics da Plataforma
        </h1>
        <p className="text-sm text-white/50 mt-1">Métricas de uso e desempenho em tempo real</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Produtos/Mês", value: "1.2M", icon: BarChart3, change: "+18%" },
          { label: "Usuários Ativos", value: "8.5K", icon: Users, change: "+24%" },
          { label: "Score Médio", value: "71.4", icon: TrendingUp, change: "+3.2%" },
          { label: "Page Views/Dia", value: "45K", icon: Eye, change: "+12%" },
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
                <span className="text-xs text-green-400">{stat.change}</span>
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
          <AreaChart data={MONTHLY_DATA}>
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
          <div className="flex items-center gap-6">
            <PieChart width={160} height={160}>
              <Pie data={MARKETPLACE_DIST} cx={75} cy={75} innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                {MARKETPLACE_DIST.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="space-y-2">
              {MARKETPLACE_DIST.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-white/70">{item.name}</span>
                  <span className="text-sm font-bold text-white ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User growth */}
        <div className="glass-card p-6">
          <h2 className="font-bold text-white mb-4">Crescimento de Usuários</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="users" name="Usuários" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
