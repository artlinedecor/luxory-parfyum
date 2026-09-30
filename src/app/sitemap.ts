import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://parfumelux.uz';
  
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
      
      return [...routes, ...productRoutes];
    }
  } catch (e) {
    console.error("Error generating sitemap", e);
  }

  return routes;
}
