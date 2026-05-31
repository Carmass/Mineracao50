"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, ExternalLink, TrendingUp, Star, Trash2 } from "lucide-react";
import { cn, formatCurrency, formatNumber, MARKETPLACE_CONFIG, getOpportunityLabel, getOpportunityColor } from "@/lib/utils";
import type { Product } from "@/types";
import { useState, useCallback } from "react";
import { favoritesApi, productsApi } from "@/lib/api";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  onDelete?: (id: string) => void;
}

export function ProductCard({ product, compact = false, onDelete }: ProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imgSrc, setImgSrc] = useState(
    product.thumbnail || product.images[0] || "https://placehold.co/400x400/1a1a2e/ffffff?text=Produto"
  );

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (deleting) return;
    setDeleting(true);
    try {
      await productsApi.delete(product.id);
      toast.success("Produto removido");
      onDelete?.(product.id);
    } catch {
      toast.error("Erro ao remover produto");
      setDeleting(false);
    }
  }, [deleting, product.id, onDelete]);

  const handleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (isFavorited) {
        await favoritesApi.remove(product.id);
        setIsFavorited(false);
        toast.success("Removido dos favoritos");
      } else {
        await favoritesApi.add(product.id);
        setIsFavorited(true);
        toast.success("Salvo nos favoritos!");
      }
    } catch {
      toast.error("Faça login para salvar favoritos");
    } finally {
      setFavLoading(false);
    }
  }, [isFavorited, favLoading, product.id]);
  const marketplace = MARKETPLACE_CONFIG[product.marketplace];
  const scoreLabel = getOpportunityLabel(product.score);
  const scoreColor = getOpportunityColor(scoreLabel);

  const scoreLabels: Record<typeof scoreLabel, string> = {
    explosive: "Explosivo",
    high: "Alto",
    medium: "Médio",
    low: "Baixo",
    saturated: "Saturado",
  };

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="glass-card-hover overflow-hidden group"
    >
      {/* Image */}
      <div className="relative aspect-square bg-white/5 overflow-hidden">
        <Image
          src={imgSrc}
          alt={product.title}
          fill
          unoptimized
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImgSrc("https://placehold.co/400x400/1a1a2e/ffffff?text=Produto")}
        />

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", marketplace.bgColor)} style={{ color: marketplace.color }}>
            {marketplace.emoji} {marketplace.label}
          </span>
          {product.is_viral && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-500/20 text-yellow-300">
              🔥 Viral
            </span>
          )}
        </div>

        {/* Discount badge */}
        {product.discount && product.discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{product.discount}%
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 hover:bg-red-600/80"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          )}
          <button
            onClick={handleFavorite}
            disabled={favLoading}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          >
            <Heart className={cn("w-4 h-4 transition-colors", isFavorited ? "fill-red-400 text-red-400" : "text-white")} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={cn("p-3", !compact && "p-4")}>
        <Link href={`/products/${product.id}`}>
          <h3 className="font-medium text-white text-sm leading-tight line-clamp-2 hover:text-blue-300 transition-colors mb-2">
            {product.title}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-white">
            {formatCurrency(product.price, product.currency === "BRL" ? "BRL" : "USD", product.currency === "BRL" ? "pt-BR" : "en-US")}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-white/40 line-through">
              {formatCurrency(product.original_price, product.currency === "BRL" ? "BRL" : "USD", product.currency === "BRL" ? "pt-BR" : "en-US")}
            </span>
          )}
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400" />
            {product.rating}
          </span>
          <span>{formatNumber(product.sales)} vendas</span>
          {product.profit_margin && (
            <span className="text-green-400 font-medium">+{product.profit_margin}%</span>
          )}
        </div>

        {/* Score */}
        {!compact && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-white/40" />
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden w-16">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${product.score}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              </div>
              <span className={cn("text-xs font-bold", scoreColor)}>
                {product.score.toFixed(0)}
              </span>
            </div>
            <span className={cn("text-xs", scoreColor)}>{scoreLabels[scoreLabel]}</span>
          </div>
        )}

        {compact && (
          <div className="mt-2 flex items-center justify-between">
            <span className={cn("text-xs font-bold", scoreColor)}>Score: {product.score.toFixed(0)}</span>
            <Link href={product.url} target="_blank" className="text-white/30 hover:text-white/60">
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
