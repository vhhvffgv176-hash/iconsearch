import { requireToken } from './session.js'

const DEFAULT_API_BASE = 'https://iconsearch.info'
const MAX_JSON_BYTES = 2 * 1024 * 1024
const REQUEST_TIMEOUT_MS = 15_000

export type OutputFormat = 'react' | 'svg' | 'vue' | 'svelte' | 'tailwind' | 'url'
export type SearchStyle = 'all' | 'stroke' | 'solid' | 'duotone' | 'twotone' | 'sharp'

export type IconSearchIcon = {
  id: string
  name: string
  displayName: string
  library: string
  libraryName: string
  npmPackage?: string
  license?: string
  licenseUrl?: string
  licenseNotice?: string
  usageRequirements?: string
  legalSafe: boolean
  authorName?: string
  authorUrl?: string
  sourceUrl?: string
  svgUrl: string
  previewUrls: string[]
  reactImport?: string
  reactUsage?: string
  tags: string[]
  svg?: string
  checksum?: string
}

export type SearchResult = {
  icons: IconSearchIcon[]
  total: number
  page: number
  totalPages: number
  query?: Record<string, unknown>
}

export function getApiBase() {
  const value = (process.env.ICONSEARCH_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, '')
  const url = new URL(value)
  const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1'
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) {
    throw new Error('ICONSEARCH_API_BASE must use HTTPS unless it targets a loopback address.')
  }
  if (url.username || url.password) throw new Error('ICONSEARCH_API_BASE must not contain credentials.')
  return url.toString().replace(/\/$/, '')
}

export async function searchIcons({
  query,
  library,
  style,
  legalOnly,
  limit,
  page,
}: {
  query: string
  library: string
  style: SearchStyle
  legalOnly: boolean
  limit: number
  page: number
}): Promise<SearchResult> {
  const url = new URL(`${getApiBase()}/api/v1/icons/search`)
  const cleanQuery = query.trim()
  if (cleanQuery) url.searchParams.set('q', cleanQuery)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('page', String(page))
  url.searchParams.set('sort', cleanQuery ? 'relevance' : 'popular')
  url.searchParams.set('legalOnly', legalOnly ? '1' : '0')
  if (style !== 'all') url.searchParams.set('style', style)
  applyLibraryParams(url, library)

  const payload = await authenticatedJson(url)
  const icons = Array.isArray(payload.icons)
    ? payload.icons.map(normalizeIcon).filter((icon): icon is IconSearchIcon => Boolean(icon))
    : []
  const total = numberFrom(payload.total, icons.length)

  return {
    icons,
    total,
    page: numberFrom(payload.page, page),
    totalPages: numberFrom(payload.totalPages, total > 0 ? Math.ceil(total / limit) : 0),
    query: asRecord(payload.query),
  }
}

export async function getIcon(library: string, name: string) {
  const url = new URL(
    `${getApiBase()}/api/v1/icons/${encodeURIComponent(library)}/${encodeURIComponent(name)}`,
  )
  const payload = await authenticatedJson(url)
  const icon = normalizeIcon(asRecord(payload.icon))
  if (!icon || typeof payload.icon !== 'object') throw new Error('IconSearch returned an invalid icon response.')

  const rawIcon = payload.icon as Record<string, unknown>
  const svg = stringFrom(rawIcon.svg)
  if (!svg.startsWith('<svg')) throw new Error('IconSearch did not return valid SVG markup.')

  return {
    ...icon,
    svg,
    checksum: stringFrom(rawIcon.checksum) || undefined,
  }
}

async function authenticatedJson(url: URL) {
  const token = await requireToken()
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
      'x-iconsearch-product': 'mcp',
    },
    redirect: 'error',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  const contentLength = Number.parseInt(response.headers.get('content-length') || '0', 10)
  if (contentLength > MAX_JSON_BYTES) throw new Error('IconSearch returned an unexpectedly large response.')

  const text = await response.text()
  if (Buffer.byteLength(text, 'utf8') > MAX_JSON_BYTES) {
    throw new Error('IconSearch returned an unexpectedly large response.')
  }

  let payload: Record<string, unknown> = {}
  try {
    payload = asRecord(JSON.parse(text))
  } catch {
    if (response.ok) throw new Error('IconSearch returned invalid JSON.')
  }

  if (!response.ok) {
    throw new Error(stringFrom(payload.error) || `IconSearch returned ${response.status}.`)
  }
  return payload
}

function applyLibraryParams(url: URL, value: string) {
  if (value === 'all') return
  if (value === 'iconify') {
    url.searchParams.set('lib', 'iconify')
    return
  }
  if (value.startsWith('iconify:')) {
    url.searchParams.set('lib', 'iconify')
    url.searchParams.set('iconifySet', value.slice('iconify:'.length))
    return
  }
  url.searchParams.set('lib', value)
}

function normalizeIcon(value: unknown): IconSearchIcon | undefined {
  if (!value || typeof value !== 'object') return undefined
  const item = value as Record<string, unknown>
  const name = stringFrom(item.name)
  const library = stringFrom(item.library)
  const svgUrl = stringFrom(item.svgUrl)
  if (!name || !library || !svgUrl) return undefined

  const previewUrls = Array.isArray(item.previewUrls)
    ? item.previewUrls.filter((url): url is string => typeof url === 'string' && /^https?:\/\//.test(url))
    : []

  return {
    id: stringFrom(item.id) || `${library}-${name}`,
    name,
    displayName: formatIconTitle(stringFrom(item.displayName) || name),
    library,
    libraryName: stringFrom(item.libraryName) || library,
    npmPackage: optionalString(item.npmPackage),
    license: optionalString(item.license),
    licenseUrl: optionalString(item.licenseUrl),
    licenseNotice: optionalString(item.licenseNotice),
    usageRequirements: optionalString(item.usageRequirements),
    legalSafe: item.legalSafe === true,
    authorName: optionalString(item.authorName),
    authorUrl: optionalString(item.authorUrl),
    sourceUrl: optionalString(item.sourceUrl),
    svgUrl,
    previewUrls,
    reactImport: optionalString(item.reactImport),
    reactUsage: optionalString(item.reactUsage),
    tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === 'string') : [],
  }
}

function formatIconTitle(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function stringFrom(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function optionalString(value: unknown) {
  const text = stringFrom(value)
  return text || undefined
}

function numberFrom(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
