import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://parfumelux.uz';
  
  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    }
  ];

  try {
    const supabase = await createClient();
    const { data: products } = await supabase.from('products').select('id');
    
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
