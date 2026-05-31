"use client";
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Grid3X3, List, SlidersHorizontal, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { FiltersSidebar } from "@/components/products/filters-sidebar";
import { ProductsTable } from "@/components/products/products-table";
import { productsApi } from "@/lib/api";
import type { ProductFilters } from "@/types";
import { debounce } from "@/lib/utils";

type ViewMode = "grid" | "table";
type ScrapeStatus = "idle" | "loading" | "success" | "error";

export function ProductsDiscovery() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ProductFilters>({ per_page: 24, page: 1, sort_by: "score" });
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>("idle");
  const [scrapeResult, setScrapeResult] = useState<{ saved: number; fetched: number; source: string } | null>(null);
  const [scrapeLimit, setScrapeLimit] = useState<number>(20);
  const queryClient = useQueryClient();

  const debouncedSearch = useCallback(
    debounce((q: string) => setFilters((f) => ({ ...f, query: q, page: 1 })), 400),
    []
  );

  const handleScrape = useCallback(async () => {
    setScrapeStatus("loading");
    setScrapeResult(null);
    try {
      const keyword = searchQuery.trim() || "smartwatch";
      const res = await fetch("/api/scraper/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, limit: scrapeLimit }),
      });
      const data = await res.json();
      if (data.success) {
        setScrapeStatus("success");
        setScrapeResult({ saved: data.saved, fetched: data.fetched, source: data.source ?? "catalog" });
        queryClient.invalidateQueries({ queryKey: ["products"] });
      } else {
        setScrapeStatus("error");
      }
    } catch {
      setScrapeStatus("error");
    }
    setTimeout(() => setScrapeStatus("idle"), 8000);
  }, [searchQuery, queryClient]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => productsApi.list(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const products = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Descoberta de Produtos</h1>
          <p className="text-sm text-white/50 mt-1">
            {total.toLocaleString("pt-BR")} produtos encontrados
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quantity selector */}
          <select
            aria-label="Quantidade de produtos para buscar"
            value={scrapeLimit}
            onChange={(e) => setScrapeLimit(Number(e.target.value))}
            disabled={scrapeStatus === "loading"}
            className="h-8 text-sm rounded-md bg-white/5 border border-white/20 text-white px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value={10}>10 produtos</option>
            <option value={20}>20 produtos</option>
            <option value={40}>40 produtos</option>
            <option value={60}>60 produtos</option>
          </select>

          {/* Scrape button */}
          <Button
            size="sm"
            disabled={scrapeStatus === "loading"}
            onClick={handleScrape}
            className={`relative overflow-hidden font-semibold transition-all ${
              scrapeStatus === "success"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : scrapeStatus === "error"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white"
            }`}
          >
            {scrapeStatus === "loading" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Buscando...</>
            ) : scrapeStatus === "success" ? (
              <><CheckCircle2 className="w-4 h-4 mr-2" />{scrapeResult?.saved ?? 0} salvos!</>
            ) : scrapeStatus === "error" ? (
              <><AlertCircle className="w-4 h-4 mr-2" />Tente novamente</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Buscar Produtos</>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={`border-white/20 ${viewMode === "grid" ? "bg-white/10" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`border-white/20 ${viewMode === "table" ? "bg-white/10" : ""}`}
            onClick={() => setViewMode("table")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20"
            onClick={() => setSidebarOpen(true)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtros
            {Object.keys(filters).filter(k => !["per_page","page","sort_by"].includes(k) && (filters as any)[k]).length > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {Object.keys(filters).filter(k => !["per_page","page","sort_by"].includes(k) && (filters as any)[k]).length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Scrape result toast-like banner */}
      <AnimatePresence>
        {scrapeStatus === "success" && scrapeResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-300">
              <span className="font-semibold">{scrapeResult.fetched} produtos</span>{" "}
              {scrapeResult.source === "aliexpress_affiliate" ? "buscados via API de Afiliados AliExpress" : scrapeResult.source === "mercadolivre" ? "buscados via API oficial do Mercado Livre" : scrapeResult.source === "python" ? "buscados via Python" : scrapeResult.source === "js" ? "buscados via JS" : "do catálogo de tendências"}{" "}—{" "}
              <span className="font-semibold">{scrapeResult.saved} atualizados</span> no banco. Lista atualizada!
            </p>
          </motion.div>
        )}
        {scrapeStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">
              Falha ao buscar produtos. Os marketplaces podem estar bloqueando requisições diretas.
              Tente novamente ou use uma VPN.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin" />
        )}
        <Input
          placeholder="Buscar por palavra-chave, nicho, categoria..."
          className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            debouncedSearch(e.target.value);
          }}
        />
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: "score", label: "Oportunidade" },
          { key: "sales", label: "Mais Vendidos" },
          { key: "trend_score", label: "Em Alta" },
          { key: "created_at", label: "Recentes" },
          { key: "discount", label: "Maior Desconto" },
          { key: "price", label: "Menor Preço" },
        ].map((sort) => (
          <button
            key={sort.key}
            type="button"
            onClick={() => setFilters((f) => ({ ...f, sort_by: sort.key as any, page: 1 }))}
            className={`flex-shrink-0 text-sm px-3 py-1.5 rounded-lg transition-colors ${
              filters.sort_by === sort.key
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            {sort.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-72 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </motion.div>
        ) : products.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-white/50 text-sm mb-2">
              {filters.query ? `Nenhum produto encontrado para "${filters.query}"` : "Nenhum produto no banco ainda."}
            </p>
            <p className="text-white/30 text-xs">
              {filters.query ? 'Tente outro termo ou clique em "Buscar Produtos" para minerar.' : 'Clique em "Buscar Produtos" para minerar produtos dos marketplaces.'}
            </p>
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ProductsTable products={products} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/20"
            disabled={!data.has_prev}
            onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
          >
            Anterior
          </Button>
          <span className="flex items-center text-sm text-white/50 px-4">
            {filters.page} / {data.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20"
            disabled={!data.has_next}
            onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Filters sidebar */}
      <FiltersSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        filters={filters}
        onChange={(f) => setFilters((prev) => ({ ...prev, ...f, page: 1 }))}
      />
    </div>
  );
}
