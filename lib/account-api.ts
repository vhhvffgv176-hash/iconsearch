import 'server-only'

import { createServerSupabaseClient } from './supabase-server'
import { createSupabaseAdminClient } from './supabase-admin'

const MAX_ACCOUNT_BODY_BYTES = 8 * 1024

export type AccountApiContext = {
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>
  userId: string
}

export async function requireAccountApiContext(): Promise<
  | { ok: true; context: AccountApiContext }
  | { ok: false; response: Response }
> {
  const supabase = await createServerSupabaseClient()
  const admin = createSupabaseAdminClient()
  if (!supabase || !admin) {
    return { ok: false, response: accountJson({ error: 'Account services are not configured.' }, { status: 503 }) }
  }

  const { data, error } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (error || typeof userId !== 'string') {
    return { ok: false, response: accountJson({ error: 'Sign in to manage API keys.' }, { status: 401 }) }
  }

  return { ok: true, context: { admin, userId } }
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return accountJson({ error: 'Missing request origin.' }, { status: 403 })

  try {
    const allowedOrigins = new Set([new URL(request.url).origin])
    const configuredSite = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    if (configuredSite) allowedOrigins.add(new URL(configuredSite).origin)
    if (!allowedOrigins.has(new URL(origin).origin)) {
      return accountJson({ error: 'Invalid request origin.' }, { status: 403 })
    }
  } catch {
    return accountJson({ error: 'Invalid request origin.' }, { status: 403 })
  }

  return null
}

export async function readBoundedJson(request: Request): Promise<
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; response: Response }
> {
  const declaredLength = Number.parseInt(request.headers.get('content-length') || '0', 10)
  if (declaredLength > MAX_ACCOUNT_BODY_BYTES) {
    return { ok: false, response: accountJson({ error: 'Request body is too large.' }, { status: 413 }) }
  }

  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > MAX_ACCOUNT_BODY_BYTES) {
    return { ok: false, response: accountJson({ error: 'Request body is too large.' }, { status: 413 }) }
  }

  try {
    const parsed = JSON.parse(text) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JSON object')
    return { ok: true, body: parsed as Record<string, unknown> }
  } catch {
    return { ok: false, response: accountJson({ error: 'Invalid JSON body.' }, { status: 400 }) }
  }
}

export function accountJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Cache-Control', 'private, no-store, max-age=0')
  headers.set('Pragma', 'no-cache')
  headers.set('X-Content-Type-Options', 'nosniff')
  return Response.json(body, { ...init, headers })
}
