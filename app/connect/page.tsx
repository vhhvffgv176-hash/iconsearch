import type { Metadata } from 'next'
import ConnectClient from './ConnectClient'

export const metadata: Metadata = {
  title: 'Connect IconSearch',
  description: 'Securely pair your IconSearch account with design plugins, browser extensions, and developer CLI tools to access and sync your favorite SVG icons.',
  robots: { index: false, follow: false },
}

type ConnectPageProps = {
  searchParams: Promise<{
    product?: string | string[]
    code?: string | string[]
    authError?: string | string[]
  }>
}

export default async function ConnectPage({ searchParams }: ConnectPageProps) {
  const params = await searchParams
  return (
    <ConnectClient
      product={typeof params.product === 'string' ? params.product : ''}
      code={typeof params.code === 'string' ? params.code : ''}
      authError={typeof params.authError === 'string' ? params.authError : ''}
    />
  )
}
