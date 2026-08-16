import { publicJson, publicOptions } from '@/lib/device-auth'
import { readExtensionSession } from '@/lib/extension-session'
import { GET as searchIcons } from '@/app/api/icon-search/route'
import {
  enrichExtensionIcon,
  ICON_SOURCE_SET_COUNT,
  ICON_SOURCE_SET_OPTIONS,
} from '@/lib/icon-source-sets'

export const runtime = 'nodejs'

export function OPTIONS() {
  return publicOptions()
}

export async function GET(request: Request) {
  const session = await readExtensionSession(request)
  if (!session) {
    return publicJson({ error: 'A valid IconSearch extension session is required.' }, { status: 401 })
  }

  const requestedProduct = request.headers.get('x-iconsearch-product')
  if (requestedProduct !== session.session.product) {
    return publicJson({ error: 'This session is not valid for the requested product.' }, { status: 403 })
  }
  if (session.scopes && !session.scopes.includes('icons:read')) {
    return publicJson({ error: 'This OAuth grant does not include icon search access.' }, { status: 403 })
  }

  const searchUrl = new URL(request.url)
  if (!searchUrl.searchParams.has('legalOnly')) searchUrl.searchParams.set('legalOnly', '1')
  const response = await searchIcons(
    new Request(searchUrl, {
      method: 'GET',
      headers: request.headers,
    }),
  )
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>

  if (!response.ok) {
    return publicJson(payload, { status: response.status })
  }

  const facets = isRecord(payload.facets) ? { ...payload.facets } : {}
  delete facets.libraries
  delete facets.libraryOptions
  delete facets.iconifySets
  delete facets.legalSafeCount
  delete facets.legalOnlyApplied
  facets.sourceSets = ICON_SOURCE_SET_OPTIONS

  const catalogStats = isRecord(payload.catalogStats) ? { ...payload.catalogStats } : {}
  delete catalogStats.iconifyIcons
  delete catalogStats.iconifyCollections
  catalogStats.sourceSets = ICON_SOURCE_SET_COUNT

  return publicJson({
    ...payload,
    icons: Array.isArray(payload.icons)
      ? payload.icons.map((icon) => (isRecord(icon) ? enrichExtensionIcon(icon, request.url) : icon))
      : [],
    facets,
    catalogStats,
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
