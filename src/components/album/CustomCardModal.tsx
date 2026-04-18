"use client";

import { useState, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Wand2, Image as ImageIcon, Sparkles } from "lucide-react";
import { useAlbum } from "@/context/AlbumContext";
import { Card } from "@/types";
import { twMerge } from "tailwind-merge";

interface CustomCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RARITIES = ["C", "UC", "R", "SR", "SEC", "L", "P", "SP CARD"];
const TYPES = ["LEADER", "CHARACTER", "EVENT", "STAGE"];
const COLORS = ["Red", "Blue", "Green", "Yellow", "Purple", "Black", "Multi"];

export default function CustomCardModal({
  isOpen,
  onClose,
}: CustomCardModalProps) {
  const { addCustomCard } = useAlbum();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [serial, setSerial] = useState("");
  const [rarity, setRarity] = useState<string>("R");
  const [type, setType] = useState<string>("CHARACTER");
  const [color, setColor] = useState<string>("Red");
  const [effect, setEffect] = useState("");
  const [imageData, setImageData] = useState<string>("");
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError("La imagen no debe superar 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImageData(result);
      setImagePreview(result);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!serial.trim()) {
      setError("El serial es obligatorio");
      return;
    }
    if (!imageData && !imagePreview) {
      setError("La imagen es obligatoria");
      return;
    }

    setIsSubmitting(true);

    const customCard: Card = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim(),
      serial: serial.trim(),
      rarity,
      type,
      color,
      effect: effect.trim() || undefined,
      url: imageData || imagePreview,
      imageData: imageData || imagePreview,
      isCustom: true,
    };

    addCustomCard(customCard);

    // Reset
    setName("");
    setSerial("");
    setRarity("R");
    setType("CHARACTER");
    setColor("Red");
    setEffect("");
    setImageData("");
    setImagePreview("");
    setError("");
    setIsSubmitting(false);
    onClose();
  };

  const reset = () => {
    setName("");
    setSerial("");
    setRarity("R");
    setType("CHARACTER");
    setColor("Red");
    setEffect("");
    setImageData("");
    setImagePreview("");
    setError("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              onClose();
              reset();
            }}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative w-full max-w-2xl bg-leather border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center">
                  <Wand2 size={20} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="font-cinzel text-lg font-bold text-white">
                    Carta Personalizada
                  </h2>
                  <p className="text-xs text-zinc-500 font-crimson mt-0.5">
                    Crea una carta custom para tu álbum
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  reset();
                }}
                className="cursor-pointer p-2 bg-leather-light rounded-xl text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image upload */}
                <div className="shrink-0">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">
                    Imagen de la Carta *
                  </label>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className={twMerge(
                      "cursor-pointer relative w-32 aspect-[63/88] rounded-xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all hover:border-purple-400/60 group",
                      imagePreview ? "border-purple-400/40" : "border-white/15",
                    )}
                  >
                    {imagePreview ? (
                      <>
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${imagePreview})` }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload size={20} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-3 text-center">
                        <ImageIcon size={24} className="text-zinc-600" />
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest leading-tight">
                          Subir imagen
                        </span>
                        <span className="text-[7px] text-zinc-700">
                          máx. 3MB
                        </span>
                      </div>
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                {/* Fields */}
                <div className="flex-1 space-y-4">
                  <Field label="Nombre *">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ej. Monkey D. Luffy"
                      className="input-base"
                    />
                  </Field>

                  <Field label="Serial *">
                    <input
                      value={serial}
                      onChange={(e) => setSerial(e.target.value)}
                      placeholder="ej. OP-01-001"
                      className="input-base font-mono"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Rareza">
                      <select
                        value={rarity}
                        onChange={(e) => setRarity(e.target.value)}
                        className="input-base"
                      >
                        {RARITIES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Tipo">
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="input-base"
                      >
                        {TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Color">
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className={twMerge(
                            "cursor-pointer px-3 py-1 rounded-lg border text-xs font-bold transition-all",
                            color === c
                              ? "bg-gold/10 border-gold text-gold"
                              : "bg-leather-light border-white/10 text-zinc-500 hover:border-white/20",
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Efecto (opcional)">
                    <textarea
                      value={effect}
                      onChange={(e) => setEffect(e.target.value)}
                      placeholder="Describe el efecto de la carta..."
                      rows={3}
                      className="input-base resize-none font-crimson italic"
                    />
                  </Field>
                </div>
              </div>

              {error && (
                <div className="mt-4 px-4 py-3 bg-crimson/10 border border-crimson/30 rounded-xl text-crimson text-sm font-crimson">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 border-t border-white/8 shrink-0 flex gap-3">
              <button
                onClick={() => {
                  onClose();
                  reset();
                }}
                className="cursor-pointer flex-1 py-3 bg-leather-light border border-white/10 rounded-xl text-zinc-300 font-bold text-sm hover:border-white/20 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="cursor-pointer flex-1 py-3 bg-purple-500 hover:bg-purple-400 text-white font-black uppercase text-sm tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={16} />
                Crear Carta
              </button>
            </div>
          </motion.div>

          <style jsx global>{`
            .input-base {
              width: 100%;
              background: #0b0e13;
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 0.75rem;
              padding: 0.625rem 0.875rem;
              font-size: 0.875rem;
              color: #fff;
              outline: none;
              transition: border-color 0.2s;
            }
            .input-base:focus {
              border-color: rgba(244, 160, 24, 0.5);
            }
            .input-base::placeholder {
              color: #52525b;
            }
            .input-base option {
              background: #13171e;
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
