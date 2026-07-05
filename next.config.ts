import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // unoptimized: false — Next.js image optimization yoqildi (WebP, avif, resize)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "ljlwfzvathvltqxwqsxk.supabase.co",
        port: "",
        pathname: "/**",
      },
    ],
    // Rasmlarni WebP formatiga avtomatik o'tkazish
    formats: ["image/webp", "image/avif"],
    // Minimal TTL - rasimlar 7 kun keshda saqlanadi
    minimumCacheTTL: 604800,
    // Device sizes - mobile optimizatsiya
    deviceSizes: [390, 640, 750, 828, 1080, 1200],
    // Image sizes - Next.js fill/sizes uchun
    imageSizes: [16, 32, 64, 96, 128, 256],
  },
  // Production build optimizatsiya
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
