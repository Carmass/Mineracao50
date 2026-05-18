"use client";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const MOCK_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
  price: 45.99 + (Math.random() - 0.5) * 15,
  sales: Math.floor(400 + Math.random() * 200),
}));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0a0b0e] border border-white/10 rounded-lg p-3">
        <p className="text-white/60 text-xs mb-1">{label}</p>
        <p className="text-white font-bold">
          {formatCurrency(payload[0]?.value, "USD", "en-US")}
        </p>
      </div>
    );
  }
  return null;
};

interface PriceHistoryChartProps {
  productId: string;
}

export function PriceHistoryChart({ productId }: PriceHistoryChartProps) {
  const { data: history = MOCK_HISTORY } = useQuery({
    queryKey: ["product-history", productId],
    queryFn: () => productsApi.history(productId),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-5 h-5 text-blue-400" />
        <h2 className="font-bold text-white">Histórico de Preços (30 dias)</h2>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={history as any[]}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#60a5fa"
            fill="url(#priceGrad)"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
