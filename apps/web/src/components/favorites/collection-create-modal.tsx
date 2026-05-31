"use client";
import { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CollectionCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
}

export function CollectionCreateModal({ open, onClose, onCreated }: CollectionCreateModalProps) {
  const [name, setName] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreated(trimmed);
    setName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#13141a] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-white">Nova Coleção</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-2 block">Nome da coleção</label>
            <Input
              autoFocus
              placeholder="Ex: Produtos para dropship, Ideias de nicho..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1 border-white/20" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={!name.trim()}>
              Criar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
