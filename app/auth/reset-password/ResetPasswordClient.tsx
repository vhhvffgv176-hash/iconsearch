'use client'

import { useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase'

export default function ResetPasswordClient({ next }: { next: string }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }
    if (!isSupabaseConfigured()) {
      setError('Account services are not configured.')
      return
    }

    const supabase = await createClient()
    if (!supabase) {
      setError('Account services are not configured.')
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }

    window.location.assign(next)
  }

  return (
    <main className="connect-page">
      <div className="connect-bg-grid" aria-hidden="true" />
      <section className="connect-card" style={{ maxWidth: 620 }} aria-labelledby="reset-title">
        <div className="connect-card-main">
          <div className="connect-kicker">ACCOUNT RECOVERY</div>
          <h1 id="reset-title">Choose a new password</h1>
          <p className="connect-lede">Set a new password, then continue where you left off.</p>

          {error ? (
            <div className="connect-status-card">
              <strong>Password not changed</strong>
              <span>{error}</span>
            </div>
          ) : null}

          <form className="connect-action-stack" onSubmit={submit}>
            <label>
              New password
              <input
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>
            <button className="connect-primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save new password'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
