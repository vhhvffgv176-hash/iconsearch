import type { Metadata } from 'next'
import AccountClient from './AccountClient'

export const metadata: Metadata = {
  title: 'Your IconSearch Account',
  description: 'Manage your IconSearch account, create or revoke AI coding agent API keys, and configure integrations for Figma, Canva, Penpot, and CLI tools.',
  robots: { index: false, follow: false },
}

export default function AccountPage() {
  return <AccountClient />
}
