import type { Metadata } from 'next'
import ResetPasswordClient from './ResetPasswordClient'

export const metadata: Metadata = {
  title: 'Reset your IconSearch password',
  robots: { index: false, follow: false },
}

type ResetPasswordPageProps = {
  searchParams: Promise<{ next?: string | string[] }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams
  const requestedNext = typeof params.next === 'string' ? params.next : '/account'
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//')
    ? requestedNext
    : '/account'

  return <ResetPasswordClient next={next} />
}
