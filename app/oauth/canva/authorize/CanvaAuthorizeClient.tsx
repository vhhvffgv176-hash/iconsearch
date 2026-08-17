'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import AuthModal from '@/app/components/AuthModal'
import { createClient, isSupabaseConfigured } from '@/lib/supabase'

type Props = { requestQuery: string }

export default function CanvaAuthorizeClient({ requestQuery }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const returnPath = useMemo(
    () => `/oauth/canva/authorize?${requestQuery}`,
    [requestQuery]
  )

  useEffect(() => {
    let unsubscribe = () => {}
    void (async () => {
      const supabase = await createClient()
      if (!supabase) {
        setChecking(false)
        return
      }

      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setShowAuth(!data.user)
      setChecking(false)
      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null)
      })
      unsubscribe = () => subscription.subscription.unsubscribe()
    })()
    return () => unsubscribe()
  }, [])

  const decide = async (decision: 'approve' | 'deny') => {
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/oauth/canva/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, requestQuery }),
      })
      const payload = await response.json()
      if (!response.ok || typeof payload.redirectUrl !== 'string') {
        throw new Error(payload.error || 'Could not complete authorization.')
      }
      window.location.assign(payload.redirectUrl)
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Could not complete authorization.')
      setSubmitting(false)
    }
  }

  return (
    <main className="connect-page">
      <div className="connect-bg-grid" aria-hidden="true" />
      <section className="connect-card" style={{ maxWidth: 760 }} aria-labelledby="oauth-title">
        <div className="connect-card-main">
          <div className="connect-kicker">CANVA CONNECTION</div>
          <h1 id="oauth-title">Connect IconSearch</h1>
          <p className="connect-lede">
            Canva is requesting permission to search the IconSearch catalog using your account.
          </p>

          {error ? <div className="connect-status-card"><strong>Connection failed</strong><span>{error}</span></div> : null}

          {!isSupabaseConfigured() ? (
            <div className="connect-status-card"><strong>Authentication unavailable</strong><span>IconSearch account services are not configured.</span></div>
          ) : checking ? (
            <div className="connect-status-card"><strong>Checking your account</strong><span>One moment while IconSearch verifies your session.</span></div>
          ) : user ? (
            <div className="connect-action-stack">
              <div className="connect-account-box"><span>Signed in as</span><strong>{user.email}</strong></div>
              <button type="button" className="connect-primary-button" disabled={submitting} onClick={() => void decide('approve')}>
                {submitting ? 'Connecting...' : 'Connect IconSearch to Canva'}
              </button>
              <button type="button" className="connect-secondary-button" disabled={submitting} onClick={() => void decide('deny')}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="connect-action-stack">
              <button type="button" className="connect-primary-button" onClick={() => setShowAuth(true)}>
                Sign in or create an account
              </button>
              <button type="button" className="connect-secondary-button" onClick={() => void decide('deny')}>
                Cancel
              </button>
            </div>
          )}

          <p className="connect-disclosure">
            IconSearch receives access only to the icon catalog and your Canva-specific product entitlement. Canva stores and refreshes the OAuth tokens securely. You can disconnect through &quot;Remove from your apps&quot; in Canva.
          </p>
        </div>
      </section>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={(signedInUser) => {
          setUser(signedInUser)
          setShowAuth(false)
        }}
        redirectTo={returnPath}
      />
    </main>
  )
}
