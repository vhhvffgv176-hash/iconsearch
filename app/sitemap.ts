import type { MetadataRoute } from 'next'
import { allLibraries } from '../data/library-catalog'
import snapshot from '../data/icon-search.snapshot.json'
import { staticPages } from '../data/static-pages'
import { SITE_URL } from '../lib/seo'

const CORE_PATHS = [
  '/',
  '/free-svg-icons',
  '/icon-search',
  '/logo-maker',
  '/react-icons',
  '/nextjs-icons',
  '/vue-icons',
  '/svelte-icons',
  '/tailwind-icons',
  '/typescript-icons',
  '/licenses',
  '/stats',
  '/directory',
  '/about',
  '/contact',
  '/agents',
  '/docs/agents',
  '/privacy-policy',
  '/terms',
  '/figma-plugin',
  '/sketch-plugin',
  '/vscode-extension',
  '/chrome-extension',
  '/framer-plugin',
  '/framer-template',
  '/webflow-extension',
  '/powerpoint-addin',
  '/google-slides-addon',
  '/raycast-extension',
  '/tailwind-plugin',
  '/jetbrains-plugin',
  '/storybook-addon',
  '/canva-app',
  '/wordpress-plugin',
  '/shopify-extension',
  '/adobe-plugin',
  '/obsidian-plugin',
  '/penpot-plugin',
] as const

const knownPageDates = new Map(staticPages.map((page) => [page.href, page.date]))
knownPageDates.set('/privacy-policy', '2026-07-24')
knownPageDates.set('/terms', '2026-07-24')

function entry(path: string, lastModified?: string): MetadataRoute.Sitemap[number] {
  return {
    url: new URL(path, SITE_URL).toString(),
    ...(lastModified ? { lastModified } : {}),
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const catalogModified = snapshot.generatedAt

  return [
    ...CORE_PATHS.map((path) => entry(path, knownPageDates.get(path))),
    ...allLibraries.map((library) =>
      entry(`/icons/${encodeURIComponent(library.slug)}`, catalogModified),
    ),
  ]
}
