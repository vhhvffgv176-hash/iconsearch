'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import styles from './agents.module.css'

export default function CopyInstallCommand({ command }: { command: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  async function copyCommand() {
    try {
      const copied = await copyText(command)
      if (!copied) throw new Error('Clipboard access is unavailable.')
      setState('copied')
      window.clearTimeout(resetTimer.current)
      resetTimer.current = window.setTimeout(() => setState('idle'), 4_000)
    } catch {
      setState('error')
    }
  }

  return (
    <div className={styles.copyWrap}>
      <button type="button" className={styles.copyButton} onClick={copyCommand}>
        {state === 'copied' ? <Check size={16} /> : <Copy size={16} />}
        {state === 'copied' ? 'Copied' : 'Copy install command'}
      </button>
      <span className={styles.copyStatus} role="status" aria-live="polite">
        {state === 'error' ? 'Clipboard access failed. Select and copy the command manually.' : ''}
      </span>
    </div>
  )
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await Promise.race([
        navigator.clipboard.writeText(value),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('Clipboard timed out.')), 1_000)),
      ])
      return true
    } catch {
      // Fall through to the selection-based copy path used by restricted webviews.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.readOnly = true
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } finally {
    textarea.remove()
  }
}
