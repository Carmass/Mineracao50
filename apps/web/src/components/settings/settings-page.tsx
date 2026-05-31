"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Cpu, Palette, Save, Check, Plug, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

const TABS = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "scraper", label: "Scraper", icon: Cpu },
  { id: "security", label: "Segurança", icon: Shield },
  { id: "appearance", label: "Aparência", icon: Palette },
  { id: "integrations", label: "Integrações", icon: Plug },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-white/10"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-1"}`} />
    </button>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0 ml-4">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const [tab, setTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [notifs, setNotifs] = useState({ email: true, push: false, telegram: false, viral_alert: true, price_drop: true, trend_alert: false });
  const [scraper, setScraper] = useState({ auto_run: true, interval_hours: 4, use_python: true, use_flaresolverr: false, max_products: 50 });

  const { data: integrations, isLoading: loadingIntegrations, refetch: refetchIntegrations } = useQuery({
    queryKey: ["integrations-status"],
    queryFn: () => fetch("/api/integrations/status").then(r => r.json()),
    enabled: tab === "integrations",
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-white/60" />
          Configurações
        </h1>
        <p className="text-sm text-white/50 mt-1">Gerencie sua conta e preferências da plataforma</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg flex-shrink-0 transition-colors ${
                tab === t.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {tab === "profile" && (
          <div className="glass-card p-6 space-y-5">
            <h2 className="font-semibold text-white">Informações do Perfil</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Nome completo</label>
                <Input placeholder="Seu nome" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">E-mail</label>
                <Input placeholder="seu@email.com" type="email" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Empresa / Loja</label>
                <Input placeholder="Nome da sua empresa" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Telefone (WhatsApp)</label>
                <Input placeholder="+55 11 99999-9999" className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Nicho principal</label>
              <Input placeholder="Ex: eletrônicos, moda, casa e cozinha..." className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>
        )}

        {tab === "notifications" && (
          <div className="glass-card p-6">
            <h2 className="font-semibold text-white mb-4">Canais de Notificação</h2>
            <Row label="E-mail" description="Receba alertas por e-mail">
              <Toggle checked={notifs.email} onChange={(v) => setNotifs((n) => ({ ...n, email: v }))} />
            </Row>
            <Row label="Push (navegador)" description="Notificações no navegador">
              <Toggle checked={notifs.push} onChange={(v) => setNotifs((n) => ({ ...n, push: v }))} />
            </Row>
            <Row label="Telegram" description="Bot de alertas no Telegram">
              <Toggle checked={notifs.telegram} onChange={(v) => setNotifs((n) => ({ ...n, telegram: v }))} />
            </Row>

            <h2 className="font-semibold text-white mb-4 mt-6">Tipos de Alertas</h2>
            <Row label="Produto viral detectado" description="Quando um produto ultrapassa score 80">
              <Toggle checked={notifs.viral_alert} onChange={(v) => setNotifs((n) => ({ ...n, viral_alert: v }))} />
            </Row>
            <Row label="Queda de preço" description="Produtos com queda acima de 30%">
              <Toggle checked={notifs.price_drop} onChange={(v) => setNotifs((n) => ({ ...n, price_drop: v }))} />
            </Row>
            <Row label="Nova tendência" description="Keywords com crescimento acima de 100%">
              <Toggle checked={notifs.trend_alert} onChange={(v) => setNotifs((n) => ({ ...n, trend_alert: v }))} />
            </Row>
          </div>
        )}

        {tab === "scraper" && (
          <div className="glass-card p-6">
            <h2 className="font-semibold text-white mb-4">Configurações do Scraper</h2>
            <Row label="Scraping automático" description="Buscar produtos automaticamente em intervalos regulares">
              <Toggle checked={scraper.auto_run} onChange={(v) => setScraper((s) => ({ ...s, auto_run: v }))} />
            </Row>
            <Row label="Usar scraper Python" description="Usa curl-cffi para melhor bypass anti-bot (requer Python instalado)">
              <Toggle checked={scraper.use_python} onChange={(v) => setScraper((s) => ({ ...s, use_python: v }))} />
            </Row>
            <Row label="Usar FlareSolverr" description="Bypass Cloudflare via Docker (requer Docker + FlareSolverr)">
              <Toggle checked={scraper.use_flaresolverr} onChange={(v) => setScraper((s) => ({ ...s, use_flaresolverr: v }))} />
            </Row>
            <div className="pt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Intervalo de busca (horas)</label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={scraper.interval_hours}
                  onChange={(e) => setScraper((s) => ({ ...s, interval_hours: +e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Máx. produtos por busca</label>
                <Input
                  type="number"
                  min={10}
                  max={500}
                  value={scraper.max_products}
                  onChange={(e) => setScraper((s) => ({ ...s, max_products: +e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
              Status: Python disponível · FlareSolverr: não detectado · Último scraping: agora mesmo
            </div>
          </div>
        )}

        {tab === "security" && (
          <div className="glass-card p-6 space-y-5">
            <h2 className="font-semibold text-white">Segurança da Conta</h2>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Senha atual</label>
              <Input type="password" placeholder="••••••••" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Nova senha</label>
              <Input type="password" placeholder="••••••••" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Confirmar nova senha</label>
              <Input type="password" placeholder="••••••••" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="pt-2">
              <Row label="Autenticação em dois fatores" description="Proteção extra para sua conta">
                <Toggle checked={false} onChange={() => {}} />
              </Row>
            </div>
          </div>
        )}

        {tab === "appearance" && (
          <div className="glass-card p-6">
            <h2 className="font-semibold text-white mb-4">Aparência</h2>
            <Row label="Tema escuro" description="Interface sempre no modo escuro">
              <Toggle checked={true} onChange={() => {}} />
            </Row>
            <Row label="Animações" description="Efeitos de transição e hover">
              <Toggle checked={true} onChange={() => {}} />
            </Row>
            <Row label="Cards compactos" description="Exibição mais densa de produtos">
              <Toggle checked={false} onChange={() => {}} />
            </Row>
          </div>
        )}

        {tab === "integrations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Status das Integrações</h2>
              <Button variant="outline" size="sm" className="border-white/20 gap-2" onClick={() => refetchIntegrations()}>
                <RefreshCw className="w-4 h-4" />
                Verificar
              </Button>
            </div>

            {loadingIntegrations ? (
              <div className="glass-card p-6 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white/40 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* AliExpress */}
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">🛒</div>
                      <div>
                        <p className="font-semibold text-white">AliExpress Affiliate</p>
                        <p className="text-xs text-white/40">API oficial de afiliados (IOP)</p>
                      </div>
                    </div>
                    {integrations?.aliexpress?.configured ? (
                      integrations.aliexpress.token_valid ? (
                        <div className="flex items-center gap-1.5 text-green-400 text-sm">
                          <CheckCircle2 className="w-4 h-4" /> Ativo
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-yellow-400 text-sm">
                          <XCircle className="w-4 h-4" /> Token expirado
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-1.5 text-white/40 text-sm">
                        <XCircle className="w-4 h-4" /> Não configurado
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-white/30 space-y-0.5">
                    <p>App Key: {integrations?.aliexpress?.configured ? "✓ Configurado" : "Ausente — defina ALI_APPKEY no .env"}</p>
                    {integrations?.aliexpress?.expires_at && (
                      <p>Token válido até: {integrations.aliexpress.expires_at}</p>
                    )}
                  </div>
                </div>

                {/* Mercado Livre */}
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-xl">🛍️</div>
                      <div>
                        <p className="font-semibold text-white">Mercado Livre</p>
                        <p className="text-xs text-white/40">API oficial (OAuth2 client_credentials)</p>
                      </div>
                    </div>
                    {integrations?.mercadolivre?.configured ? (
                      <div className="flex items-center gap-1.5 text-green-400 text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Configurado
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-white/40 text-sm">
                        <XCircle className="w-4 h-4" /> Não configurado
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white/30">
                    {integrations?.mercadolivre?.configured
                      ? "✓ ML_APP_ID e ML_SECRET_KEY configurados"
                      : "Defina ML_APP_ID e ML_SECRET_KEY no .env dos scrapers"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-violet-600 border-0 gap-2">
          {saved ? <><Check className="w-4 h-4" />Salvo!</> : <><Save className="w-4 h-4" />Salvar alterações</>}
        </Button>
      </div>
    </div>
  );
}
