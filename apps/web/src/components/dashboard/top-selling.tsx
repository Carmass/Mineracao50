"use client";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { formatCurrency, formatNumber, MARKETPLACE_CONFIG } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardTopSelling() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["dashboard", "top-selling"],
    queryFn: () => dashboardApi.topSelling(10),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <ShoppingBag className="w-5 h-5 text-blue-400" />
        <h2 className="font-bold text-white">Mais Vendidos</h2>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-white/5" />
          ))
        ) : products.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">Nenhum produto ainda.</p>
        ) : (
          products.slice(0, 10).map((product, i) => {
            const mp = MARKETPLACE_CONFIG[product.marketplace] ?? { color: "#fff", emoji: "🛒", label: product.marketplace };
            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-xs text-white/30 w-4 font-mono">{i + 1}</span>
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                  <Image
                    src={product.thumbnail || product.images?.[0] || "https://placehold.co/80x80/1a1a2e/ffffff?text=?"}
                    alt={product.title}
                    width={40}
                    height={40}
                    className="object-cover"
                    unoptimized
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/80x80/1a1a2e/ffffff?text=?"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{product.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: mp.color }}>{mp.emoji} {mp.label}</span>
                    <span className="text-xs text-white/40">{formatNumber(product.sales)} vendas</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-white">
                    {formatCurrency(product.price, product.currency === "BRL" ? "BRL" : "USD", "pt-BR")}
                  </span>
                  {product.discount && product.discount > 0 && (
                    <div className="text-xs text-red-400">-{product.discount}%</div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
