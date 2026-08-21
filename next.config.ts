import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * ⚠️ Vercel Hobby tarifida rasm optimizatsiya kvotasi tugagan edi —
     * /_next/image 402 (Payment Required) qaytarib, SAYTDAGI BARCHA RASMLAR
     * ko'rinmay qolgan. Shuning uchun optimizator o'chirildi: rasmlar
     * to'g'ridan-to'g'ri Supabase Storage CDN'dan beriladi (200 OK).
     * Vercel Pro'ga o'tilsa — bu qatorni olib tashlash mumkin.
     */
    unoptimized: true,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "zfcfqkzqvfttzgthnqpo.supabase.co",
        port: "",
        pathname: "/**",
      },
    ],
    // Next.js 16: quality qiymatlari ochiq e'lon qilinishi shart
    // (aks holda /_next/image 400 INVALID_IMAGE_OPTIMIZE_REQUEST beradi)
    qualities: [60, 65, 75, 85, 100],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 604800,
    deviceSizes: [390, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 64, 96, 128, 256],
  },
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
