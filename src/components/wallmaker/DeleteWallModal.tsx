"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X } from "lucide-react";

interface DeleteWallModalProps {
  isOpen: boolean;
  wallTitle: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteWallModal({
  isOpen,
  wallTitle,
  onConfirm,
  onClose,
}: DeleteWallModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-leather border border-white/10 rounded-3xl shadow-2xl shadow-black p-6"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-400" />
            </div>

            {/* Title */}
            <h2 className="font-cinzel text-lg font-black text-white text-center mb-1">
              Eliminar Cuadro
            </h2>
            <p className="text-sm text-zinc-400 text-center font-crimson mb-6 leading-relaxed">
              ¿Estás seguro de que quieres eliminar{" "}
              <span className="text-white font-bold">"{wallTitle}"</span>?
              Esta acción no se puede deshacer.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer flex-1 py-2.5 rounded-xl bg-leather-light border border-white/10 hover:bg-white/10 text-sm font-bold text-zinc-300 hover:text-white transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="cursor-pointer flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 border border-red-400/30 text-sm font-black text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Trash2 size={15} />
                Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
