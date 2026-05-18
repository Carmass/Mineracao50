"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, TrendingUp, Zap } from "lucide-react";

const floatingProducts = [
  { name: "Mini Projetor 4K", price: "$45.99", score: 94, top: "15%", left: "5%", delay: 0 },
  { name: "Smartwatch Fitness", price: "$28.99", score: 87, top: "60%", left: "3%", delay: 0.5 },
  { name: "LED RGB Gamer", price: "$12.50", score: 91, top: "25%", right: "5%", delay: 0.8 },
  { name: "Mochila Anti-Furto", price: "$35.00", score: 82, top: "70%", right: "4%", delay: 0.3 },
];

export function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-2/3 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[80px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/8 rounded-full blur-[60px]" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Floating product cards */}
      {floatingProducts.map((p, i) => (
        <motion.div
          key={i}
          className="absolute hidden lg:flex items-center gap-3 glass-card px-4 py-3 max-w-[200px]"
          style={{ top: p.top, left: p.left, right: (p as any).right }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: p.delay + 1, duration: 0.6 }}
        >
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
            className="w-full"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Viral</span>
            </div>
            <p className="text-xs text-white/80 font-medium truncate">{p.name}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-bold text-white">{p.price}</span>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{p.score}</span>
            </div>
          </motion.div>
        </motion.div>
      ))}

      {/* Main content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="mb-6 bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 cursor-default">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by IA — Mais de 10M produtos analisados
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black leading-[1.05] mb-6"
        >
          Descubra{" "}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Produtos Virais
          </span>
          <br />
          Antes de Todo Mundo
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Mineração de produtos com IA em AliExpress, Shopee e Amazon.
          Encontre oportunidades de dropshipping, anúncios vencedores e tendências antes da concorrência.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 border-0 text-base h-12 px-8 font-semibold"
          >
            <Link href="/login?mode=register">
              Começar grátis <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/20 hover:bg-white/5 text-base h-12 px-8"
          >
            <Link href="#features">
              <Zap className="mr-2 w-4 h-4" />
              Ver demo
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 flex items-center justify-center gap-8 text-sm text-white/40"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span>+50k produtos/dia</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>7 Marketplaces</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Score proprietário</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
