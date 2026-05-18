"use client";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const data = [
  { name: "AliExpress", value: 42, color: "#e52e2e" },
  { name: "Shopee", value: 28, color: "#f97316" },
  { name: "Amazon", value: 18, color: "#f59e0b" },
  { name: "Temu", value: 7, color: "#8b5cf6" },
  { name: "MercadoL.", value: 5, color: "#facc15" },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0a0b0e] border border-white/10 rounded-lg px-3 py-2">
        <p className="text-white font-semibold">{payload[0].payload.name}</p>
        <p className="text-sm text-white/60">{payload[0].value}% dos produtos</p>
      </div>
    );
  }
  return null;
};

export function DashboardMarketplaceChart() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        <h2 className="font-bold text-white">Distribuição por Marketplace</h2>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={32}>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
