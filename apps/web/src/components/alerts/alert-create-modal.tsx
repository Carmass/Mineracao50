"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Bell } from "lucide-react";
import { alertsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { AlertType } from "@/types";

const ALERT_TYPES: { value: AlertType; label: string; description: string }[] = [
  { value: "product_viral", label: "Produto Viral", description: "Alerta quando um produto atingir alto score de oportunidade" },
  { value: "price_drop", label: "Queda de Preço", description: "Alerta quando o preço cair um percentual definido" },
  { value: "product_growing", label: "Produto Crescendo", description: "Alerta quando vendas aumentarem rapidamente" },
  { value: "high_demand", label: "Alta Demanda", description: "Alerta quando houver pico de demanda em uma categoria" },
  { value: "low_competition", label: "Baixa Concorrência", description: "Alerta quando nicho tiver poucos competidores" },
  { value: "promotion_started", label: "Promoção Iniciada", description: "Alerta quando um produto entrar em promoção" },
];

const CHANNELS = [
  { value: "email", label: "E-mail" },
  { value: "push", label: "Push" },
];

interface AlertCreateModalProps {
  open: boolean;
  initialType?: AlertType;
  onClose: () => void;
}

export function AlertCreateModal({ open, initialType, onClose }: AlertCreateModalProps) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<AlertType>(initialType ?? "product_viral");
  const [channels, setChannels] = useState<string[]>(["email"]);
  const [minScore, setMinScore] = useState("80");
  const [priceDrop, setPriceDrop] = useState("20");
  const [maxPrice, setMaxPrice] = useState("");
  const [marketplace, setMarketplace] = useState("");
  const [keywords, setKeywords] = useState("");

  const mutation = useMutation({
    mutationFn: alertsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alerta criado com sucesso!");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao criar alerta");
    },
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channels.length === 0) {
      toast.error("Selecione pelo menos um canal");
      return;
    }

    const conditions: Record<string, any> = {};
    if (type === "product_viral" || type === "product_growing" || type === "high_demand") {
      if (minScore) conditions.min_score = parseInt(minScore);
    }
    if (type === "price_drop") {
      if (priceDrop) conditions.price_drop_percentage = parseInt(priceDrop);
    }
    if (maxPrice) conditions.max_price = parseFloat(maxPrice);
    if (marketplace) conditions.marketplace = marketplace;
    if (keywords) conditions.keywords = keywords.split(",").map(k => k.trim()).filter(Boolean);

    mutation.mutate({ type, conditions, channels: channels as import("@/types").AlertChannel[], active: true });
  };

  const toggleChannel = (ch: string) => {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#13141a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-white">Novo Alerta</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Type */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">Tipo de alerta</label>
            <div className="grid grid-cols-2 gap-2">
              {ALERT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`text-left p-3 rounded-xl border text-sm transition-colors ${
                    type === t.value
                      ? "border-blue-500 bg-blue-500/10 text-white"
                      : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs mt-0.5 opacity-70 line-clamp-1">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <label className="text-sm text-white/60 block">Condições</label>

            {(type === "product_viral" || type === "product_growing" || type === "high_demand") && (
              <div>
                <label className="text-xs text-white/40 mb-1 block">Score mínimo (0–100)</label>
                <Input
                  type="number" min="0" max="100" value={minScore}
                  onChange={e => setMinScore(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-9"
                />
              </div>
            )}

            {type === "price_drop" && (
              <div>
                <label className="text-xs text-white/40 mb-1 block">Queda mínima (%)</label>
                <Input
                  type="number" min="1" max="100" value={priceDrop}
                  onChange={e => setPriceDrop(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-9"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-white/40 mb-1 block">Preço máximo (opcional)</label>
              <Input
                type="number" min="0" placeholder="Ex: 200" value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="bg-white/5 border-white/10 text-white h-9"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Marketplace (opcional)</label>
              <select
                value={marketplace}
                onChange={e => setMarketplace(e.target.value)}
                className="w-full h-9 text-sm rounded-md bg-white/5 border border-white/10 text-white px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="aliexpress">AliExpress</option>
                <option value="shopee">Shopee</option>
                <option value="mercadolivre">Mercado Livre</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Palavras-chave (separadas por vírgula, opcional)</label>
              <Input
                placeholder="Ex: smartwatch, fone, led" value={keywords}
                onChange={e => setKeywords(e.target.value)}
                className="bg-white/5 border-white/10 text-white h-9"
              />
            </div>
          </div>

          {/* Channels */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">Canais de notificação</label>
            <div className="flex gap-2">
              {CHANNELS.map(ch => (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => toggleChannel(ch.value)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    channels.includes(ch.value)
                      ? "border-blue-500 bg-blue-500/10 text-blue-300"
                      : "border-white/10 text-white/50 hover:border-white/20"
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 border-white/20" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Salvando..." : "Criar Alerta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
