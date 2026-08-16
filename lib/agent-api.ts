import { publicJson } from './device-auth'
import { readExtensionSession } from './extension-session'

export const AGENT_PRODUCT = 'mcp'

export type AgentRequestContext = NonNullable<Awaited<ReturnType<typeof readExtensionSession>>>

export async function authenticateAgentRequest(request: Request): Promise<
  | { ok: true; context: AgentRequestContext }
  | { ok: false; response: Response }
> {
  const context = await readExtensionSession(request)
  if (!context) {
    return { ok: false, response: publicJson({ error: 'A valid IconSearch API key or MCP session is required.' }, { status: 401 }) }
  }

  if (context.session.product !== AGENT_PRODUCT) {
    return { ok: false, response: publicJson({ error: 'This session is not authorized for the Agent API.' }, { status: 403 }) }
  }

  const requestedProduct = request.headers.get('x-iconsearch-product')
  if (requestedProduct && requestedProduct !== AGENT_PRODUCT) {
    return { ok: false, response: publicJson({ error: 'The requested product does not match this session.' }, { status: 403 }) }
  }

  if (context.scopes && !context.scopes.includes('icons:read')) {
    return { ok: false, response: publicJson({ error: 'This grant does not include icon access.' }, { status: 403 }) }
  }

  return { ok: true, context }
}

export async function consumeAgentQuota(
  context: AgentRequestContext,
  action: 'search' | 'retrieve',
): Promise<{ ok: true; remaining: number | null } | { ok: false; response: Response }> {
  const { data, error } = await context.admin.rpc('record_agent_usage', {
    p_user_id: context.session.user_id,
    p_action: action,
    p_quantity: 1,
  })

  if (error) {
    console.error('Could not record Agent API usage:', error)
    return {
      ok: false,
      response: publicJson(
        { error: 'Agent API usage accounting is not configured. Apply the latest Supabase migration.' },
        { status: 503 },
      ),
    }
  }

  const result = Array.isArray(data) ? data[0] : data
  if (!result || result.allowed !== true) {
    const limit = typeof result?.daily_limit === 'number' ? result.daily_limit : null
    return {
      ok: false,
      response: publicJson(
        { error: 'Daily Agent API limit reached.', limit, resetsAt: nextUtcDay() },
        { status: 429, headers: { 'Retry-After': secondsUntilNextUtcDay().toString() } },
      ),
    }
  }

  const used = typeof result.quantity === 'number' ? result.quantity : null
  const limit = typeof result.daily_limit === 'number' ? result.daily_limit : null
  return { ok: true, remaining: used !== null && limit !== null ? Math.max(0, limit - used) : null }
}

export function withAgentHeaders(response: Response, remaining: number | null) {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'private, no-store')
  headers.set('Vary', 'Authorization, X-IconSearch-Product')
  if (remaining !== null) headers.set('X-RateLimit-Remaining', String(remaining))

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function nextUtcDay() {
  const next = new Date()
  next.setUTCHours(24, 0, 0, 0)
  return next.toISOString()
}

function secondsUntilNextUtcDay() {
  return Math.max(1, Math.ceil((new Date(nextUtcDay()).getTime() - Date.now()) / 1_000))
}
