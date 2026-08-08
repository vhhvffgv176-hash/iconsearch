import { publicJson, publicOptions } from '@/lib/device-auth'
import { readExtensionSession } from '@/lib/extension-session'
import { GET as searchIcons } from '@/app/api/icon-search/route'

export const runtime = 'nodejs'

export function OPTIONS() {
  return publicOptions()
}

export async function GET(request: Request) {
  const session = await readExtensionSession(request)
  if (!session) {
    return publicJson({ error: 'A valid IconSearch extension session is required.' }, { status: 401 })
  }

  const requestedProduct = request.headers.get('x-iconsearch-product')
  if (requestedProduct !== session.session.product) {
    return publicJson({ error: 'This session is not valid for the requested product.' }, { status: 403 })
  }
  if (session.scopes && !session.scopes.includes('icons:read')) {
    return publicJson({ error: 'This OAuth grant does not include icon search access.' }, { status: 403 })
  }

  return searchIcons(request)
}
