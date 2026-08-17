import { notFound } from 'next/navigation'
import { resolveLibraryMeta } from '../../../../data/library-catalog'
import { createPageMetadata, generateBreadcrumbSchema, generateImageObjectSchema, SITE_URL } from '../../../../lib/seo'
import IconDetailClient from './IconDetailClient'

export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; iconName: string }>
}) {
  const { slug, iconName } = await params
  const meta = resolveLibraryMeta(slug)
  if (!meta) return {}

  const cleanName = decodeURIComponent(iconName).replace(/\.svg$/i, '')
  const formattedName = cleanName
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')

  const title = `${formattedName} Icon SVG — Free ${meta.name} Download & React Component`
  const description = `Download free ${formattedName} vector SVG icon from ${meta.name}. Copy clean SVG, React JSX, Vue, Svelte component code, or export high-resolution PNG under ${meta.license} license.`

  return createPageMetadata({
    title,
    description,
    path: `/icons/${meta.slug}/${cleanName}`,
    imageAlt: `${formattedName} icon from ${meta.name} on IconSearch`,
    keywords: [
      cleanName,
      `${cleanName} icon`,
      `${cleanName} svg`,
      `${cleanName} react icon`,
      `${meta.name} ${cleanName}`,
      'free svg icon',
      'vector icon download',
      'react icon component',
      meta.name,
    ],
  })
}

export default async function IconDetailPage({
  params,
}: {
  params: Promise<{ slug: string; iconName: string }>
}) {
  const { slug, iconName } = await params
  const meta = resolveLibraryMeta(slug)

  if (!meta) {
    notFound()
  }

  const cleanName = decodeURIComponent(iconName).replace(/\.svg$/i, '')
  const formattedName = cleanName
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')

  const svgApiUrl = `/api/svg/${encodeURIComponent(meta.id || meta.slug)}/${encodeURIComponent(cleanName)}`

  const imageSchema = generateImageObjectSchema({
    name: `${formattedName} Icon`,
    description: `${formattedName} vector SVG icon from ${meta.name}`,
    contentUrl: `${SITE_URL}${svgApiUrl}`,
    license: meta.license,
    creator: meta.name,
    tags: [cleanName, meta.name, 'SVG', 'Vector', 'Icon', meta.license],
  })

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Free SVG Icons', url: '/free-svg-icons' },
    { name: meta.name, url: `/icons/${meta.slug}` },
    { name: formattedName, url: `/icons/${meta.slug}/${cleanName}` },
  ])

  return (
    <main style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 24px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([imageSchema, breadcrumbsSchema]),
        }}
      />
      <IconDetailClient
        iconName={cleanName}
        displayName={formattedName}
        library={meta}
        svgApiUrl={svgApiUrl}
      />
    </main>
  )
}
