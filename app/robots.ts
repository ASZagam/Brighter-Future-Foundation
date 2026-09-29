import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://brighterfuture.org';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The management console and donor/member workspaces are private.
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/file-uploads/',
          '/settings/',
          '/members/',
          '/volunteers/',
          '/beneficiaries/',
          '/donations/',
          '/events/',
          '/references/',
          '/notifications/',
          '/dashboard/',
          '/volunteer/',
          '/member/',
          '/donor/',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
