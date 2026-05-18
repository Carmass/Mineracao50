"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function LandingCTA() {
  return (
    <section className="py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden p-12 md:p-20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-cyan-600/10 border border-white/10 rounded-3xl" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/20 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-4" />
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Pronto para descobrir seu próximo{" "}
              <span className="neon-text">produto viral?</span>
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
              Comece grátis hoje. Sem cartão de crédito. Acesso imediato.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 border-0 text-base h-12 px-10 font-semibold"
            >
              <Link href="/login?mode=register">
                Começar grátis agora <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
