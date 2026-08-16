import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.weserv.nl",
      },
      {
        protocol: "https",
        hostname: "asia-en.onepiece-cardgame.com",
      },
      {
        protocol: "https",
        hostname: "en.onepiece-cardgame.com",
      },
    ],
  },
};

export default nextConfig;

