import type { Metadata } from 'next';
import { Cinzel_Decorative, Crimson_Pro } from 'next/font/google';
import './globals.css';
import { AlbumProvider } from '@/context/AlbumContext';
import Navbar from '@/components/Navbar';

const cinzel = Cinzel_Decorative({
  variable: '--font-cinzel-var',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
});

const crimson = Crimson_Pro({
  variable: '--font-crimson-var',
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'One Piece TCG — Grand Line Archives',
  description: 'Álbum digital personal para coleccionistas de One Piece TCG. Lleva un registro de tus cartas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${cinzel.variable} ${crimson.variable} antialiased bg-obsidian text-white min-h-screen`}>
        <AlbumProvider>
          <Navbar />
          {children}
        </AlbumProvider>
      </body>
    </html>
  );
}
