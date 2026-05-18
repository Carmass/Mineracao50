"use client";
import Link from "next/link";
import Image from "next/image";
import { Star, ExternalLink, Heart } from "lucide-react";
import { formatCurrency, formatNumber, MARKETPLACE_CONFIG, getOpportunityColor, getOpportunityLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {["Produto", "Marketplace", "Preço", "Desconto", "Vendas", "Rating", "Score", "Margem", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const mp = MARKETPLACE_CONFIG[product.marketplace];
              const scoreLabel = getOpportunityLabel(product.score);
              const scoreColor = getOpportunityColor(scoreLabel);

              return (
                <tr key={product.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                        <Image
                          src={product.thumbnail || product.images[0] || "https://placehold.co/40x40"}
                          alt={product.title}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                      <div className="max-w-[250px]">
                        <Link href={`/products/${product.id}`} className="text-white font-medium hover:text-blue-300 transition-colors line-clamp-1">
                          {product.title}
                        </Link>
                        <p className="text-xs text-white/40 mt-0.5 truncate">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: mp.color }}>
                      {mp.emoji} {mp.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {formatCurrency(product.price, product.currency === "BRL" ? "BRL" : "USD", "pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    {product.discount ? (
                      <span className="text-red-400 font-medium">-{product.discount}%</span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/70">{formatNumber(product.sales)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-white/70">{product.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("font-bold text-base", scoreColor)}>
                      {product.score.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {product.profit_margin ? (
                      <span className="text-green-400 font-medium">+{product.profit_margin}%</span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-white/30 hover:text-red-400 transition-colors">
                        <Heart className="w-4 h-4" />
                      </button>
                      <Link href={product.url} target="_blank" className="text-white/30 hover:text-white transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
