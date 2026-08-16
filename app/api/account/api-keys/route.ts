import { accountJson, readBoundedJson, requireAccountApiContext, requireSameOrigin } from '@/lib/account-api'
import { generateAgentApiKey } from '@/lib/agent-api-key'
import { getErrorText } from '@/lib/device-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAccountApiContext()
  if (!auth.ok) return auth.response

  const { data, error } = await auth.context.admin
    .from('agent_api_keys')
    .select('id,name,key_prefix,created_at,last_used_at,expires_at,revoked_at')
    .eq('user_id', auth.context.userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Could not list Agent API keys:', error)
    return accountJson(
      { error: 'API keys are not configured yet. Apply the latest Supabase migration.' },
      { status: 503 },
    )
  }

  return accountJson({ keys: (data || []).map(formatApiKey) })
}

export async function POST(request: Request) {
  const originError = requireSameOrigin(request)
  if (originError) return originError

  const auth = await requireAccountApiContext()
  if (!auth.ok) return auth.response

  const parsed = await readBoundedJson(request)
  if (!parsed.ok) return parsed.response

  const name = typeof parsed.body.name === 'string' ? parsed.body.name.trim() : ''
  if (name.length < 2 || name.length > 60 || /[\u0000-\u001f\u007f]/.test(name)) {
    return accountJson({ error: 'Key name must be between 2 and 60 normal characters.' }, { status: 400 })
  }

  try {
    const generated = generateAgentApiKey()
    const { data, error } = await auth.context.admin.rpc('create_agent_api_key', {
      p_user_id: auth.context.userId,
      p_name: name,
      p_key_prefix: generated.visiblePrefix,
      p_token_hash: generated.tokenHash,
      p_expires_at: generated.expiresAt,
    })
    if (error) throw error

    const created = Array.isArray(data) ? data[0] : data
    if (!created) throw new Error('No API key record was returned.')

    return accountJson(
      {
        key: formatApiKey({
          id: created.api_key_id,
          name: created.api_key_name,
          key_prefix: created.api_key_prefix,
          created_at: created.api_key_created_at,
          last_used_at: null,
          expires_at: created.api_key_expires_at,
          revoked_at: null,
        }),
        secret: generated.secret,
        message: 'Copy this API key now. It will not be shown again.',
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Could not create Agent API key:', error)
    const message = getErrorText(error)
    if (message.includes('active_api_key_limit')) {
      return accountJson({ error: 'You can have up to five active API keys. Revoke an old key first.' }, { status: 409 })
    }
    if (message.includes('api_key_creation_rate_limit')) {
      return accountJson({ error: 'Too many API keys were created today. Try again tomorrow.' }, { status: 429 })
    }
    if (message.includes('inactive_mcp_entitlement')) {
      return accountJson({ error: 'Your IconSearch agent access is not active.' }, { status: 403 })
    }
    if (message.includes('DEVICE_TOKEN_PEPPER')) {
      return accountJson({ error: 'API key security is not configured on the server.' }, { status: 503 })
    }
    return accountJson(
      { error: 'API key creation is not configured yet. Apply the latest Supabase migration.' },
      { status: 503 },
    )
  }
}

function formatApiKey(value: Record<string, unknown>) {
  const expiresAt = String(value.expires_at || '')
  const revokedAt = typeof value.revoked_at === 'string' ? value.revoked_at : null
  return {
    id: String(value.id || ''),
    name: String(value.name || ''),
    prefix: String(value.key_prefix || ''),
    createdAt: String(value.created_at || ''),
    lastUsedAt: typeof value.last_used_at === 'string' ? value.last_used_at : null,
    expiresAt,
    revokedAt,
    status: revokedAt ? 'revoked' : new Date(expiresAt).getTime() <= Date.now() ? 'expired' : 'active',
  }
}
