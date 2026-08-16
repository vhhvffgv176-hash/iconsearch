import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { getSession, removeSession, saveSession } from './session.js'

test('stores, reads, and removes a bounded local session', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'iconsearch-session-'))
  const sessionPath = join(root, 'nested', 'mcp-session.json')
  const previousPath = process.env.ICONSEARCH_SESSION_FILE
  const previousToken = process.env.ICONSEARCH_TOKEN
  process.env.ICONSEARCH_SESSION_FILE = sessionPath
  delete process.env.ICONSEARCH_TOKEN
  t.after(async () => {
    if (previousPath === undefined) delete process.env.ICONSEARCH_SESSION_FILE
    else process.env.ICONSEARCH_SESSION_FILE = previousPath
    if (previousToken === undefined) delete process.env.ICONSEARCH_TOKEN
    else process.env.ICONSEARCH_TOKEN = previousToken
    await rm(root, { recursive: true, force: true })
  })

  const session = {
    token: 'test-token-with-at-least-twenty-characters',
    access: { tier: 'free' },
    savedAt: new Date().toISOString(),
  }
  await saveSession(session)
  assert.deepEqual(await getSession(), session)
  assert.ok((await readFile(sessionPath, 'utf8')).endsWith('\n'))

  const refreshedSession = { ...session, token: 'replacement-token-with-at-least-twenty-characters' }
  await saveSession(refreshedSession)
  assert.deepEqual(await getSession(), refreshedSession)

  await removeSession()
  assert.equal(await getSession(), undefined)
  await removeSession()
})

test('refuses malformed session data', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'iconsearch-session-invalid-'))
  const previousPath = process.env.ICONSEARCH_SESSION_FILE
  process.env.ICONSEARCH_SESSION_FILE = join(root, 'mcp-session.json')
  t.after(async () => {
    if (previousPath === undefined) delete process.env.ICONSEARCH_SESSION_FILE
    else process.env.ICONSEARCH_SESSION_FILE = previousPath
    await rm(root, { recursive: true, force: true })
  })

  await assert.rejects(
    saveSession({ token: 'short', savedAt: 'not-a-date' }),
    /invalid session/,
  )
})
