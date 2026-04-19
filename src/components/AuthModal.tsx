"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";

type Tab = "login" | "register";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setEmail("");
    setPassword("");
    setName("");
    setUsername("");
    setError("");
    setShowPassword(false);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    reset();
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    const res = await signIn.email({ email, password });
    if (res.error) setError(res.error.message ?? "Error al iniciar sesión");
    else onClose();
    setIsLoading(false);
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      setError("El nombre de usuario es obligatorio");
      return;
    }
    if (username.length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres");
      return;
    }
    setIsLoading(true);
    setError("");
    const res = await signUp.email({
      email,
      password,
      name,
      username,
    } as Parameters<typeof signUp.email>[0]);
    if (res.error) setError(res.error.message ?? "Error al registrarse");
    else onClose();
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "login") handleLogin();
    else handleRegister();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-200 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-md bg-leather border border-white/8 rounded-3xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-0">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-xl text-zinc-600 hover:text-white hover:bg-leather-light transition-all"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <h2 className="font-cinzel text-2xl font-black text-white mb-1">
                  {tab === "login" ? "Bienvenido de nuevo" : "Únete al gremio"}
                </h2>
                <p className="text-zinc-500 text-sm font-crimson">
                  {tab === "login"
                    ? "Inicia sesión para acceder a tu álbum"
                    : "Crea tu cuenta y empieza a coleccionar"}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex bg-obsidian rounded-xl p-1 mb-6">
                {(["login", "register"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => switchTab(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      tab === t
                        ? "bg-gold text-obsidian shadow-md shadow-gold/20"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {t === "login" ? "Iniciar Sesión" : "Registrarse"}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
              <AnimatePresence mode="wait">
                {tab === "register" && (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Display name */}
                    <div className="relative">
                      <User
                        size={15}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                      />
                      <input
                        type="text"
                        placeholder="Nombre para mostrar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full bg-obsidian border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-gold/50 transition-colors"
                      />
                    </div>
                    {/* Username */}
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-mono">
                        @
                      </span>
                      <input
                        type="text"
                        placeholder="nombre_de_usuario"
                        value={username}
                        onChange={(e) =>
                          setUsername(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_]/g, ""),
                          )
                        }
                        required
                        minLength={3}
                        maxLength={24}
                        className="w-full bg-obsidian border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-gold/50 transition-colors font-mono"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-obsidian border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-gold/50 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-obsidian border border-white/8 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-gold/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 px-4 py-3 bg-crimson/10 border border-crimson/30 rounded-xl"
                  >
                    <AlertCircle
                      size={14}
                      className="text-crimson-light shrink-0"
                    />
                    <p className="text-xs text-crimson-light">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gold hover:bg-gold-bright text-obsidian font-black uppercase tracking-widest text-sm py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gold/20"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : tab === "login" ? (
                  "Iniciar Sesión"
                ) : (
                  "Crear Cuenta"
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
