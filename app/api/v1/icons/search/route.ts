import { GET as searchIconCatalog } from '@/app/api/icon-search/route'
import { authenticateAgentRequest, consumeAgentQuota, withAgentHeaders } from '@/lib/agent-api'
import { publicJson, publicOptions } from '@/lib/device-auth'
import { enrichExtensionIcon } from '@/lib/icon-source-sets'

export const runtime = 'nodejs'

const ALLOWED_PARAMS = new Set([
  'q',
  'lib',
  'iconifySet',
  'sourceSet',
  'style',
  'category',
  'legalOnly',
  'page',
  'limit',
  'sort',
])

export function OPTIONS() {
  return publicOptions()
}

export async function GET(request: Request) {
  const auth = await authenticateAgentRequest(request)
  if (!auth.ok) return auth.response

  const requestUrl = new URL(request.url)
  for (const key of requestUrl.searchParams.keys()) {
    if (!ALLOWED_PARAMS.has(key)) {
      return publicJson({ error: `Unsupported search parameter: ${key}` }, { status: 400 })
    }
  }

  const query = (requestUrl.searchParams.get('q') || '').trim()
  if (query.length > 160) return publicJson({ error: 'Search query must be 160 characters or fewer.' }, { status: 400 })

  const limit = clampInteger(requestUrl.searchParams.get('limit'), 12, 1, 50)
  const page = clampInteger(requestUrl.searchParams.get('page'), 1, 1, 1_000)
  requestUrl.searchParams.set('limit', String(limit))
  requestUrl.searchParams.set('page', String(page))
  if (!requestUrl.searchParams.has('legalOnly')) requestUrl.searchParams.set('legalOnly', '1')
  if (!requestUrl.searchParams.has('sort')) requestUrl.searchParams.set('sort', query ? 'relevance' : 'popular')

  const quota = await consumeAgentQuota(auth.context, 'search')
  if (!quota.ok) return quota.response

  const catalogResponse = await searchIconCatalog(
    new Request(requestUrl, { method: 'GET', headers: request.headers }),
  )
  const payload = (await catalogResponse.json().catch(() => ({}))) as Record<string, unknown>

  if (!catalogResponse.ok) {
    return withAgentHeaders(publicJson(payload, { status: catalogResponse.status }), quota.remaining)
  }

  const icons = Array.isArray(payload.icons)
    ? payload.icons.map((icon) => (isRecord(icon) ? enrichExtensionIcon(icon, request.url) : icon))
    : []

  return withAgentHeaders(
    publicJson({
      icons,
      total: payload.total,
      page: payload.page,
      limit: payload.limit,
      totalPages: payload.totalPages,
      query: payload.query,
      catalogStats: payload.catalogStats,
    }),
    quota.remaining,
  )
}

function clampInteger(value: string | null, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
