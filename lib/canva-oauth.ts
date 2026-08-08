import 'server-only'

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const CANVA_OAUTH_PRODUCT = 'canva'
export const CANVA_OAUTH_ALLOWED_SCOPES = new Set(['icons:read', 'offline_access'])
export const CANVA_OAUTH_ACCESS_TTL_SECONDS = 60 * 60
export const CANVA_OAUTH_REFRESH_TTL_SECONDS = 90 * 24 * 60 * 60
export const CANVA_OAUTH_CODE_TTL_SECONDS = 10 * 60

export type CanvaOauthConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
  tokenPepper: string
}

export type AuthorizationRequest = {
  clientId: string
  redirectUri: string
  state: string
  scope: string[]
  codeChallenge: string
  codeChallengeMethod: 'S256'
}

export function getCanvaOauthConfig(): CanvaOauthConfig | null {
  const clientId = process.env.CANVA_OAUTH_CLIENT_ID?.trim()
  const clientSecret = process.env.CANVA_OAUTH_CLIENT_SECRET?.trim()
  const redirectUri = process.env.CANVA_OAUTH_REDIRECT_URI?.trim()
  const tokenPepper = process.env.CANVA_OAUTH_TOKEN_PEPPER?.trim()

  if (!clientId || !clientSecret || !redirectUri || !tokenPepper || tokenPepper.length < 32) {
    return null
  }

  try {
    const parsed = new URL(redirectUri)
    if (parsed.protocol !== 'https:') return null
  } catch {
    return null
  }

  return { clientId, clientSecret, redirectUri, tokenPepper }
}

export function parseAuthorizationRequest(
  params: URLSearchParams,
  config: CanvaOauthConfig
): AuthorizationRequest | null {
  const clientId = params.get('client_id') || ''
  const redirectUri = params.get('redirect_uri') || ''
  const responseType = params.get('response_type') || ''
  const state = params.get('state') || ''
  const codeChallenge = params.get('code_challenge') || ''
  const codeChallengeMethod = params.get('code_challenge_method') || ''
  const scope = parseScope(params.get('scope') || '')

  if (!safeEqual(clientId, config.clientId)) return null
  if (redirectUri !== config.redirectUri || responseType !== 'code' || !state || state.length > 1024) return null
  if (codeChallengeMethod !== 'S256' || !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)) return null
  if (!scope.includes('icons:read') || scope.some((value) => !CANVA_OAUTH_ALLOWED_SCOPES.has(value))) return null

  return {
    clientId,
    redirectUri,
    state,
    scope,
    codeChallenge,
    codeChallengeMethod: 'S256',
  }
}

export function parseScope(value: string): string[] {
  return [...new Set(value.split(/\s+/).map((item) => item.trim()).filter(Boolean))]
}

export function authorizationRedirect(
  request: Pick<AuthorizationRequest, 'redirectUri' | 'state'>,
  values: Record<string, string>
) {
  const url = new URL(request.redirectUri)
  Object.entries(values).forEach(([name, value]) => url.searchParams.set(name, value))
  url.searchParams.set('state', request.state)
  return url.toString()
}

export function randomOauthToken(bytes = 48) {
  return randomBytes(bytes).toString('base64url')
}

export function hashOauthToken(token: string, config: CanvaOauthConfig) {
  return createHmac('sha256', config.tokenPepper).update(token, 'utf8').digest('hex')
}

export function verifyPkce(codeVerifier: string, codeChallenge: string) {
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(codeVerifier)) return false
  const calculated = createHash('sha256').update(codeVerifier, 'utf8').digest('base64url')
  return safeEqual(calculated, codeChallenge)
}

export function getOauthClientCredentials(request: Request, body: URLSearchParams) {
  const authorization = request.headers.get('authorization') || ''
  if (authorization.toLowerCase().startsWith('basic ')) {
    try {
      const decoded = Buffer.from(authorization.slice(6).trim(), 'base64').toString('utf8')
      const separator = decoded.indexOf(':')
      if (separator >= 0) {
        return {
          clientId: decoded.slice(0, separator),
          clientSecret: decoded.slice(separator + 1),
        }
      }
    } catch {
      return null
    }
  }

  const clientId = body.get('client_id') || ''
  const clientSecret = body.get('client_secret') || ''
  return clientId && clientSecret ? { clientId, clientSecret } : null
}

export function validateOauthClient(
  credentials: { clientId: string; clientSecret: string } | null,
  config: CanvaOauthConfig
) {
  return Boolean(
    credentials &&
    safeEqual(credentials.clientId, config.clientId) &&
    safeEqual(credentials.clientSecret, config.clientSecret)
  )
}

export function oauthJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  })
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'utf8')
  const rightBuffer = Buffer.from(right, 'utf8')
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}
