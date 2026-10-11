import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { siteConfig } from '@/config/site';
import { CATEGORIES, categoryPath, brandPath, groupBrands, BRAND_MIN_INDEX } from '@/lib/seo-landing';
import { fetchCatalogProductsServer } from '@/lib/products-query.server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.siteUrl.replace(/\/$/, '');
  
  /**
   * `alternates.languages` — hreflang ning sitemapdagi ko'rinishi.
   * Google shu orqali o'zbekcha va ruscha versiyalar bir sahifaning
   * tarjimasi ekanini biladi va ularni dublikat deb hisoblamaydi.
   *
   * Avval sitemapda faqat o'zbekcha manzillar bor edi va ruscha
   * versiya umuman mavjud emasdi (`/ru` 404 qaytarardi).
   */
  const tillar = (uzPath: string) => ({
    languages: {
      'uz-UZ': `${baseUrl}${uzPath}`,
      'ru-RU': `${baseUrl}/ru${uzPath}`,
      'x-default': `${baseUrl}${uzPath}`,
    },
  });

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
      alternates: tillar(''),
    },
    {
      url: `${baseUrl}/ru`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: tillar(''),
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: tillar('/catalog'),
    },
    {
      url: `${baseUrl}/ru/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: tillar('/catalog'),
    },
    ...CATEGORIES.map((c) => ({
      url: `${baseUrl}${categoryPath(c.slug)}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    {
      url: `${baseUrl}/brendlar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    }
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: products } = await supabase.from('products').select('id').eq('is_available', true); // yashirilgan (takroriy, test) atirlar indekslanmaydi
    
    if (products) {
      const productRoutes = products.map((product) => ({
        url: `${baseUrl}/catalog/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
      
      // Brend sahifalari: faqat indekslanadiganlari (kamida BRAND_MIN_INDEX atir)
      const brandRoutes = groupBrands(await fetchCatalogProductsServer())
        .filter((b) => b.products.length >= BRAND_MIN_INDEX)
        .map((b) => ({
          url: `${baseUrl}${brandPath(b.slug)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));

      return [...routes, ...brandRoutes, ...productRoutes];
    }
  } catch (e) {
    console.error("Error generating sitemap", e);
  }

  return routes;
}
