"use client";
import { motion } from "framer-motion";
import { Shield, Users, Activity, Database, Cpu, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const SYSTEM_STATS = [
  { label: "Total de Usuários", value: 8542, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
  { label: "Produtos Indexados", value: 10432187, icon: Database, color: "text-green-400", bg: "bg-green-500/10" },
  { label: "Workers Ativos", value: 8, icon: Cpu, color: "text-purple-400", bg: "bg-purple-500/10" },
  { label: "Jobs na Fila", value: 234, icon: Activity, color: "text-yellow-400", bg: "bg-yellow-500/10" },
];

const WORKERS = [
  { name: "AliExpress Scraper", status: "running", jobs_done: 4521, last_run: "2 min atrás", queue: "scraping" },
  { name: "Shopee Scraper", status: "running", jobs_done: 3210, last_run: "5 min atrás", queue: "scraping" },
  { name: "Amazon Scraper", status: "running", jobs_done: 1890, last_run: "8 min atrás", queue: "scraping" },
  { name: "AI Analysis Worker", status: "running", jobs_done: 8932, last_run: "1 min atrás", queue: "ai" },
  { name: "Notification Worker", status: "running", jobs_done: 2341, last_run: "30 seg atrás", queue: "notifications" },
  { name: "Trend Analysis Worker", status: "idle", jobs_done: 892, last_run: "15 min atrás", queue: "analysis" },
  { name: "Promotion Detector", status: "running", jobs_done: 1234, last_run: "3 min atrás", queue: "scraping" },
  { name: "Price History Worker", status: "error", jobs_done: 445, last_run: "1 hora atrás", queue: "default" },
];

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-6 h-6 text-red-400" />
        <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SYSTEM_STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-4"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-black text-white">{formatNumber(stat.value)}</div>
              <div className="text-xs text-white/50 mt-1">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Workers status */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Workers & Scrapers
          </h2>
          <Button variant="outline" size="sm" className="border-white/20 text-xs">
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Atualizar
          </Button>
        </div>

        <div className="space-y-3">
          {WORKERS.map((worker, i) => (
            <div key={worker.name} className="flex items-center gap-4 p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
              <div className="flex-shrink-0">
                {worker.status === "running" ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : worker.status === "idle" ? (
                  <div className="w-4 h-4 rounded-full bg-yellow-400/50" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{worker.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    worker.status === "running" ? "bg-green-500/20 text-green-300" :
                    worker.status === "idle" ? "bg-yellow-500/20 text-yellow-300" :
                    "bg-red-500/20 text-red-300"
                  }`}>
                    {worker.status}
                  </span>
                  <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{worker.queue}</span>
                </div>
              </div>

              <div className="text-right text-xs text-white/40">
                <div>{formatNumber(worker.jobs_done)} jobs</div>
                <div>{worker.last_run}</div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-white/40 hover:text-white px-2">
                  {worker.status === "error" ? "Reiniciar" : "Logs"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
