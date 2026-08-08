import { createSupabaseAdminClient } from './supabase-admin'
import { getBearerToken, hashOpaqueToken } from './device-auth'
import { getCanvaOauthConfig, hashOauthToken } from './canva-oauth'

export async function readExtensionSession(request: Request) {
  const token = getBearerToken(request)
  const admin = createSupabaseAdminClient()
  if (!token || !admin) return null

  let extensionSession = null
  try {
    const tokenHash = hashOpaqueToken(token)
    const { data, error } = await admin
      .from('extension_sessions')
      .select('id,user_id,product,entitlement_id,expires_at,revoked_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()
    if (!error) extensionSession = data
  } catch {
    // OAuth access remains available when the legacy device-token pepper is absent.
  }

  let session = extensionSession
  let sessionTable: 'extension_sessions' | 'oauth_access_tokens' = 'extension_sessions'
  let scopes: string[] | null = null
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
    sessionTable = 'oauth_access_tokens'
    scopes = Array.isArray(oauthSession.scope)
      ? oauthSession.scope.filter((scope): scope is string => typeof scope === 'string')
      : []
  }

  if (session.revoked_at) return null
  if (new Date(session.expires_at).getTime() <= Date.now()) return null

  const { data: entitlement } = await admin
    .from('entitlements')
    .select('id,tier,status,founder_number,expires_at')
    .eq('id', session.entitlement_id)
    .maybeSingle()

  if (!entitlement || entitlement.status !== 'active') return null
  if (entitlement.expires_at && new Date(entitlement.expires_at).getTime() <= Date.now()) return null

  const { data: userResult } = await admin.auth.admin.getUserById(session.user_id)

  await admin
    .from(sessionTable)
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', session.id)

  return {
    admin,
    session,
    scopes,
    entitlement,
    email: userResult.user?.email || '',
  }
}
