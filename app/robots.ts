import type { MetadataRoute } from 'next'
import { SITE_URL } from '../lib/seo'

const allowPaths = [
  '/',
  '/api/svg/',
  '/api/icon-search',
  '/api/icons',
  '/icons/',
  '/free-svg-icons',
  '/logo-maker',
  '/react-icons',
  '/nextjs-icons',
  '/vue-icons',
  '/svelte-icons',
  '/tailwind-icons',
  '/typescript-icons',
  '/agents',
  '/docs/',
  '/directory',
  '/stats',
  '/licenses',
]
const disallowPaths = ['/api/', '/auth/', '/account/', '/oauth/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
      {
        userAgent: ['Googlebot', 'Bingbot', 'bingbot', 'MSNBot'],
        allow: allowPaths,
        disallow: disallowPaths,
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'],
        allow: allowPaths,
        disallow: disallowPaths,
      },
      {
        userAgent: '*',
        allow: allowPaths,
        disallow: disallowPaths,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}

