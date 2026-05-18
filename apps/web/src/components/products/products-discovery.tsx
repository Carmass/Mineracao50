"use client";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Grid3X3, List, SlidersHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { FiltersSidebar } from "@/components/products/filters-sidebar";
import { ProductsTable } from "@/components/products/products-table";
import { productsApi } from "@/lib/api";
import type { ProductFilters } from "@/types";
import { debounce } from "@/lib/utils";

type ViewMode = "grid" | "table";

export function ProductsDiscovery() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ProductFilters>({ per_page: 24, page: 1, sort_by: "score" });

  const debouncedSearch = useCallback(
    debounce((q: string) => setFilters((f) => ({ ...f, query: q, page: 1 })), 400),
    []
  );

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
        ) : viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
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
