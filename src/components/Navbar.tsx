"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, BookOpen, Anchor } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useAlbum } from "@/context/AlbumContext";
import { motion } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();
  const { totalOwned, totalWishlist } = useAlbum();
  const totalCards = totalOwned + totalWishlist;

  return (
    <nav className="fixed top-0 inset-x-0 z-[100] bg-obsidian/85 backdrop-blur-xl border-b border-white/6">
      <div className="max-w-[1600px] mx-auto px-5 md:px-10 h-16 flex items-center justify-center">
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
        </div>
      </div>
    </nav>
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
