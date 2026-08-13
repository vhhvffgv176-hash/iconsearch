import sourceSetData from '@/data/icon-source-sets.json'

export type IconSourceSet = {
  id: string
  name: string
  iconCount: number
  authorName: string
  authorUrl: string
  sourceUrl: string
  license: string
  licenseUrl: string
  usageRequirements: string
  commercialUseAllowed: boolean
  exportAllowed: boolean
}

const directLibrarySourceSets: Record<string, string> = {
  'ant-design-icons': 'ant-design',
  'bootstrap-icons': 'bi',
  'circum-icons': 'circum',
  devicons: 'devicon',
  'elusive-icons': 'el',
  'feather-icons': 'feather',
  heroicons: 'heroicons',
  iconoir: 'iconoir',
  ionicons: 'ion',
  'lucide-icons': 'lucide',
  octicons: 'octicon',
  'phosphor-icons': 'ph',
  'radix-icons': 'radix-icons',
  'remix-icon': 'ri',
  'tabler-icons': 'tabler',
  teenyicons: 'teenyicons',
}

export const ICON_SOURCE_SETS = sourceSetData.sets as IconSourceSet[]
export const ICON_SOURCE_SET_COUNT = sourceSetData.sourceSetCount

const sourceSetsById = new Map(ICON_SOURCE_SETS.map((set) => [set.id, set]))

export const ICON_SOURCE_SET_OPTIONS = ICON_SOURCE_SETS.map(({ id, name }) => ({ id, name }))

export function getIconSourceSetId(library: string) {
  const normalized = library.trim().toLowerCase()
  if (normalized.startsWith('iconify-')) return normalized.slice('iconify-'.length)
  return directLibrarySourceSets[normalized] || normalized
}

export function getIconSourceSet(library: string) {
  return sourceSetsById.get(getIconSourceSetId(library))
}

export function enrichExtensionIcon(icon: Record<string, unknown>) {
  const library = typeof icon.library === 'string' ? icon.library : ''
  const name = typeof icon.name === 'string' ? icon.name : ''
  const sourceSet = getIconSourceSet(library)
  if (!sourceSet) return icon

  const safeIcon = { ...icon }
  delete safeIcon.legalSafe
  const licenseNotice = [
    `${sourceSet.name} by ${sourceSet.authorName}.`,
    `License: ${sourceSet.license}.`,
    sourceSet.usageRequirements,
    sourceSet.sourceUrl ? `Source: ${sourceSet.sourceUrl}` : '',
    sourceSet.licenseUrl ? `License terms: ${sourceSet.licenseUrl}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const npmPackage = typeof icon.npmPackage === 'string' ? icon.npmPackage : ''
  const reactImport = typeof icon.reactImport === 'string' ? icon.reactImport : ''
  const reactUsage = typeof icon.reactUsage === 'string' ? icon.reactUsage : ''
  const usesCatalogRuntime =
    library.startsWith('iconify-') ||
    npmPackage === '@iconify/react' ||
    /iconify/i.test(`${npmPackage} ${reactImport} ${reactUsage}`)
  const publicSvgPath =
    name && sourceSet.id
      ? `/api/svg/${encodeURIComponent(sourceSet.id)}/${encodeURIComponent(name.replace(/\.svg$/i, ''))}`
      : ''
  const internalId = typeof icon.id === 'string' ? icon.id : `${library}:${name}`

  return {
    ...safeIcon,
    id: internalId.replace(/^iconify-/i, ''),
    library: sourceSet.id,
    libraryName: sourceSet.name,
    sourceSetId: sourceSet.id,
    authorName: sourceSet.authorName,
    authorUrl: sourceSet.authorUrl,
    sourceUrl: sourceSet.sourceUrl,
    license: sourceSet.license,
    licenseUrl: sourceSet.licenseUrl,
    licenseNotice,
    usageRequirements: sourceSet.usageRequirements,
    commercialUseAllowed: sourceSet.commercialUseAllowed,
    exportAllowed: sourceSet.exportAllowed,
    npmPackage: usesCatalogRuntime ? undefined : icon.npmPackage,
    reactImport: usesCatalogRuntime ? undefined : icon.reactImport,
    reactUsage: usesCatalogRuntime ? undefined : icon.reactUsage,
    svgUrl: publicSvgPath || icon.svgUrl,
    previewUrls: publicSvgPath ? [publicSvgPath] : icon.previewUrls,
  }
}
