import { NextResponse } from 'next/server'
import { resolveLibraryMeta, allLibraries } from '../../../data/library-catalog'
import { SITE_URL } from '../../../lib/seo'

export const dynamic = 'force-static'
export const dynamicParams = true

export async function generateStaticParams() {
  return allLibraries.map((lib) => ({ id: lib.slug }))
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const library = resolveLibraryMeta(id)

  if (!library) {
    return new NextResponse('Sitemap chunk not found', { status: 404 })
  }

  const urls: string[] = [
    `  <url>
    <loc>${SITE_URL}/icons/${encodeURIComponent(library.slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`,
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
    },
  })
}
