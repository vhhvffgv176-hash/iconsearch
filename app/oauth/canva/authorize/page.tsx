import type { Metadata } from 'next'
import { getCanvaOauthConfig, parseAuthorizationRequest } from '@/lib/canva-oauth'
import CanvaAuthorizeClient from './CanvaAuthorizeClient'

export const metadata: Metadata = {
  title: 'Connect IconSearch to Canva',
  description: 'Authorize Canva to access your IconSearch account.',
  robots: { index: false, follow: false },
}

type AuthorizePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AuthorizePage({ searchParams }: AuthorizePageProps) {
  const values = await searchParams
  const params = new URLSearchParams()
  Object.entries(values).forEach(([name, value]) => {
    if (typeof value === 'string') params.set(name, value)
  })

  const config = getCanvaOauthConfig()
  const request = config ? parseAuthorizationRequest(params, config) : null

  if (!config) {
    return <AuthorizeError message="IconSearch OAuth is not configured on this server." />
  }

  if (!request) {
    return <AuthorizeError message="This authorization request is invalid or has expired." />
  }

  return <CanvaAuthorizeClient requestQuery={params.toString()} />
}

function AuthorizeError({ message }: { message: string }) {
  return (
    <main className="connect-page">
      <section className="connect-card" style={{ maxWidth: 620 }}>
        <div className="connect-card-main">
          <div className="connect-kicker">CANVA CONNECTION</div>
          <h1>Could not connect IconSearch</h1>
          <p className="connect-lede">{message}</p>
          <p className="connect-disclosure">Close this window and start the connection again from Canva.</p>
        </div>
      </section>
    </main>
  )
}
