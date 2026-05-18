"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { ProductCard } from "@/components/products/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1", marketplace: "aliexpress", external_id: "AE001",
    title: "Mini Projetor Portátil 4K LED WiFi Bluetooth", slug: "mini-projetor-4k",
    price: 45.99, original_price: 89.99, discount: 49, currency: "USD",
    sales: 15420, rating: 4.7, reviews: 3821,
    images: ["https://placehold.co/400x400/1a1a2e/60a5fa?text=Projetor+4K"],
    thumbnail: "https://placehold.co/400x400/1a1a2e/60a5fa?text=Projetor+4K",
    category: "Eletrônicos", tags: ["projetor", "4k"], score: 87.5, trend_score: 92.3,
    profit_margin: 312, free_shipping: true, is_dropshipping: true, is_viral: true,
    in_promotion: true, url: "#", created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "2", marketplace: "shopee", external_id: "SH001",
    title: "Luminária LED RGB Gamer 16 Cores Controle Remoto", slug: "led-rgb-gamer",
    price: 12.50, original_price: 24.99, discount: 50, currency: "BRL",
    sales: 28750, rating: 4.8, reviews: 9234,
    images: ["https://placehold.co/400x400/1a2e1a/22c55e?text=LED+RGB"],
    thumbnail: "https://placehold.co/400x400/1a2e1a/22c55e?text=LED+RGB",
    category: "Informática", tags: ["led", "rgb", "gamer"], score: 91.2, trend_score: 88.7,
    profit_margin: 180, free_shipping: true, is_dropshipping: true, is_viral: true,
    in_promotion: true, url: "#", created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "3", marketplace: "aliexpress", external_id: "AE002",
    title: "Smartwatch Fitness IP68 GPS Monitor Cardíaco 7 Dias", slug: "smartwatch-fitness",
    price: 28.99, original_price: 59.99, discount: 52, currency: "USD",
    sales: 45120, rating: 4.5, reviews: 12890,
    images: ["https://placehold.co/400x400/2e1a1a/f97316?text=Smartwatch"],
    thumbnail: "https://placehold.co/400x400/2e1a1a/f97316?text=Smartwatch",
    category: "Wearables", tags: ["smartwatch", "fitness"], score: 84.7, trend_score: 79.5,
    profit_margin: 280, free_shipping: true, is_dropshipping: true, is_viral: true,
    in_promotion: false, url: "#", created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

export function DashboardViralProducts() {
  const { data: products = MOCK_PRODUCTS, isLoading } = useQuery({
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
