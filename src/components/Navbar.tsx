"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, BookOpen, Users, LogOut, LogIn, User } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useAlbum } from "@/context/AlbumContext";
import { useSession, signOut } from "@/lib/auth-client";
import AuthModal from "@/components/AuthModal";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-[100] bg-obsidian/85 backdrop-blur-xl border-b border-white/6">
        <div className="max-w-[1600px] mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
          {/* Left — Logo text */}
          <div className="w-32 hidden md:block opacity-0">
            <span className="font-cinzel text-[10px] text-zinc-700 tracking-widest uppercase select-none">
              OP TCG
            </span>
          </div>

          {/* Center navigation */}
          <div className="flex items-center gap-1.5">
            <NavLink
              href="/"
              active={pathname === "/"}
              icon={<Compass size={15} />}
              label="Database"
            />
            <NavLink
              href="/album"
              active={pathname === "/album"}
              icon={<BookOpen size={15} />}
              label="Mi Álbum"
            />
            <NavLink
              href="/albums"
              active={pathname === "/albums"}
              icon={<Users size={15} />}
              label="Collectors"
            />
          </div>

          {/* Right — Auth */}
          <div className="w-32 flex justify-end" ref={menuRef}>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-leather transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center">
                    <User size={13} className="text-gold" />
                  </div>
                  <span className="hidden sm:block text-xs font-black truncate max-w-20">
                    {(user as { username?: string }).username || user.name}
                  </span>
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-leather border border-white/8 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-0.5">
                        Conectado como
                      </p>
                      <p className="text-sm text-white font-bold truncate">
                        {user.name}
                      </p>
                      {(user as { username?: string }).username && (
                        <p className="text-xs text-zinc-500 font-mono">
                          @{(user as { username?: string }).username}
                        </p>
                      )}
                    </div>
                    {(user as { username?: string }).username && (
                      <Link
                        href={`/album/${(user as { username?: string }).username}`}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-xs text-zinc-400 hover:text-white hover:bg-leather-light transition-all"
                      >
                        <BookOpen size={13} />
                        Ver mi álbum público
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs text-zinc-400 hover:text-crimson-light hover:bg-leather-light transition-all border-t border-white/5"
                    >
                      <LogOut size={13} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-leather transition-all"
              >
                <LogIn size={15} />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

function NavLink({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={twMerge(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200",
        active
          ? "bg-gold text-obsidian shadow-md shadow-gold/20"
          : "text-zinc-500 hover:text-zinc-200 hover:bg-leather",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
