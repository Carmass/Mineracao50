"use client";
import { motion } from "framer-motion";
import { formatNumber } from "@/lib/utils";

const stats = [
  { label: "Produtos Analisados", value: 10_000_000, suffix: "+" },
  { label: "Usuários Ativos", value: 8500, suffix: "+" },
  { label: "Marketplaces", value: 7, suffix: "" },
  { label: "Produtos Virais Detectados", value: 125000, suffix: "+" },
];

export function LandingStats() {
  return (
    <section className="py-20 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-black neon-text mb-2">
                {formatNumber(stat.value)}{stat.suffix}
              </div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
