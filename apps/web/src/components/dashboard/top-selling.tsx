"use client";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatCurrency, formatNumber, MARKETPLACE_CONFIG } from "@/lib/utils";
import type { Product } from "@/types";

const MOCK_TOP: Product[] = [
  { id: "1", marketplace: "shopee", external_id: "s1", title: "LED RGB Gamer 16 Cores", slug: "led-rgb", price: 12.50, original_price: 24.99, discount: 50, currency: "BRL", sales: 28750, rating: 4.8, reviews: 9234, images: ["https://placehold.co/80x80/1a2e1a/22c55e?text=LED"], category: "Informática", tags: [], score: 91.2, trend_score: 88.7, free_shipping: true, is_dropshipping: true, is_viral: true, in_promotion: true, url: "#", created_at: "", updated_at: "" },
  { id: "2", marketplace: "aliexpress", external_id: "a1", title: "Smartwatch Fitness IP68", slug: "smartwatch", price: 28.99, original_price: 59.99, discount: 52, currency: "USD", sales: 45120, rating: 4.5, reviews: 12890, images: ["https://placehold.co/80x80/2e1a1a/f97316?text=Watch"], category: "Wearables", tags: [], score: 84.7, trend_score: 79.5, free_shipping: true, is_dropshipping: true, is_viral: true, in_promotion: false, url: "#", created_at: "", updated_at: "" },
  { id: "3", marketplace: "aliexpress", external_id: "a2", title: "Mini Projetor 4K WiFi", slug: "projetor", price: 45.99, original_price: 89.99, discount: 49, currency: "USD", sales: 15420, rating: 4.7, reviews: 3821, images: ["https://placehold.co/80x80/1a1a2e/60a5fa?text=Proj"], category: "Eletrônicos", tags: [], score: 87.5, trend_score: 92.3, free_shipping: true, is_dropshipping: true, is_viral: true, in_promotion: true, url: "#", created_at: "", updated_at: "" },
];

export function DashboardTopSelling() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <ShoppingBag className="w-5 h-5 text-blue-400" />
        <h2 className="font-bold text-white">Mais Vendidos</h2>
      </div>

      <div className="space-y-3">
        {MOCK_TOP.map((product, i) => {
          const mp = MARKETPLACE_CONFIG[product.marketplace];
          return (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className="text-xs text-white/30 w-4 font-mono">{i + 1}</span>
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                <Image src={product.images[0]} alt={product.title} width={40} height={40} className="object-cover" />
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
                {product.discount && (
                  <div className="text-xs text-red-400">-{product.discount}%</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
