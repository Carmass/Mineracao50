"use client";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Rafael Mendes",
    role: "Dropshipper — SP",
    avatar: "RM",
    text: "Encontrei 3 produtos virais no primeiro dia. O score de oportunidade é incrível — fiz R$ 8.000 em 15 dias com os produtos que o sistema indicou.",
    rating: 5,
  },
  {
    name: "Ana Paula Costa",
    role: "Afiliada Amazon",
    avatar: "AC",
    text: "A plataforma me economiza 4 horas por dia de pesquisa manual. Os alertas de queda de preço são perfeitos para meus conteúdos.",
    rating: 5,
  },
  {
    name: "Lucas Ferreira",
    role: "Lojista Shopee",
    avatar: "LF",
    text: "O radar de anúncios vencedores do Facebook mudou minha estratégia. Agora sei exatamente o que está performando antes de investir em tráfego.",
    rating: 5,
  },
  {
    name: "Mariana Santos",
    role: "E-commerce Manager",
    avatar: "MS",
    text: "Usávamos 3 ferramentas diferentes. MineraçãoPro substituiu todas com um custo menor. O histórico de preços é o diferencial.",
    rating: 5,
  },
  {
    name: "Pedro Alves",
    role: "Private Label",
    avatar: "PA",
    text: "A IA de tendências identificou um nicho que triplicou minhas vendas. A análise de concorrentes me deu uma vantagem enorme.",
    rating: 5,
  },
  {
    name: "Camila Rocha",
    role: "Influencer & Afiliada",
    avatar: "CR",
    text: "Consigo criar conteúdo de review com os insights de IA em minutos. Os dados de engajamento de produtos são perfeitos para escolher o que recomendar.",
    rating: 5,
  },
];

export function LandingTestimonials() {
  return (
    <section id="testimonials" className="py-32 bg-gradient-to-b from-transparent to-white/[0.02]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Quem usa,{" "}
            <span className="neon-text">recomenda</span>
          </h2>
          <p className="text-white/60 text-lg">+8.500 empreendedores confiam na plataforma</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star key={si} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-white/40 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
