"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import { PLAN_FEATURES, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const plans = ["free", "starter", "pro", "enterprise"] as const;

export function LandingPricing() {
  return (
    <section id="pricing" className="py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Planos para todos os{" "}
            <span className="neon-text">perfis</span>
          </h2>
          <p className="text-white/60 text-lg">Comece grátis. Faça upgrade quando precisar de mais poder.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((planKey, i) => {
            const plan = PLAN_FEATURES[planKey];
            const isPro = planKey === "pro";
            return (
              <motion.div
                key={planKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "relative rounded-2xl p-6 border",
                  isPro
                    ? "bg-gradient-to-b from-blue-600/20 to-purple-600/10 border-blue-500/50"
                    : "glass-card border-white/10"
                )}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> MAIS POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-bold text-xl text-white mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    {plan.price_monthly === 0 ? (
                      <span className="text-3xl font-black text-white">Grátis</span>
                    ) : (
                      <>
                        <span className="text-3xl font-black text-white">
                          {formatCurrency(plan.price_monthly, "BRL")}
                        </span>
                        <span className="text-white/50 text-sm mb-1">/mês</span>
                      </>
                    )}
                  </div>
                  {plan.price_yearly > 0 && (
                    <p className="text-xs text-green-400 mt-1">
                      ou {formatCurrency(plan.price_yearly, "BRL")}/ano (economia de 30%)
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 text-sm">
                  {[
                    `${plan.products_per_day === -1 ? "Ilimitado" : plan.products_per_day} produtos/dia`,
                    `${plan.saved_products === -1 ? "Ilimitados" : plan.saved_products} favoritos`,
                    `${plan.alerts === -1 ? "Ilimitados" : plan.alerts} alertas`,
                    `${plan.marketplaces} marketplaces`,
                    plan.ai_insights && "Insights com IA",
                    plan.ads_tracker && "Rastreador de anúncios",
                    plan.price_history && "Histórico de preços",
                    plan.api_access && "Acesso à API",
                    plan.priority_support && "Suporte prioritário",
                  ]
                    .filter(Boolean)
                    .map((feature, fi) => (
                      <li key={fi} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-white/70">{feature as string}</span>
                      </li>
                    ))}
                </ul>

                <Button
                  asChild
                  className={cn(
                    "w-full",
                    isPro
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 border-0 hover:opacity-90"
                      : "variant-outline border-white/20 hover:bg-white/5"
                  )}
                  variant={isPro ? "default" : "outline"}
                >
                  <Link href={`/login?mode=register&plan=${planKey}`}>
                    {planKey === "free" ? "Começar grátis" : `Assinar ${plan.name}`}
                  </Link>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
