"use client";
import { motion } from "framer-motion";
import { Brain, TrendingUp, Bell, Search, BarChart3, ShoppingBag, Star, Megaphone } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Descoberta Inteligente",
    description: "Encontre produtos por palavra-chave, URL, imagem, categoria ou faixa de preço em 7 marketplaces simultâneos.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "IA e Machine Learning",
    description: "Algoritmos de IA detectam produtos virais, preveem crescimento e calculam o potencial de lucro automaticamente.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "Score de Oportunidade",
    description: "Score proprietário 0-100 calculado com base em 10 variáveis: vendas, crescimento, saturação, engajamento e mais.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Megaphone,
    title: "Radar de Anúncios",
    description: "Rastreie anúncios vencedores no Facebook, TikTok, Pinterest e Instagram. Salve copies, vídeos e thumbnails.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Bell,
    title: "Alertas em Tempo Real",
    description: "Receba alertas por Email, Telegram ou WhatsApp quando um produto viralizar, cair de preço ou entrar em promoção.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: BarChart3,
    title: "Histórico de Preços",
    description: "Acompanhe o histórico completo de preços e vendas. Identifique padrões sazonais e oportunidades de compra.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: ShoppingBag,
    title: "Rastreador de Promoções",
    description: "Detecta flash sales, cupons, cashback e descontos progressivos em tempo real em todos os marketplaces.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Star,
    title: "Favoritos & Coleções",
    description: "Salve produtos em coleções personalizadas, organize por nicho e exporte em CSV ou Excel com um clique.",
    color: "from-violet-500 to-purple-500",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-6">
            Funcionalidades Premium
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Tudo que você precisa para{" "}
            <span className="neon-text">dominar o e-commerce</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Uma plataforma completa com as ferramentas mais avançadas do mercado para descobrir produtos vencedores.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass-card p-6 cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 opacity-90`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
