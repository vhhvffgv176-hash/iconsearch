import type { MetadataRoute } from 'next'
import { SITE_URL } from '../lib/seo'

const allowPaths = [
  '/',
  '/api/svg/',
  '/api/icon-search',
  '/api/icons',
  '/icons/',
  '/icon-search',
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
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms',
  '/figma-plugin',
  '/vscode-extension',
  '/chrome-extension',
  '/framer-plugin',
  '/raycast-extension',
  '/jetbrains-plugin',
  '/obsidian-plugin',
  '/penpot-plugin',
  '/sketch-plugin',
  '/webflow-extension',
  '/canva-app',
  '/adobe-plugin',
  '/shopify-extension',
  '/wordpress-plugin',
  '/tailwind-plugin',
  '/storybook-addon',
  '/powerpoint-addin',
  '/google-slides-addon',
  '/mcp-server',
]
const disallowPaths = ['/api/', '/auth/', '/account/', '/oauth/', '/connect']

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

