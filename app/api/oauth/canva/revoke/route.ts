import {
  getCanvaOauthConfig,
  getOauthClientCredentials,
  hashOauthToken,
  oauthJson,
  validateOauthClient,
} from '@/lib/canva-oauth'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

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
    return oauthJson({ error: 'invalid_client' }, 401)
  }

  const token = body.get('token') || ''
  if (!token) return oauthJson({ error: 'invalid_request' }, 400)

  try {
    const tokenHash = hashOauthToken(token, config)
    const [{ data: accessToken }, { data: refreshToken }] = await Promise.all([
      admin
        .from('oauth_access_tokens')
        .select('user_id,client_id')
        .eq('token_hash', tokenHash)
        .maybeSingle(),
      admin
        .from('oauth_refresh_tokens')
        .select('user_id,client_id')
        .eq('token_hash', tokenHash)
        .maybeSingle(),
    ])

    const grant = accessToken || refreshToken
    if (grant && grant.client_id === config.clientId) {
      const revokedAt = new Date().toISOString()
      await Promise.all([
        admin
          .from('oauth_access_tokens')
          .update({ revoked_at: revokedAt })
          .eq('user_id', grant.user_id)
          .eq('client_id', grant.client_id)
          .is('revoked_at', null),
        admin
          .from('oauth_refresh_tokens')
          .update({ revoked_at: revokedAt })
          .eq('user_id', grant.user_id)
          .eq('client_id', grant.client_id)
          .is('revoked_at', null),
      ])
    }

    return new Response(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
    })
  } catch (error) {
    console.error('Could not revoke Canva OAuth grant:', error)
    return oauthJson({ error: 'server_error' }, 500)
  }
}
