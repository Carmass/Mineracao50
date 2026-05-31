"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Trash2, Download, Share2, Plus, FolderOpen } from "lucide-react";
import { favoritesApi } from "@/lib/api";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CollectionCreateModal } from "@/components/favorites/collection-create-modal";

export function FavoritesPage() {
  const [activeCollection, setActiveCollection] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [customCollections, setCustomCollections] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", activeCollection],
    queryFn: () => favoritesApi.list(activeCollection !== "Todos" ? activeCollection : undefined),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => favoritesApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Produto removido dos favoritos");
    },
  });

  // Coleções derivadas dos favoritos + customizadas pelo usuário
  const { data: allFavorites = [] } = useQuery({
    queryKey: ["favorites", "Todos"],
    queryFn: () => favoritesApi.list(),
  });

  const dynamicCollections = useMemo(() => {
    const fromFavs = (allFavorites as any[])
      .map((f: any) => f.collection_name)
      .filter((c: any) => c && c !== "default")
      .filter((v: any, i: any, a: any) => a.indexOf(v) === i);
    return [...new Set([...fromFavs, ...customCollections])];
  }, [allFavorites, customCollections]);

  const collections = ["Todos", ...dynamicCollections];

  async function exportCsv() {
    try {
      const blob = await favoritesApi.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "favoritos.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao exportar");
    }
  }

  const handleCollectionCreated = (name: string) => {
    setCustomCollections(prev => [...prev, name]);
    setActiveCollection(name);
    toast.success(`Coleção "${name}" criada! Adicione produtos a ela ao favoritar.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-400" />
            Favoritos
          </h1>
          <p className="text-sm text-white/50 mt-1">{(allFavorites as any[]).length} produtos salvos</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-white/20" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" className="border-white/20" onClick={async () => {
            const url = window.location.href;
            if (navigator.share) {
              await navigator.share({ title: "Meus Favoritos", url }).catch(() => null);
            } else {
              await navigator.clipboard.writeText(url);
              toast.success("Link copiado!");
            }
          }}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 border-0"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Coleção
          </Button>
        </div>
      </div>

      {/* Collections */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {collections.map((col) => (
          <button
            key={col}
            onClick={() => setActiveCollection(col)}
            className={`flex-shrink-0 text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              activeCollection === col
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            {col}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (favorites as any[]).length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white/60 mb-2">
            {activeCollection === "Todos" ? "Nenhum favorito ainda" : `Coleção "${activeCollection}" vazia`}
          </h3>
          <p className="text-white/40 text-sm">Salve produtos para acessá-los rapidamente aqui</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {(favorites as any[]).map((fav) =>
            fav.product ? (
              <div key={fav.id} className="relative">
                <ProductCard product={fav.product} />
                <button
                  onClick={() => removeMutation.mutate(fav.product_id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors z-10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null
          )}
        </motion.div>
      )}

      <CollectionCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCollectionCreated}
      />
    </div>
  );
}
