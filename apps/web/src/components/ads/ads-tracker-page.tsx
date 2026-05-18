"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Heart, Share2, MessageCircle, Play, ExternalLink } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { AdPlatform } from "@/types";
import { Button } from "@/components/ui/button";

const PLATFORMS: { key: AdPlatform; label: string; color: string; emoji: string }[] = [
  { key: "facebook", label: "Facebook", color: "#1877f2", emoji: "📘" },
  { key: "tiktok", label: "TikTok", color: "#ff0050", emoji: "🎵" },
  { key: "pinterest", label: "Pinterest", color: "#e60023", emoji: "📌" },
  { key: "instagram", label: "Instagram", color: "#c13584", emoji: "📷" },
];

const MOCK_ADS = [
  { id: "1", platform: "facebook" as AdPlatform, product: "Mini Projetor 4K WiFi", thumbnail: "https://placehold.co/400x300/1a1a2e/60a5fa?text=Projetor+4K+Ad", ad_copy: "🔥 Transforme qualquer parede em cinema! Mini Projetor 4K com WiFi - de R$899 por apenas R$249. Frete grátis! ✅ Garantia 1 ano", engagement: 245000, likes: 18500, comments: 3200, shares: 8900, is_active: true, first_seen_at: "2024-01-15" },
  { id: "2", platform: "tiktok" as AdPlatform, product: "LED RGB Gamer Setup", thumbnail: "https://placehold.co/400x300/1a2e1a/22c55e?text=LED+RGB+TikTok", ad_copy: "Setup dos sonhos por menos de R$50! LED RGB que muda sua vida 🎮✨ Link na bio com desconto exclusivo!", engagement: 892000, likes: 67000, comments: 12400, shares: 34500, is_active: true, first_seen_at: "2024-01-20" },
  { id: "3", platform: "instagram" as AdPlatform, product: "Smartwatch Fitness Pro", thumbnail: "https://placehold.co/400x300/2e1a2e/c13584?text=Smartwatch+IG", ad_copy: "Cuide da sua saúde com estilo 💪⌚ Smartwatch com GPS, Monitor Cardíaco e 7 dias de bateria. Só R$189!", engagement: 134000, likes: 9800, comments: 1560, shares: 4200, is_active: true, first_seen_at: "2024-01-18" },
  { id: "4", platform: "facebook" as AdPlatform, product: "Mochila Anti-Furto USB", thumbnail: "https://placehold.co/400x300/2e2e1a/f59e0b?text=Mochila+Segura", ad_copy: "Viaje com segurança! Mochila com cadeado embutido + porta USB + espaço para notebook. Já são +50.000 felizes! 🎒", engagement: 178000, likes: 14200, comments: 2890, shares: 6700, is_active: true, first_seen_at: "2024-01-12" },
];

export function AdsTrackerPage() {
  const [platform, setPlatform] = useState<string>("all");
  const [selectedAd, setSelectedAd] = useState<typeof MOCK_ADS[0] | null>(null);

  const filtered = platform === "all" ? MOCK_ADS : MOCK_ADS.filter(a => a.platform === platform);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-orange-400" />
          Radar de Anúncios
        </h1>
        <p className="text-sm text-white/50 mt-1">Anúncios vencedores detectados em tempo real</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filtered.map((ad, i) => {
          const platformConf = PLATFORMS.find(p => p.key === ad.platform)!;
          return (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card overflow-hidden cursor-pointer group"
              onClick={() => setSelectedAd(ad)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-white/5">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${ad.thumbnail})`, backgroundSize: "cover" }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${platformConf.color}30`, color: platformConf.color }}>
                    {platformConf.emoji} {platformConf.label}
                  </span>
                </div>
                {ad.is_active && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-white text-sm mb-2">{ad.product}</h3>
                <p className="text-xs text-white/50 line-clamp-2 mb-3">{ad.ad_copy}</p>

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
    </div>
  );
}
