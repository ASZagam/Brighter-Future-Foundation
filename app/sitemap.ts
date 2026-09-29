import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://brighterfuture.org';

export const revalidate = 300;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: { path: string; priority: number; frequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1, frequency: 'daily' },
    { path: '/about', priority: 0.8, frequency: 'monthly' },
    { path: '/programs', priority: 0.9, frequency: 'weekly' },
    { path: '/impact', priority: 0.9, frequency: 'daily' },
    { path: '/news', priority: 0.8, frequency: 'daily' },
    { path: '/transparency', priority: 0.7, frequency: 'monthly' },
    { path: '/donate', priority: 0.9, frequency: 'monthly' },
  ];

  return routes.map((route) => ({
    url: `${BASE}${route.path}`,
    lastModified: now,
    changeFrequency: route.frequency,
    priority: route.priority,
  }));
}
