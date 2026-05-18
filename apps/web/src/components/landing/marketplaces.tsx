"use client";
import { motion } from "framer-motion";

const marketplaces = [
  { name: "AliExpress", emoji: "🛒", color: "#e52e2e", products: "500M+" },
  { name: "Shopee", emoji: "🛍️", color: "#f97316", products: "200M+" },
  { name: "Amazon", emoji: "📦", color: "#f59e0b", products: "350M+" },
  { name: "Temu", emoji: "🏪", color: "#8b5cf6", products: "50M+" },
  { name: "Mercado Livre", emoji: "🏬", color: "#facc15", products: "80M+" },
  { name: "CJ Dropshipping", emoji: "📫", color: "#06b6d4", products: "40M+" },
  { name: "Alibaba", emoji: "🏭", color: "#f97316", products: "180M+" },
];

export function LandingMarketplaces() {
  return (
    <section id="marketplaces" className="py-32 bg-gradient-to-b from-transparent to-white/[0.02]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            7 Marketplaces,{" "}
            <span className="neon-text">1 Plataforma</span>
          </h2>
          <p className="text-white/60 text-lg">
            Monitore todos os principais marketplaces de uma só vez, com scraping em tempo real.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {marketplaces.map((mp, i) => (
            <motion.div
              key={mp.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="glass-card p-4 text-center cursor-default"
            >
              <div className="text-3xl mb-2">{mp.emoji}</div>
              <div className="text-xs font-semibold text-white mb-1">{mp.name}</div>
              <div className="text-xs text-white/40">{mp.products}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
