import {
  authorizationRedirect,
  CANVA_OAUTH_CODE_TTL_SECONDS,
  CANVA_OAUTH_PRODUCT,
  getCanvaOauthConfig,
  hashOauthToken,
  oauthJson,
  parseAuthorizationRequest,
  randomOauthToken,
} from '@/lib/canva-oauth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!hasValidOrigin(request)) {
    return oauthJson({ error: 'Invalid request origin.' }, 403)
  }

  const config = getCanvaOauthConfig()
  if (!config) {
    return oauthJson({ error: 'IconSearch OAuth is not configured.' }, 503)
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return oauthJson({ error: 'Invalid JSON body.' }, 400)
  }

  const decision = body.decision
  const requestQuery = typeof body.requestQuery === 'string' ? body.requestQuery : ''
  const authorizationRequest = parseAuthorizationRequest(new URLSearchParams(requestQuery), config)
  if (!authorizationRequest || (decision !== 'approve' && decision !== 'deny')) {
    return oauthJson({ error: 'Invalid authorization request.' }, 400)
  }

  if (decision === 'deny') {
    return oauthJson({
      redirectUrl: authorizationRedirect(authorizationRequest, { error: 'access_denied' }),
    })
  }

  const supabase = await createServerSupabaseClient()
  const admin = createSupabaseAdminClient()
  if (!supabase || !admin) {
    return oauthJson({ error: 'Account services are not configured.' }, 503)
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (claimsError || typeof userId !== 'string') {
    return oauthJson({ error: 'Sign in before connecting IconSearch to Canva.' }, 401)
  }

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await admin
      .from('oauth_authorization_codes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('client_id', authorizationRequest.clientId)
      .gte('created_at', oneHourAgo)

    if (countError) throw countError
    if ((count || 0) >= 20) {
      return oauthJson({ error: 'Too many connection attempts. Please try again later.' }, 429)
    }

    const { data: claimData, error: claimError } = await admin.rpc('claim_product_entitlement', {
      p_user_id: userId,
      p_product: CANVA_OAUTH_PRODUCT,
    })
    if (claimError) throw claimError

    const entitlement = Array.isArray(claimData) ? claimData[0] : claimData
    if (!entitlement?.entitlement_id || entitlement.entitlement_status !== 'active') {
      throw new Error('No active Canva entitlement was returned.')
    }

    const code = randomOauthToken()
    const expiresAt = new Date(Date.now() + CANVA_OAUTH_CODE_TTL_SECONDS * 1000).toISOString()
    const { error: insertError } = await admin.from('oauth_authorization_codes').insert({
      code_hash: hashOauthToken(code, config),
      client_id: authorizationRequest.clientId,
      user_id: userId,
      product: CANVA_OAUTH_PRODUCT,
      entitlement_id: entitlement.entitlement_id,
      redirect_uri: authorizationRequest.redirectUri,
      scope: authorizationRequest.scope,
      code_challenge: authorizationRequest.codeChallenge,
      code_challenge_method: authorizationRequest.codeChallengeMethod,
      expires_at: expiresAt,
    })
    if (insertError) throw insertError

    return oauthJson({
      redirectUrl: authorizationRedirect(authorizationRequest, { code }),
    })
  } catch (error) {
    console.error('Could not authorize Canva:', error)
    return oauthJson({
      error: 'Could not connect IconSearch. Run the latest database migration and try again.',
    }, 500)
  }
}

function hasValidOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true

  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}
