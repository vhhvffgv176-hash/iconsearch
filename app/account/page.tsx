import type { Metadata } from 'next'
import AccountClient from './AccountClient'

export const metadata: Metadata = {
  title: 'Your IconSearch Account',
  description: 'Generate and revoke IconSearch Agent API keys, and manage product access.',
  robots: { index: false, follow: false },
}

export default function AccountPage() {
  return <AccountClient />
}
