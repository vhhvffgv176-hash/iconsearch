import {
  CANVA_OAUTH_ACCESS_TTL_SECONDS,
  CANVA_OAUTH_REFRESH_TTL_SECONDS,
  getCanvaOauthConfig,
  getOauthClientCredentials,
  hashOauthToken,
  oauthJson,
  parseScope,
  randomOauthToken,
  validateOauthClient,
  verifyPkce,
} from '@/lib/canva-oauth'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>
type TokenSubject = {
  client_id: string
  user_id: string
  product: string
  entitlement_id: string
  scope: string[]
}

export async function POST(request: Request) {
  const config = getCanvaOauthConfig()
  const admin = createSupabaseAdminClient()
  if (!config || !admin) {
    return oauthJson({ error: 'temporarily_unavailable' }, 503)
  }

  let body: URLSearchParams
  try {
    body = new URLSearchParams(await request.text())
  } catch {
    return oauthJson({ error: 'invalid_request' }, 400)
  }

  const credentials = getOauthClientCredentials(request, body)
  if (!validateOauthClient(credentials, config)) {
    return new Response(JSON.stringify({ error: 'invalid_client' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        'WWW-Authenticate': 'Basic realm="IconSearch OAuth"',
      },
    })
  }

  try {
    const grantType = body.get('grant_type')
    if (grantType === 'authorization_code') {
      return await redeemAuthorizationCode(admin, config, body)
    }
    if (grantType === 'refresh_token') {
      return await rotateRefreshToken(admin, config, body)
    }
    return oauthJson({ error: 'unsupported_grant_type' }, 400)
  } catch (error) {
    console.error('Canva OAuth token exchange failed:', error)
    return oauthJson({ error: 'server_error' }, 500)
  }
}

async function redeemAuthorizationCode(
  admin: AdminClient,
  config: NonNullable<ReturnType<typeof getCanvaOauthConfig>>,
  body: URLSearchParams
) {
  const code = body.get('code') || ''
  const redirectUri = body.get('redirect_uri') || ''
  const codeVerifier = body.get('code_verifier') || ''
  if (!code || !redirectUri || !codeVerifier) {
    return oauthJson({ error: 'invalid_request' }, 400)
  }

  const { data: authorizationCode, error } = await admin
    .from('oauth_authorization_codes')
    .select('id,client_id,user_id,product,entitlement_id,redirect_uri,scope,code_challenge,expires_at,consumed_at')
    .eq('code_hash', hashOauthToken(code, config))
    .maybeSingle()

  if (error) throw error
  if (
    !authorizationCode ||
    authorizationCode.client_id !== config.clientId ||
    authorizationCode.redirect_uri !== redirectUri ||
    authorizationCode.consumed_at ||
    new Date(authorizationCode.expires_at).getTime() <= Date.now() ||
    !verifyPkce(codeVerifier, authorizationCode.code_challenge)
  ) {
    return oauthJson({ error: 'invalid_grant' }, 400)
  }

  if (!await hasActiveEntitlement(admin, authorizationCode.entitlement_id)) {
    return oauthJson({ error: 'invalid_grant' }, 400)
  }

  const consumedAt = new Date().toISOString()
  const { data: consumed, error: consumeError } = await admin
    .from('oauth_authorization_codes')
    .update({ consumed_at: consumedAt })
    .eq('id', authorizationCode.id)
    .is('consumed_at', null)
    .select('id')
    .maybeSingle()

  if (consumeError) throw consumeError
  if (!consumed) return oauthJson({ error: 'invalid_grant' }, 400)

  return issueTokenPair(admin, config, {
    client_id: authorizationCode.client_id,
    user_id: authorizationCode.user_id,
    product: authorizationCode.product,
    entitlement_id: authorizationCode.entitlement_id,
    scope: normalizeStoredScope(authorizationCode.scope),
  })
}

async function rotateRefreshToken(
  admin: AdminClient,
  config: NonNullable<ReturnType<typeof getCanvaOauthConfig>>,
  body: URLSearchParams
) {
  const refreshToken = body.get('refresh_token') || ''
  if (!refreshToken) return oauthJson({ error: 'invalid_request' }, 400)

  const { data: storedToken, error } = await admin
    .from('oauth_refresh_tokens')
    .select('id,client_id,user_id,product,entitlement_id,scope,expires_at,revoked_at,rotated_at')
    .eq('token_hash', hashOauthToken(refreshToken, config))
    .maybeSingle()

  if (error) throw error
  if (!storedToken || storedToken.client_id !== config.clientId) {
    return oauthJson({ error: 'invalid_grant' }, 400)
  }

  if (storedToken.revoked_at || storedToken.rotated_at) {
    await revokeClientGrant(admin, storedToken.user_id, storedToken.client_id)
    return oauthJson({ error: 'invalid_grant' }, 400)
  }
  if (new Date(storedToken.expires_at).getTime() <= Date.now()) {
    return oauthJson({ error: 'invalid_grant' }, 400)
  }
  if (!await hasActiveEntitlement(admin, storedToken.entitlement_id)) {
    await revokeClientGrant(admin, storedToken.user_id, storedToken.client_id)
    return oauthJson({ error: 'invalid_grant' }, 400)
  }

  const grantedScope = normalizeStoredScope(storedToken.scope)
  const requestedScope = parseScope(body.get('scope') || '')
  const scope = requestedScope.length ? requestedScope : grantedScope
  if (!scope.includes('icons:read') || scope.some((value) => !grantedScope.includes(value))) {
    return oauthJson({ error: 'invalid_scope' }, 400)
  }

  const rotatedAt = new Date().toISOString()
  const { data: rotated, error: rotateError } = await admin
    .from('oauth_refresh_tokens')
    .update({ rotated_at: rotatedAt })
    .eq('id', storedToken.id)
    .is('revoked_at', null)
    .is('rotated_at', null)
    .select('id')
    .maybeSingle()

  if (rotateError) throw rotateError
  if (!rotated) {
    await revokeClientGrant(admin, storedToken.user_id, storedToken.client_id)
    return oauthJson({ error: 'invalid_grant' }, 400)
  }

  await admin
    .from('oauth_access_tokens')
    .update({ revoked_at: rotatedAt })
    .eq('refresh_token_id', storedToken.id)
    .is('revoked_at', null)

  return issueTokenPair(admin, config, {
    client_id: storedToken.client_id,
    user_id: storedToken.user_id,
    product: storedToken.product,
    entitlement_id: storedToken.entitlement_id,
    scope,
  }, storedToken.id)
}

async function issueTokenPair(
  admin: AdminClient,
  config: NonNullable<ReturnType<typeof getCanvaOauthConfig>>,
  subject: TokenSubject,
  parentTokenId?: string
) {
  const accessToken = randomOauthToken()
  const refreshToken = randomOauthToken()
  const now = Date.now()
  const accessExpiresAt = new Date(now + CANVA_OAUTH_ACCESS_TTL_SECONDS * 1000).toISOString()
  const refreshExpiresAt = new Date(now + CANVA_OAUTH_REFRESH_TTL_SECONDS * 1000).toISOString()

  const { data: refreshRow, error: refreshError } = await admin
    .from('oauth_refresh_tokens')
    .insert({
      token_hash: hashOauthToken(refreshToken, config),
      client_id: subject.client_id,
      user_id: subject.user_id,
      product: subject.product,
      entitlement_id: subject.entitlement_id,
      scope: subject.scope,
      expires_at: refreshExpiresAt,
      parent_token_id: parentTokenId || null,
    })
    .select('id')
    .single()
  if (refreshError) throw refreshError

  const { error: accessError } = await admin.from('oauth_access_tokens').insert({
    token_hash: hashOauthToken(accessToken, config),
    refresh_token_id: refreshRow.id,
    client_id: subject.client_id,
    user_id: subject.user_id,
    product: subject.product,
    entitlement_id: subject.entitlement_id,
    scope: subject.scope,
    expires_at: accessExpiresAt,
  })
  if (accessError) {
    await admin
      .from('oauth_refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', refreshRow.id)
    throw accessError
  }

  return oauthJson({
    token_type: 'Bearer',
    access_token: accessToken,
    expires_in: CANVA_OAUTH_ACCESS_TTL_SECONDS,
    refresh_token: refreshToken,
    refresh_token_expires_in: CANVA_OAUTH_REFRESH_TTL_SECONDS,
    scope: subject.scope.join(' '),
  })
}

async function hasActiveEntitlement(admin: AdminClient, entitlementId: string) {
  const { data, error } = await admin
    .from('entitlements')
    .select('status,expires_at')
    .eq('id', entitlementId)
    .maybeSingle()
  if (error) throw error
  return Boolean(
    data &&
    data.status === 'active' &&
    (!data.expires_at || new Date(data.expires_at).getTime() > Date.now())
  )
}

async function revokeClientGrant(admin: AdminClient, userId: string, clientId: string) {
  const revokedAt = new Date().toISOString()
  await Promise.all([
    admin
      .from('oauth_access_tokens')
      .update({ revoked_at: revokedAt })
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .is('revoked_at', null),
    admin
      .from('oauth_refresh_tokens')
      .update({ revoked_at: revokedAt })
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .is('revoked_at', null),
  ])
}

function normalizeStoredScope(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((scope): scope is string => typeof scope === 'string') : []
}
