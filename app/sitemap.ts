import type { MetadataRoute } from 'next'
import { allLibraries } from '../data/library-catalog'
import snapshot from '../data/icon-search.snapshot.json'
import { staticPages } from '../data/static-pages'
import { SITE_URL } from '../lib/seo'

const knownPageDates = new Map(staticPages.map((page) => [page.href, page.date]))
knownPageDates.set('/privacy-policy', '2026-07-24')
knownPageDates.set('/terms', '2026-07-24')

function entry(
  path: string,
  lastModified?: string,
  changeFrequency: 'daily' | 'weekly' | 'monthly' = 'weekly',
  priority = 0.7
): MetadataRoute.Sitemap[number] {
  return {
    url: new URL(path, SITE_URL).toString(),
    ...(lastModified ? { lastModified } : {}),
    changeFrequency,
    priority,
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const catalogModified = snapshot.generatedAt

  return [
    entry('/', knownPageDates.get('/'), 'daily', 1.0),
    entry('/free-svg-icons', catalogModified, 'daily', 0.9),
    entry('/icon-search', catalogModified, 'daily', 0.9),
    entry('/logo-maker', catalogModified, 'weekly', 0.9),
    entry('/react-icons', knownPageDates.get('/react-icons'), 'weekly', 0.85),
    entry('/nextjs-icons', knownPageDates.get('/nextjs-icons'), 'weekly', 0.85),
    entry('/tailwind-icons', knownPageDates.get('/tailwind-icons'), 'weekly', 0.85),
    entry('/vue-icons', knownPageDates.get('/vue-icons'), 'weekly', 0.8),
    entry('/svelte-icons', knownPageDates.get('/svelte-icons'), 'weekly', 0.8),
    entry('/typescript-icons', knownPageDates.get('/typescript-icons'), 'weekly', 0.8),
    entry('/agents', knownPageDates.get('/agents'), 'weekly', 0.8),
    entry('/docs/agents', knownPageDates.get('/docs/agents'), 'weekly', 0.8),
    entry('/directory', catalogModified, 'weekly', 0.8),
    entry('/stats', catalogModified, 'weekly', 0.75),
    entry('/licenses', knownPageDates.get('/licenses'), 'monthly', 0.7),
    entry('/figma-plugin', knownPageDates.get('/figma-plugin'), 'weekly', 0.8),
    entry('/powerpoint-addin', knownPageDates.get('/powerpoint-addin'), 'weekly', 0.8),
    entry('/google-slides-addon', knownPageDates.get('/google-slides-addon'), 'weekly', 0.8),
    entry('/wordpress-plugin', knownPageDates.get('/wordpress-plugin'), 'weekly', 0.8),
    entry('/vscode-extension', knownPageDates.get('/vscode-extension'), 'weekly', 0.8),
    entry('/chrome-extension', knownPageDates.get('/chrome-extension'), 'weekly', 0.8),
    entry('/framer-plugin', knownPageDates.get('/framer-plugin'), 'weekly', 0.75),
    entry('/webflow-extension', knownPageDates.get('/webflow-extension'), 'weekly', 0.75),
    entry('/canva-app', knownPageDates.get('/canva-app'), 'weekly', 0.75),
    entry('/adobe-plugin', knownPageDates.get('/adobe-plugin'), 'weekly', 0.75),
    entry('/obsidian-plugin', knownPageDates.get('/obsidian-plugin'), 'weekly', 0.75),
    entry('/penpot-plugin', knownPageDates.get('/penpot-plugin'), 'weekly', 0.75),
    entry('/raycast-extension', knownPageDates.get('/raycast-extension'), 'weekly', 0.75),
    entry('/jetbrains-plugin', knownPageDates.get('/jetbrains-plugin'), 'weekly', 0.75),
    entry('/tailwind-plugin', knownPageDates.get('/tailwind-plugin'), 'weekly', 0.75),
    entry('/storybook-addon', knownPageDates.get('/storybook-addon'), 'weekly', 0.75),
    entry('/shopify-extension', knownPageDates.get('/shopify-extension'), 'weekly', 0.75),
    entry('/sketch-plugin', knownPageDates.get('/sketch-plugin'), 'weekly', 0.75),
    entry('/about', knownPageDates.get('/about'), 'monthly', 0.5),
    entry('/contact', knownPageDates.get('/contact'), 'monthly', 0.5),
    entry('/privacy-policy', knownPageDates.get('/privacy-policy'), 'monthly', 0.3),
    entry('/terms', knownPageDates.get('/terms'), 'monthly', 0.3),
    ...allLibraries.map((library) =>
      entry(`/icons/${encodeURIComponent(library.slug)}`, catalogModified, 'weekly', 0.85),
    ),
  ]
}
