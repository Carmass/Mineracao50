"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { ProductCard } from "@/components/products/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

export function DashboardViralProducts() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["dashboard", "viral"],
    queryFn: () => dashboardApi.viral(6),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h2 className="font-bold text-white">Produtos Virais Agora</h2>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs text-white/50 hover:text-white">
          <Link href="/products?filter=viral">Ver todos</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl bg-white/5" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-8">Nenhum produto viral ainda. Clique em Produtos → Buscar Produtos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(products as Product[]).slice(0, 3).map((product) => (
            <ProductCard key={product.id} product={product} compact />
          ))}
        </div>
      )}
    </div>
  );
}
