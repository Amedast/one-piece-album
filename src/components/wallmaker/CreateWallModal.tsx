"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Frame, Loader2, Sliders } from "lucide-react";
import { useWallmaker } from "@/context/WallmakerContext";

interface CreateWallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PresetOption {
  id: string;
  label: string;
  cols: number;
  rows: number;
  description: string;
}

const PRESETS: PresetOption[] = [
  { id: "3x3", label: "3 × 3", cols: 3, rows: 3, description: "9 Cartas · Cuadro Cuadrado" },
  { id: "4x3", label: "4 × 3", cols: 4, rows: 3, description: "12 Cartas · Cuadro Horizontal" },
  { id: "4x4", label: "4 × 4", cols: 4, rows: 4, description: "16 Cartas · Cuadro Grande (Estándar)" },
  { id: "5x4", label: "5 × 4", cols: 5, rows: 4, description: "20 Cartas · Panorámico" },
  { id: "5x5", label: "5 × 5", cols: 5, rows: 5, description: "25 Cartas · Master Wall" },
  { id: "custom", label: "Personalizado", cols: 4, rows: 4, description: "2 a 6 columnas y filas" },
];

export default function CreateWallModal({
  isOpen,
  onClose,
}: CreateWallModalProps) {
  const { createWall } = useWallmaker();

  const [title, setTitle] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>("4x4");
  const [customCols, setCustomCols] = useState(4);
  const [customRows, setCustomRows] = useState(4);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCols =
    selectedPreset === "custom"
      ? customCols
      : PRESETS.find((p) => p.id === selectedPreset)?.cols || 4;

  const activeRows =
    selectedPreset === "custom"
      ? customRows
      : PRESETS.find((p) => p.id === selectedPreset)?.rows || 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Introduce un nombre para tu cuadro");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const newId = await createWall(
        title.trim(),
        activeCols,
        activeRows,
        "obsidian"
      );

      if (newId) {
        setTitle("");
        setSelectedPreset("4x4");
        setCustomCols(4);
        setCustomRows(4);
        onClose();
      } else {
        setError("No se pudo crear el cuadro");
      }
    } catch {
      setError("Error al crear el cuadro");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="relative w-full bg-leather border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col max-h-[90vh]"
          style={{ maxWidth: "520px" }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                <Frame size={18} />
              </div>
              <div>
                <h2 className="font-cinzel text-lg font-bold text-white leading-tight">
                  Crear Nuevo Cuadro
                </h2>
                <p className="text-zinc-400 text-xs font-crimson">
                  Elige las dimensiones para tu composición de cartas.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer p-2 bg-leather-light rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-2">
                Nombre del Cuadro <span className="text-gold">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Cuadro Líderes OP-05, Top Straw Hats..."
                maxLength={50}
                required
                autoFocus
                className="w-full bg-obsidian border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-all font-medium"
              />
            </div>

            {/* Presets Grid */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-2">
                Dimensiones (Columnas × Filas)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESETS.map((preset) => {
                  const selected = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`cursor-pointer p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                        selected
                          ? "bg-gold/10 border-gold/40 text-gold ring-1 ring-gold/20"
                          : "bg-leather-light border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                      }`}
                    >
                      <div className="font-cinzel text-sm font-black text-white">
                        {preset.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Sliders if Custom preset selected */}
            {selectedPreset === "custom" && (
              <div className="p-4 bg-obsidian border border-gold/30 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-gold text-xs font-black uppercase tracking-wider">
                  <Sliders size={14} />
                  <span>Configuración Personalizada</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Columns */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-300 mb-1.5">
                      <span>Columnas</span>
                      <span className="text-gold font-mono">{customCols}</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={6}
                      value={customCols}
                      onChange={(e) => setCustomCols(Number(e.target.value))}
                      className="w-full accent-gold cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-1">
                      <span>2</span>
                      <span>6</span>
                    </div>
                  </div>

                  {/* Rows */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-300 mb-1.5">
                      <span>Filas</span>
                      <span className="text-gold font-mono">{customRows}</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={6}
                      value={customRows}
                      onChange={(e) => setCustomRows(Number(e.target.value))}
                      className="w-full accent-gold cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-1">
                      <span>2</span>
                      <span>6</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-center font-cinzel text-zinc-400 font-bold">
                  Total de cartas: <span className="text-gold">{customCols * customRows}</span>
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/8">
              <button
                type="button"
                onClick={onClose}
                disabled={isCreating}
                className="cursor-pointer px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreating || !title.trim()}
                className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-gold text-obsidian hover:bg-gold-bright rounded-xl text-xs font-black uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Creando...</span>
                  </>
                ) : (
                  <span>Crear Cuadro</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
