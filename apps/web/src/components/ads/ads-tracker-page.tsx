"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Megaphone, Heart, Share2, MessageCircle, ExternalLink, RefreshCw } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { adsApi } from "@/lib/api";
import type { AdPlatform, ProductAd } from "@/types";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const PLATFORMS: { key: AdPlatform; label: string; color: string; emoji: string }[] = [
  { key: "facebook", label: "Facebook", color: "#1877f2", emoji: "📘" },
  { key: "tiktok", label: "TikTok", color: "#ff0050", emoji: "🎵" },
  { key: "pinterest", label: "Pinterest", color: "#e60023", emoji: "📌" },
  { key: "instagram", label: "Instagram", color: "#c13584", emoji: "📷" },
];

export function AdsTrackerPage() {
  const [platform, setPlatform] = useState<string>("all");

  const { data: adsResponse, isLoading, refetch } = useQuery({
    queryKey: ["ads", platform],
    queryFn: () => adsApi.list({ platform: platform === "all" ? undefined : platform as AdPlatform }),
    staleTime: 5 * 60 * 1000,
  });

  const ads = (adsResponse as any)?.data ?? adsResponse ?? [];
  const filtered = Array.isArray(ads) ? ads : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-orange-400" />
            Radar de Anúncios
          </h1>
          <p className="text-sm text-white/50 mt-1">Anúncios vencedores detectados em tempo real</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/20" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Platform filter */}
      <div className="flex gap-3">
        <button
          onClick={() => setPlatform("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${platform === "all" ? "bg-white/15 text-white" : "text-white/50 hover:bg-white/5"}`}
        >
          Todos
        </button>
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPlatform(p.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${platform === p.key ? "bg-white/15 text-white" : "text-white/50 hover:bg-white/5"}`}
          >
            <span>{p.emoji}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Ads grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filtered.map((ad: any, i: number) => {
            const platformConf = PLATFORMS.find(p => p.key === ad.platform) ?? PLATFORMS[0];
            const thumb = ad.thumbnail_url || ad.thumbnail || "https://images.unsplash.com/photo-1561069934-eee225952461?w=400&h=300&fit=crop";
            const title = ad.product?.title ?? ad.product ?? "Anúncio";
            return (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="glass-card overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-white/5 overflow-hidden">
                  <Image
                    src={thumb}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm" style={{ backgroundColor: `${platformConf.color}50`, color: "#fff" }}>
                      {platformConf.emoji} {platformConf.label}
                    </span>
                  </div>
                  {ad.is_active && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                  {(ad.landing_url || ad.product?.url) && (
                    <a
                      href={ad.landing_url || ad.product?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-white" />
                    </a>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-white text-sm mb-2 line-clamp-1">{title}</h3>
                  {ad.ad_copy && <p className="text-xs text-white/50 line-clamp-2 mb-3">{ad.ad_copy}</p>}

                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-400" />
                      {formatNumber(ad.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-blue-400" />
                      {formatNumber(ad.comments)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-3 h-3 text-green-400" />
                      {formatNumber(ad.shares)}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="text-xs text-white/40">Engajamento total</div>
                    <div className="text-sm font-bold text-white">{formatNumber(ad.engagement)}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
