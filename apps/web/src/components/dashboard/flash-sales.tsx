"use client";
import { Tag, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { promotionsApi } from "@/lib/api";

function Countdown({ endsAt }: { endsAt: string | null }) {
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    setMounted(true);
    const calc = () => {
      if (!endsAt) return 0;
      return Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
    };
    setRemaining(calc());
    const interval = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (!mounted || !endsAt) return <span className="font-mono text-xs text-red-400">--:--:--</span>;

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return (
    <span className="font-mono text-xs text-red-400">
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export function DashboardFlashSales() {
  const { data, isLoading } = useQuery({
    queryKey: ["promotions", "flash"],
    queryFn: () => promotionsApi.list({ limit: 4 }),
    staleTime: 5 * 60 * 1000,
  });

  const promotions = (data as any)?.data ?? data ?? [];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-red-400" />
          <h2 className="font-bold text-white">Flash Sales</h2>
          <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full animate-pulse">AO VIVO</span>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs text-white/50 hover:text-white">
          <Link href="/promotions">Ver todas</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-white/5" />
          ))
        ) : promotions.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">Nenhuma promoção ativa.</p>
        ) : (
          promotions.slice(0, 4).map((item: any) => {
            const product = item.products ?? item;
            const name = product?.title ?? item.type ?? "Promoção";
            const promoPrice = item.promo_price ?? product?.price;
            const originalPrice = item.original_price ?? product?.original_price;
            const discount = item.discount ?? 0;
            return (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-white/30" />
                    <Countdown endsAt={item.ends_at} />
                  </div>
                </div>
                <div className="text-right">
                  {promoPrice != null && (
                    <div className="text-sm font-bold text-white">{formatCurrency(promoPrice, "BRL", "pt-BR")}</div>
                  )}
                  {originalPrice != null && (
                    <div className="text-xs text-white/40 line-through">{formatCurrency(originalPrice, "BRL", "pt-BR")}</div>
                  )}
                </div>
                {discount > 0 && (
                  <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0">
                    -{discount}%
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
