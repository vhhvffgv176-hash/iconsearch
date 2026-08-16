'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Clipboard, KeyRound, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import styles from './api-keys.module.css'

type ApiKeySummary = {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string
  revokedAt: string | null
  status: 'active' | 'expired' | 'revoked'
}

const installCommand = (secret: string) =>
  `codex mcp add iconsearch --env ICONSEARCH_TOKEN=${secret} -- npx -y @iconsearch/mcp-server`

export default function ApiKeyPanel() {
  const [keys, setKeys] = useState<ApiKeySummary[]>([])
  const [name, setName] = useState('My coding agent')
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [copied, setCopied] = useState<'key' | 'command' | null>(null)
  const [error, setError] = useState('')

  const activeKeys = useMemo(() => keys.filter((key) => key.status === 'active'), [keys])

  useEffect(() => {
    let cancelled = false
    const loadKeys = async () => {
      try {
        const response = await fetch('/api/account/api-keys', {
          credentials: 'same-origin',
          headers: { accept: 'application/json' },
          cache: 'no-store',
        })
        const payload = await readPayload(response)
        if (!response.ok) throw new Error(errorFromPayload(payload, 'Could not load API keys.'))
        if (!cancelled) setKeys(Array.isArray(payload.keys) ? payload.keys as ApiKeySummary[] : [])
      } catch (loadError) {
        if (!cancelled) setError(messageFrom(loadError))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadKeys()
    return () => { cancelled = true }
  }, [])

  const createKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreating(true)
    setError('')
    setSecret('')
    try {
      const response = await fetch('/api/account/api-keys', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ name }),
      })
      const payload = await readPayload(response)
      if (!response.ok) throw new Error(errorFromPayload(payload, 'Could not generate the API key.'))
      if (typeof payload.secret !== 'string' || !payload.secret.startsWith('ics_live_')) {
        throw new Error('IconSearch returned an invalid API key.')
      }
      setSecret(payload.secret)
      if (payload.key && typeof payload.key === 'object') {
        setKeys((current) => [payload.key as ApiKeySummary, ...current])
      }
      setName('My coding agent')
    } catch (createError) {
      setError(messageFrom(createError))
    } finally {
      setCreating(false)
    }
  }

  const revokeKey = async (key: ApiKeySummary) => {
    if (!window.confirm(`Revoke “${key.name}”? Any agent using it will stop working immediately.`)) return
    setRevokingId(key.id)
    setError('')
    try {
      const response = await fetch(`/api/account/api-keys/${encodeURIComponent(key.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { accept: 'application/json' },
      })
      const payload = await readPayload(response)
      if (!response.ok) throw new Error(errorFromPayload(payload, 'Could not revoke the API key.'))
      setKeys((current) => current.map((item) => (
        item.id === key.id ? { ...item, revokedAt: new Date().toISOString(), status: 'revoked' } : item
      )))
    } catch (revokeError) {
      setError(messageFrom(revokeError))
    } finally {
      setRevokingId(null)
    }
  }

  const copy = async (value: string, kind: 'key' | 'command') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 2_000)
    } catch {
      setError('Your browser blocked copying. Select the text and copy it manually.')
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="api-key-title">
      <div className={styles.heading}>
        <span className={styles.icon}><KeyRound size={22} /></span>
        <div>
          <span className={styles.kicker}>CODING AGENT ACCESS</span>
          <h2 id="api-key-title">Generate an API key</h2>
          <p>Create a private key that lets your coding agent search and retrieve icons from your account.</p>
        </div>
      </div>

      <form className={styles.form} onSubmit={createKey}>
        <label htmlFor="api-key-name">Give this key a name</label>
        <div className={styles.formRow}>
          <input
            id="api-key-name"
            maxLength={60}
            minLength={2}
            onChange={(event) => setName(event.target.value)}
            placeholder="For example: My laptop"
            required
            type="text"
            value={name}
          />
          <button disabled={creating || activeKeys.length >= 5} type="submit">
            <Plus size={17} /> {creating ? 'Generating…' : 'Generate API key'}
          </button>
        </div>
        <small>You can keep up to five active keys. Each key expires automatically after 90 days.</small>
      </form>

      {secret ? (
        <div className={styles.secretBox} role="status">
          <div className={styles.secretWarning}>
            <ShieldCheck size={19} />
            <div><strong>Copy this key now</strong><span>For your safety, IconSearch will never show the complete key again.</span></div>
          </div>
          <div className={styles.copyRow}>
            <code>{secret}</code>
            <button aria-label="Copy API key" onClick={() => void copy(secret, 'key')} type="button">
              {copied === 'key' ? <Check size={17} /> : <Clipboard size={17} />}
              {copied === 'key' ? 'Copied' : 'Copy key'}
            </button>
          </div>
          <p>To connect Codex, copy and run this command in a terminal:</p>
          <div className={styles.copyRow}>
            <code>{installCommand(secret)}</code>
            <button aria-label="Copy Codex setup command" onClick={() => void copy(installCommand(secret), 'command')} type="button">
              {copied === 'command' ? <Check size={17} /> : <Clipboard size={17} />}
              {copied === 'command' ? 'Copied' : 'Copy command'}
            </button>
          </div>
          <p className={styles.securityNote}>Never paste this key into website code, GitHub, screenshots, or messages.</p>
        </div>
      ) : null}

      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <div className={styles.keyList}>
        <div className={styles.listHeading}>
          <h3>Your API keys</h3>
          <span>{activeKeys.length} of 5 active</span>
        </div>
        {loading ? <p className={styles.empty}>Loading keys…</p> : keys.length === 0 ? (
          <p className={styles.empty}>You have not generated an API key yet.</p>
        ) : keys.map((key) => {
          const inactive = key.status !== 'active'
          return (
            <div className={styles.keyItem} key={key.id}>
              <div>
                <strong>{key.name}</strong>
                <code>{key.prefix}••••••••••••••••</code>
                <small>
                  Created {formatDate(key.createdAt)} · {key.lastUsedAt ? `Last used ${formatDate(key.lastUsedAt)}` : 'Never used'} · Expires {formatDate(key.expiresAt)}
                </small>
              </div>
              {inactive ? (
                <span className={styles.inactive}>{key.status === 'revoked' ? 'Revoked' : 'Expired'}</span>
              ) : (
                <button
                  className={styles.revoke}
                  disabled={revokingId === key.id}
                  onClick={() => void revokeKey(key)}
                  type="button"
                >
                  <Trash2 size={15} /> {revokingId === key.id ? 'Revoking…' : 'Revoke'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

async function readPayload(response: Response): Promise<Record<string, unknown>> {
  const payload = await response.json().catch(() => ({}))
  return payload && typeof payload === 'object' && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : {}
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function errorFromPayload(payload: Record<string, unknown>, fallback: string) {
  return typeof payload.error === 'string' && payload.error ? payload.error : fallback
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
    : 'unknown date'
}
