import fs from 'fs'
import path from 'path'
import { createPageMetadata, generateBreadcrumbSchema, generateSoftwareAppSchema } from '../../lib/seo'
import LogoMakerStudio, { StudioIcon } from './LogoMakerStudio'

export const metadata = createPageMetadata({
  title: 'Free App Icon Maker & SVG Logo Generator (2026) — 355k+ Symbols',
  description: 'Create custom iOS & Android app icons, website favicons, and vector SVG logos for free. Customize background shapes, squircle radius, gradients, padding, and export multi-size PNG, SVG, ICO.',
  path: '/logo-maker',
  keywords: [
    'app icons',
    'app icon maker',
    'custom app icons',
    'app iconography',
    'svg maker free',
    'free svg maker',
    'logo icons',
    'logo design svg',
    'design svg logo',
    'favicon maker',
    'icon generator free',
    'site icon maker',
  ],
})

export default async function LogoMakerPage() {
  let initialIcons: StudioIcon[] = []
  try {
    const filePath = path.join(process.cwd(), 'data', 'icon-search (1).json')
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const parsedData = JSON.parse(fileContents)
      const list = Array.isArray(parsedData) ? parsedData : (Array.isArray(parsedData?.icons) ? parsedData.icons : [])
      if (list.length > 0) {
        initialIcons = list.slice(0, 48).map((item: any, index: number) => ({
          id: item.id || `${item.library}-${item.name}-${index}`,
          name: item.name,
          displayName: item.displayName || item.name,
          library: item.library,
          libraryName: item.libraryName || item.library,
          svgUrl: item.svgUrl || `/api/svg/${encodeURIComponent(item.library)}/${encodeURIComponent(item.name)}`,
          tags: item.tags || [],
        }))
      }
    }
  } catch (err) {
    console.error('Failed to load initial icons for Logo Maker:', err)
  }

  const appSchema = generateSoftwareAppSchema({
    name: 'IconSearch App Icon Maker & SVG Logo Generator',
    description: 'Free vector studio to generate iOS & Android app icons, favicons, and SVG logos from 355k+ open-source symbols.',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    path: '/logo-maker',
    featureList: [
      '355,000+ vector symbols & icon libraries',
      'Squircle, Rounded, Circle, and Hexagon shapes',
      'Multi-color gradients and custom color fills',
      'Export multi-size PNG (32px to 1024px) & clean SVG',
      '100% Free & No Login Required',
    ],
  })

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'App Icon Maker & Logo Generator', url: '/logo-maker' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([appSchema, breadcrumbSchema]),
        }}
      />
      <LogoMakerStudio initialIcons={initialIcons} />
    </>
  )
}

