import { createHash } from 'node:crypto'
import { GET as getSvg } from '@/app/api/svg/[library]/[name]/route'
import { loadIcons } from '@/app/api/icon-search/route'
import { authenticateAgentRequest, consumeAgentQuota, withAgentHeaders } from '@/lib/agent-api'
import { publicJson, publicOptions } from '@/lib/device-auth'
import { enrichExtensionIcon, getIconSourceSetId } from '@/lib/icon-source-sets'

export const runtime = 'nodejs'

const SAFE_SEGMENT = /^[a-z0-9][a-z0-9._-]{0,119}$/i
const MAX_SVG_BYTES = 512 * 1024

export function OPTIONS() {
  return publicOptions()
}

export async function GET(
  request: Request,
  context: { params: Promise<{ library: string; name: string }> },
) {
  const auth = await authenticateAgentRequest(request)
  if (!auth.ok) return auth.response

  const { library: encodedLibrary, name: encodedName } = await context.params
  const library = decodeSegment(encodedLibrary)
  const name = decodeSegment(encodedName).replace(/\.svg$/i, '')
  if (!SAFE_SEGMENT.test(library) || !SAFE_SEGMENT.test(name)) {
    return publicJson({ error: 'Invalid icon library or name.' }, { status: 400 })
  }

  const icon = loadIcons().find(
    (candidate) => getIconSourceSetId(candidate.library) === library && candidate.name.replace(/\.svg$/i, '').toLowerCase() === name,
  )
  if (!icon) return publicJson({ error: 'Icon not found.' }, { status: 404 })

  const quota = await consumeAgentQuota(auth.context, 'retrieve')
  if (!quota.ok) return quota.response

  const svgUrl = new URL(
    `/api/svg/${encodeURIComponent(library)}/${encodeURIComponent(name)}`,
    request.url,
  )
  const svgResponse = await getSvg(
    new Request(svgUrl, { method: 'GET', headers: request.headers }),
    { params: Promise.resolve({ library, name }) },
  )
  if (!svgResponse.ok) {
    return withAgentHeaders(
      publicJson({ error: 'The selected icon SVG could not be retrieved.' }, { status: svgResponse.status }),
      quota.remaining,
    )
  }

  const svg = await svgResponse.text()
  if (!svg.startsWith('<svg') || Buffer.byteLength(svg, 'utf8') > MAX_SVG_BYTES) {
    return withAgentHeaders(publicJson({ error: 'The selected SVG failed validation.' }, { status: 502 }), quota.remaining)
  }

  const enriched = enrichExtensionIcon(icon as unknown as Record<string, unknown>, request.url)
  return withAgentHeaders(
    publicJson({
      icon: {
        ...enriched,
        svg,
        checksum: `sha256:${createHash('sha256').update(svg).digest('hex')}`,
      },
    }),
    quota.remaining,
  )
}

function decodeSegment(value: string) {
  try {
    return decodeURIComponent(value).trim().toLowerCase()
  } catch {
    return ''
  }
}
