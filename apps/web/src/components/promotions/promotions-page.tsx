"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tag, Clock, Flame, Percent, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { promotionsApi } from "@/lib/api";
import { formatCurrency, formatNumber, MARKETPLACE_CONFIG } from "@/lib/utils";
import type { Promotion, Marketplace } from "@/types";
import { Button } from "@/components/ui/button";

const MOCK_PROMOTIONS: Promotion[] = [
  { id: "1", product_id: "1", type: "flash_sale", discount: 67, original_price: 149.99, promo_price: 49.90, ends_at: new Date(Date.now() + 3600000 * 2).toISOString(), is_active: true, created_at: new Date().toISOString() },
  { id: "2", product_id: "2", type: "coupon", discount: 50, original_price: 89.99, promo_price: 44.99, coupon_code: "DROP50", ends_at: new Date(Date.now() + 3600000 * 24).toISOString(), is_active: true, created_at: new Date().toISOString() },
  { id: "3", product_id: "3", type: "cashback", discount: 30, original_price: 199.99, promo_price: 139.99, ends_at: new Date(Date.now() + 3600000 * 48).toISOString(), is_active: true, created_at: new Date().toISOString() },
  { id: "4", product_id: "4", type: "flash_sale", discount: 75, original_price: 299.99, promo_price: 74.99, ends_at: new Date(Date.now() + 3600000).toISOString(), is_active: true, created_at: new Date().toISOString() },
  { id: "5", product_id: "5", type: "progressive_discount", discount: 40, original_price: 129.99, promo_price: 77.99, ends_at: new Date(Date.now() + 3600000 * 72).toISOString(), is_active: true, created_at: new Date().toISOString() },
];

const PROMO_NAMES = { flash_sale: "Flash Sale", coupon: "Cupom", cashback: "Cashback", progressive_discount: "Desconto Progressivo", seasonal: "Sazonal" };
const PROMO_COLORS: Record<string, string> = { flash_sale: "text-red-400 bg-red-500/10", coupon: "text-blue-400 bg-blue-500/10", cashback: "text-green-400 bg-green-500/10", progressive_discount: "text-purple-400 bg-purple-500/10", seasonal: "text-yellow-400 bg-yellow-500/10" };

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    setMounted(true);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return <span className="font-mono text-xs text-red-300">--:--:--</span>;

  const diff = Math.max(0, new Date(endsAt).getTime() - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <span className="font-mono text-xs text-red-300">
      {String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}
    </span>
  );
}

export function PromotionsPage() {
  const [filter, setFilter] = useState<string>("all");

  const { data: promoResponse, refetch } = useQuery({
    queryKey: ["promotions"],
    queryFn: () => promotionsApi.list(),
    refetchInterval: 60000,
  });

  // API returns PaginatedResponse<Promotion>; fall back to mock when empty
  const promotions: Promotion[] = (() => {
    if (!promoResponse) return MOCK_PROMOTIONS;
    const list = Array.isArray(promoResponse)
      ? promoResponse
      : (promoResponse as any)?.data;
    return Array.isArray(list) && list.length > 0 ? list : MOCK_PROMOTIONS;
  })();

  const filtered = promotions.filter(
    (p) => filter === "all" || p.type === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-red-400" />
            Radar de Promoções
          </h1>
          <p className="text-sm text-white/50 mt-1">{filtered.length} promoções ativas agora</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/20"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "flash_sale", "coupon", "cashback", "progressive_discount"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`flex-shrink-0 text-sm px-3 py-1.5 rounded-lg transition-colors ${
              filter === type
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            {type === "all" ? "Todas" : PROMO_NAMES[type] || type}
          </button>
        ))}
      </div>

      {/* Promotions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((promo, i) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5 relative overflow-hidden"
          >
            {/* Product info */}
            {promo.product && (
              <div className="flex items-center gap-3 mb-4 pr-12">
                {promo.product.thumbnail && (
                  <Image
                    src={promo.product.thumbnail}
                    alt={promo.product.title}
                    width={48}
                    height={48}
                    className="rounded-lg object-cover flex-shrink-0 bg-white/5"
                    unoptimized
                  />
                )}
                <p className="text-sm text-white font-medium line-clamp-2 leading-snug">{promo.product.title}</p>
              </div>
            )}

            {/* Type badge */}
            <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mb-3 ${PROMO_COLORS[promo.type] || "text-white/60 bg-white/10"}`}>
              <Percent className="w-3 h-3" />
              {PROMO_NAMES[promo.type] || promo.type}
            </div>

            {/* Discount badge */}
            <div className="absolute top-4 right-4 w-14 h-14 rounded-full bg-red-500 flex items-center justify-center">
              <div className="text-center">
                <div className="text-white font-black text-lg leading-none">-{promo.discount}%</div>
              </div>
            </div>

            {/* Prices */}
            <div className="mb-3">
              <div className="text-2xl font-black text-white">
                {formatCurrency(promo.promo_price, "BRL", "pt-BR")}
              </div>
              <div className="text-sm text-white/40 line-through">
                {formatCurrency(promo.original_price, "BRL", "pt-BR")}
              </div>
              <div className="text-sm text-green-400">
                Economia: {formatCurrency(promo.original_price - promo.promo_price, "BRL", "pt-BR")}
              </div>
            </div>

            {/* Coupon code */}
            {promo.coupon_code && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
                <span className="text-xs text-white/50">Cupom:</span>
                <span className="font-mono font-bold text-blue-300 text-sm">{promo.coupon_code}</span>
              </div>
            )}

            {/* Countdown */}
            {promo.ends_at && (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Clock className="w-3 h-3" />
                <span>Termina em:</span>
                <CountdownTimer endsAt={promo.ends_at} />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
