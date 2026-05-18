import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { Product, ProductFilters } from "@/types";

interface ProductsState {
  filters: ProductFilters;
  viewMode: "grid" | "table";
  selectedProduct: Product | null;
  recentlyViewed: Product[];

  setFilters: (filters: Partial<ProductFilters>) => void;
  resetFilters: () => void;
  setViewMode: (mode: "grid" | "table") => void;
  setSelectedProduct: (product: Product | null) => void;
  addToRecentlyViewed: (product: Product) => void;
}

const DEFAULT_FILTERS: ProductFilters = {
  sort_by: "score",
  sort_order: "desc",
  per_page: 24,
  page: 1,
};

export const useProductsStore = create<ProductsState>()(
  devtools(
    persist(
      (set) => ({
        filters: DEFAULT_FILTERS,
        viewMode: "grid",
        selectedProduct: null,
        recentlyViewed: [],

        setFilters: (filters) =>
          set((state) => ({
            filters: { ...state.filters, ...filters, page: 1 },
          })),

        resetFilters: () => set({ filters: DEFAULT_FILTERS }),

        setViewMode: (mode) => set({ viewMode: mode }),

        setSelectedProduct: (product) => set({ selectedProduct: product }),

        addToRecentlyViewed: (product) =>
          set((state) => {
            const filtered = state.recentlyViewed.filter((p) => p.id !== product.id);
            return { recentlyViewed: [product, ...filtered].slice(0, 20) };
          }),
      }),
      {
        name: "products-store",
        partialize: (state) => ({
          viewMode: state.viewMode,
          recentlyViewed: state.recentlyViewed,
        }),
      }
    )
  )
);
