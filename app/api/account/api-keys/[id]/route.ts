import { accountJson, requireAccountApiContext, requireSameOrigin } from '@/lib/account-api'

export const runtime = 'nodejs'

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const originError = requireSameOrigin(request)
  if (originError) return originError

  const auth = await requireAccountApiContext()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return accountJson({ error: 'Invalid API key identifier.' }, { status: 400 })
  }

  const { data, error } = await auth.context.admin
    .from('agent_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', auth.context.userId)
    .is('revoked_at', null)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Could not revoke Agent API key:', error)
    return accountJson({ error: 'Could not revoke this API key.' }, { status: 500 })
  }
  if (!data) return accountJson({ error: 'API key not found or already revoked.' }, { status: 404 })

  return accountJson({ revoked: true, id })
}
