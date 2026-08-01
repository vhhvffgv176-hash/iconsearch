import type { MetadataRoute } from 'next'
import {
  buildIconPageSitemapEntries,
  ICON_PAGE_SITEMAP_PAGE_COUNT,
} from '../../../lib/icon-sitemap'

export const dynamic = 'force-static'

export function generateSitemaps() {
  return Array.from({ length: ICON_PAGE_SITEMAP_PAGE_COUNT }, (_, id) => ({ id }))
}

export default async function sitemap(props: {
  id: Promise<string>
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id)
  return buildIconPageSitemapEntries(id)
}
