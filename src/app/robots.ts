import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

/**
 * robots.txt — Google va Yandex uchun.
 *
 * - `public/robots.txt` olib tashlandi: u shu marshrut bilan to'qnashardi
 *   va hech narsani yopmasdi (faqat `Allow: /`).
 * - Savat, login, to'lov natijasi va admin panel indekslanmaydi.
 * - `/_next/` (JS/CSS) YOPILMAYDI — Google sahifani chizishi uchun kerak.
 * - `Host` — Yandex uchun asosiy ko'zgu (www'siz, https).
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.siteUrl.replace(/\/$/, '');
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/api/',
        '/cart',
        '/login',
        '/payment-success',
        '/tolov/',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
