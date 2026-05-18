"use client";
import { Tag, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const MOCK_FLASH = [
  { id: "1", name: "Fone Bluetooth NC Pro", originalPrice: 149.99, promoPrice: 49.90, discount: 67, endsIn: 3600 * 2 + 1800 },
  { id: "2", name: "Carregador 65W GaN USB-C", originalPrice: 89.99, promoPrice: 22.50, discount: 75, endsIn: 3600 * 5 },
  { id: "3", name: "Mouse Gamer 12000 DPI RGB", originalPrice: 199.99, promoPrice: 79.90, discount: 60, endsIn: 3600 },
  { id: "4", name: "Power Bank 20000mAh QC", originalPrice: 129.99, promoPrice: 39.99, discount: 69, endsIn: 3600 * 8 },
];

function Countdown({ seconds }: { seconds: number }) {
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return <span className="font-mono text-xs text-red-400">--:--:--</span>;

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return (
    <span className="font-mono text-xs text-red-400">
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export function DashboardFlashSales() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-red-400" />
          <h2 className="font-bold text-white">Flash Sales</h2>
          <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full animate-pulse">AO VIVO</span>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs text-white/50 hover:text-white">
          <Link href="/promotions">Ver todas</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {MOCK_FLASH.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Tag className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{item.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock className="w-3 h-3 text-white/30" />
                <Countdown seconds={item.endsIn} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white">{formatCurrency(item.promoPrice, "BRL", "pt-BR")}</div>
              <div className="text-xs text-white/40 line-through">{formatCurrency(item.originalPrice, "BRL", "pt-BR")}</div>
            </div>
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0">
              -{item.discount}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
