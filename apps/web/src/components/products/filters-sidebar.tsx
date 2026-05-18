"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MARKETPLACE_CONFIG } from "@/lib/utils";
import type { ProductFilters, Marketplace } from "@/types";

interface FiltersSidebarProps {
  open: boolean;
  onClose: () => void;
  filters: ProductFilters;
  onChange: (filters: Partial<ProductFilters>) => void;
}

const categories = ["Eletrônicos", "Wearables", "Casa", "Informática", "Beleza", "Esportes", "Moda", "Brinquedos"];

export function FiltersSidebar({ open, onClose, filters, onChange }: FiltersSidebarProps) {
  const marketplaces = Object.keys(MARKETPLACE_CONFIG) as Marketplace[];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-[#0a0b0e] border-l border-white/10 z-50 overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-white text-lg">Filtros</h2>
              <button onClick={onClose} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Marketplaces */}
              <div>
                <h3 className="font-semibold text-white text-sm mb-3">Marketplace</h3>
                <div className="space-y-2">
                  {marketplaces.map((mp) => {
                    const config = MARKETPLACE_CONFIG[mp];
                    const selected = filters.marketplace?.includes(mp);
                    return (
                      <label key={mp} className="flex items-center gap-3 cursor-pointer group">
                        <Checkbox
                          checked={!!selected}
                          onCheckedChange={(checked) => {
                            const current = filters.marketplace || [];
                            onChange({
                              marketplace: checked
                                ? [...current, mp]
                                : current.filter((m) => m !== mp),
                            });
                          }}
                          className="border-white/20"
                        />
                        <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                          {config.emoji} {config.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Price range */}
              <div>
                <h3 className="font-semibold text-white text-sm mb-3">
                  Faixa de Preço: ${filters.min_price || 0} — ${filters.max_price || 50}
                </h3>
                <Slider
                  min={0}
                  max={200}
                  step={1}
                  value={[filters.min_price || 0, filters.max_price || 50]}
                  onValueChange={([min, max]) => onChange({ min_price: min, max_price: max })}
                  className="w-full"
                />
              </div>

              {/* Min score */}
              <div>
                <h3 className="font-semibold text-white text-sm mb-3">
                  Score Mínimo: {filters.min_score || 0}
                </h3>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[filters.min_score || 0]}
                  onValueChange={([v]) => onChange({ min_score: v })}
                  className="w-full"
                />
              </div>

              {/* Min rating */}
              <div>
                <h3 className="font-semibold text-white text-sm mb-3">Avaliação Mínima</h3>
                <div className="flex gap-2">
                  {[3, 3.5, 4, 4.5].map((r) => (
                    <button
                      key={r}
                      onClick={() => onChange({ min_rating: r })}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors ${
                        filters.min_rating === r
                          ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                          : "border-white/10 text-white/50 hover:border-white/30"
                      }`}
                    >
                      <Star className="w-3 h-3" />
                      {r}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-semibold text-white text-sm mb-3">Categoria</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        const current = filters.category || [];
                        onChange({
                          category: current.includes(cat)
                            ? current.filter((c) => c !== cat)
                            : [...current, cat],
                        });
                      }}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        filters.category?.includes(cat)
                          ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                          : "border-white/10 text-white/50 hover:border-white/30"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div>
                <h3 className="font-semibold text-white text-sm mb-3">Características</h3>
                <div className="space-y-2">
                  {[
                    { key: "is_dropshipping", label: "Dropshipping" },
                    { key: "is_viral", label: "Viral" },
                    { key: "in_promotion", label: "Em Promoção" },
                    { key: "free_shipping", label: "Frete Grátis" },
                  ].map((toggle) => (
                    <label key={toggle.key} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={!!(filters as any)[toggle.key]}
                        onCheckedChange={(checked) => onChange({ [toggle.key]: checked || undefined })}
                        className="border-white/20"
                      />
                      <Label className="text-sm text-white/70 cursor-pointer">{toggle.label}</Label>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20"
                  onClick={() => onChange({ marketplace: undefined, min_price: undefined, max_price: undefined, min_score: undefined, min_rating: undefined, category: undefined, is_dropshipping: undefined, is_viral: undefined, in_promotion: undefined, free_shipping: undefined })}
                >
                  Limpar
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 border-0"
                  onClick={onClose}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
