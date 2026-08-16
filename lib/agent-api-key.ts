import 'server-only'

import { hashOpaqueToken, randomToken } from './device-auth'

export const AGENT_API_KEY_PREFIX = 'ics_live_'
export const AGENT_API_KEY_LIFETIME_DAYS = 90

export function generateAgentApiKey() {
  const secret = `${AGENT_API_KEY_PREFIX}${randomToken(32)}`
  return {
    secret,
    tokenHash: hashOpaqueToken(secret),
    visiblePrefix: secret.slice(0, AGENT_API_KEY_PREFIX.length + 10),
    expiresAt: new Date(Date.now() + AGENT_API_KEY_LIFETIME_DAYS * 24 * 60 * 60 * 1_000).toISOString(),
  }
}

export function isAgentApiKey(value: string) {
  return value.startsWith(AGENT_API_KEY_PREFIX) && value.length >= AGENT_API_KEY_PREFIX.length + 32
}
