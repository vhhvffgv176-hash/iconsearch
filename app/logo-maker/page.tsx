import fs from 'fs'
import path from 'path'
import { createPageMetadata } from '../../lib/seo'
import LogoMakerStudio, { StudioIcon } from './LogoMakerStudio'

export const metadata = createPageMetadata({
  title: 'Free SVG Logo Maker & App Icon Generator (2026)',
  description: 'Create custom logos, favicons, and mobile app icons with 355,702 free SVG icons. Customize gradients, background shapes, colors, stroke width, and export PNG or SVG.',
  path: '/logo-maker',
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

  return <LogoMakerStudio initialIcons={initialIcons} />
}
