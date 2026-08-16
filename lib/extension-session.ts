import { createSupabaseAdminClient } from './supabase-admin'
import { getBearerToken, hashOpaqueToken } from './device-auth'
import { getCanvaOauthConfig, hashOauthToken } from './canva-oauth'
import { isAgentApiKey } from './agent-api-key'

type ProductSession = {
  id: string
  user_id: string
  product: string
  entitlement_id: string
  expires_at: string | null
  revoked_at: string | null
}

export async function readExtensionSession(request: Request) {
  const token = getBearerToken(request)
  const admin = createSupabaseAdminClient()
  if (!token || !admin) return null

  let session: ProductSession | null = null
  let sessionKind: 'extension' | 'oauth' | 'api-key' = 'extension'
  let scopes: string[] | null = null

  if (isAgentApiKey(token)) {
    try {
      const { data, error } = await admin
        .from('agent_api_keys')
        .select('id,user_id,entitlement_id,expires_at,revoked_at,scopes')
        .eq('token_hash', hashOpaqueToken(token))
        .maybeSingle()

      if (!error && data) {
        session = { ...data, product: 'mcp' }
        scopes = Array.isArray(data.scopes)
          ? data.scopes.filter((scope): scope is string => typeof scope === 'string')
          : []
        sessionKind = 'api-key'
      }
    } catch {
      return null
    }
  } else {
    try {
      const tokenHash = hashOpaqueToken(token)
      const { data, error } = await admin
        .from('extension_sessions')
        .select('id,user_id,product,entitlement_id,expires_at,revoked_at')
        .eq('token_hash', tokenHash)
        .maybeSingle()
      if (!error && data) session = data
    } catch {
      // OAuth access remains available when the device-token pepper is unavailable.
    }
  }

  if (!session) {
    const oauthConfig = getCanvaOauthConfig()
    if (!oauthConfig) return null

    const { data: oauthSession, error: oauthError } = await admin
      .from('oauth_access_tokens')
      .select('id,user_id,product,entitlement_id,expires_at,revoked_at,scope')
      .eq('token_hash', hashOauthToken(token, oauthConfig))
      .maybeSingle()

    if (oauthError || !oauthSession) return null
    session = oauthSession
    sessionKind = 'oauth'
    scopes = Array.isArray(oauthSession.scope)
      ? oauthSession.scope.filter((scope): scope is string => typeof scope === 'string')
      : []
  }

  if (session.revoked_at) return null
  if (session.expires_at && new Date(session.expires_at).getTime() <= Date.now()) return null

  const { data: entitlement } = await admin
    .from('entitlements')
    .select('id,tier,status,founder_number,expires_at')
    .eq('id', session.entitlement_id)
    .maybeSingle()

  if (!entitlement || entitlement.status !== 'active') return null
  if (entitlement.expires_at && new Date(entitlement.expires_at).getTime() <= Date.now()) return null

  const { data: userResult } = await admin.auth.admin.getUserById(session.user_id)

  const seenAt = new Date().toISOString()
  if (sessionKind === 'api-key') {
    await admin.from('agent_api_keys').update({ last_used_at: seenAt }).eq('id', session.id)
  } else {
    const table = sessionKind === 'oauth' ? 'oauth_access_tokens' : 'extension_sessions'
    await admin.from(table).update({ last_seen_at: seenAt }).eq('id', session.id)
  }

  return {
    admin,
    session,
    scopes,
    entitlement,
    email: userResult.user?.email || '',
  }
}
