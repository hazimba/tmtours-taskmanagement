import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "https://williams-unenamelled-nongenerically.ngrok-free.dev",
  ],
  images: {
    unoptimized: true,
    qualities: [55, 60, 65, 75, 100],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.pixelstalk.net",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "toppng.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "mlapxffieyehdpvuzsyw.supabase.co",
      },
      {
        protocol: "https",
        hostname: "mlapxffieyehdpvuzsyw.supabase.co",
      },
      {
        protocol: "https",
        hostname: "png.pngtree.com",
      },
      {
        protocol: "https",
        hostname: "tmtours.com.my",
      },
    ],
  },
};

export default nextConfig;
