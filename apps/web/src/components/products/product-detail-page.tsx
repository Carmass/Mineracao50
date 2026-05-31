"use client";
import { useQuery } from "@tanstack/react-query";
import { productsApi, aiApi } from "@/lib/api";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, Heart, ExternalLink,
  TrendingUp, Sparkles, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatCurrency, formatNumber, MARKETPLACE_CONFIG, getOpportunityLabel, getOpportunityColor } from "@/lib/utils";
import { PriceHistoryChart } from "@/components/products/price-history-chart";
import { toast } from "sonner";
import { favoritesApi } from "@/lib/api";

interface ProductDetailPageProps {
  id: string;
}

export function ProductDetailPage({ id }: ProductDetailPageProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [aiInsight, setAiInsight] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  async function handleFavorite() {
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (isFavorited) {
        await favoritesApi.remove(id);
        setIsFavorited(false);
        toast.success("Removido dos favoritos");
      } else {
        await favoritesApi.add(id);
        setIsFavorited(true);
        toast.success("Salvo nos favoritos!");
      }
    } catch {
      toast.error("Faça login para salvar favoritos");
    } finally {
      setFavLoading(false);
    }
  }

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(id),
  });

  async function getAIInsight() {
    setLoadingAI(true);
    try {
      const result = await aiApi.productInsight(id);
      setAiInsight(result.insights);
    } catch {
      toast.error("Erro ao gerar insight");
    } finally {
      setLoadingAI(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-white/5 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-white/50">Produto não encontrado</p>
        <Button asChild variant="outline" className="mt-4 border-white/20">
          <Link href="/products">Voltar</Link>
        </Button>
      </div>
    );
  }

  const mp = MARKETPLACE_CONFIG[product.marketplace];
  const scoreLabel = getOpportunityLabel(product.score);
  const scoreColor = getOpportunityColor(scoreLabel);
  const images = product.images.length > 0 ? product.images : ["https://placehold.co/600x600"];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back button */}
      <Link href="/products" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Voltar para produtos
      </Link>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-white/5 relative">
            <Image
              src={images[selectedImage]}
              alt={product.title}
              fill
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {product.discount && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{product.discount}%
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.slice(0, 6).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    selectedImage === i ? "border-blue-500" : "border-white/10"
                  }`}
                >
                  <Image src={img} alt="" width={64} height={64} className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {/* Marketplace + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge style={{ backgroundColor: `${mp.color}20`, color: mp.color, border: `1px solid ${mp.color}40` }}>
              {mp.emoji} {mp.label}
            </Badge>
            {product.is_viral && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">🔥 Viral</Badge>}
            {product.in_promotion && <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Promoção</Badge>}
            {product.free_shipping && <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Frete Grátis</Badge>}
          </div>

          <h1 className="text-2xl font-bold text-white leading-tight">{product.title}</h1>

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-white">
              {formatCurrency(product.price, product.currency === "BRL" ? "BRL" : "USD", "pt-BR")}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-lg text-white/40 line-through mb-1">
                {formatCurrency(product.original_price, product.currency === "BRL" ? "BRL" : "USD", "pt-BR")}
              </span>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-white">{product.rating}</span>
              </div>
              <p className="text-xs text-white/50">{product.reviews > 0 ? `${formatNumber(product.reviews)} avaliações` : "—"}</p>
            </div>
            <div className="glass-card p-3 text-center">
              <div className="font-bold text-white mb-1">{formatNumber(product.sales)}</div>
              <p className="text-xs text-white/50">Vendas</p>
            </div>
            <div className="glass-card p-3 text-center">
              <div className={`font-bold text-xl mb-1 ${scoreColor}`}>{product.score.toFixed(0)}</div>
              <p className="text-xs text-white/50">Score</p>
            </div>
          </div>

          {/* Opportunity Score bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Score de Oportunidade</span>
              <span className={`text-sm font-bold ${scoreColor}`}>{scoreLabel}</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${product.score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              />
            </div>
          </div>

          {/* Profit margin */}
          {product.profit_margin && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-bold text-green-300">Margem estimada: +{product.profit_margin}%</p>
                <p className="text-xs text-white/50">Baseado no preço médio de venda vs custo</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button asChild className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 border-0">
              <Link href={product.url} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver no {mp.label}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-white/20"
              onClick={handleFavorite}
              disabled={favLoading}
            >
              <Heart className={isFavorited ? "w-4 h-4 fill-red-400 text-red-400" : "w-4 h-4"} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-white/20"
              onClick={async () => {
                const url = window.location.href;
                if (navigator.share) {
                  await navigator.share({ title: product.title, url }).catch(() => null);
                } else {
                  await navigator.clipboard.writeText(url);
                  toast.success("Link copiado!");
                }
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* AI Insight */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-white text-sm">Insight com IA</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-xs h-7"
                onClick={getAIInsight}
                disabled={loadingAI}
              >
                {loadingAI ? "Gerando..." : "Gerar"}
              </Button>
            </div>
            {aiInsight ? (
              <p className="text-sm text-white/70 leading-relaxed">{aiInsight}</p>
            ) : (
              <p className="text-sm text-white/40">Clique em "Gerar" para obter insights de IA sobre este produto.</p>
            )}
          </div>
        </div>
      </div>

      {/* Price history */}
      <PriceHistoryChart productId={id} />
    </div>
  );
}
