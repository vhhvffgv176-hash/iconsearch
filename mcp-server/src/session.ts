import { randomBytes } from 'node:crypto'
import { chmod, lstat, mkdir, open, readFile, rename, rm, unlink } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const MAX_SESSION_BYTES = 64 * 1024

export type StoredSession = {
  token: string
  access?: Record<string, unknown>
  savedAt: string
}

export async function requireToken() {
  const token = process.env.ICONSEARCH_TOKEN || (await getSession())?.token || ''
  if (!token) {
    throw new Error(
      'IconSearch is not connected. Set ICONSEARCH_TOKEN or run iconsearch_start_sign_in and iconsearch_finish_sign_in.',
    )
  }
  return token
}

export async function getSession(): Promise<StoredSession | undefined> {
  if (process.env.ICONSEARCH_TOKEN) {
    return { token: process.env.ICONSEARCH_TOKEN, savedAt: new Date().toISOString() }
  }

  try {
    const sessionPath = getSessionPath()
    const info = await lstat(sessionPath)
    if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_SESSION_BYTES) return undefined
    const text = await readFile(sessionPath, 'utf8')
    const value = JSON.parse(text) as Partial<StoredSession>
    return isStoredSession(value) ? value : undefined
  } catch {
    return undefined
  }
}

export async function saveSession(session: StoredSession) {
  if (!isStoredSession(session)) throw new Error('IconSearch refused to store an invalid session.')
  const contents = `${JSON.stringify(session, null, 2)}\n`
  if (Buffer.byteLength(contents, 'utf8') > MAX_SESSION_BYTES) throw new Error('The IconSearch session is unexpectedly large.')

  const sessionPath = getSessionPath()
  const directory = dirname(sessionPath)
  await mkdir(directory, { recursive: true, mode: 0o700 })
  if (process.platform !== 'win32') await chmod(directory, 0o700)

  const existing = await lstat(sessionPath).catch(() => undefined)
  if (existing?.isSymbolicLink() || (existing && !existing.isFile())) {
    throw new Error('IconSearch refuses to overwrite a non-regular session file.')
  }

  const temporary = join(directory, `.mcp-session.${process.pid}.${randomBytes(8).toString('hex')}.tmp`)
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    handle = await open(temporary, 'wx', 0o600)
    await handle.writeFile(contents, 'utf8')
    await handle.sync()
    await handle.close()
    handle = undefined
    await rename(temporary, sessionPath)
    if (process.platform !== 'win32') await chmod(sessionPath, 0o600)
  } catch (error) {
    await handle?.close().catch(() => undefined)
    await rm(temporary, { force: true }).catch(() => undefined)
    throw error
  }
}

export async function removeSession() {
  try {
    await unlink(getSessionPath())
  } catch (error) {
    if (!isMissingFile(error)) throw error
  }
}

export function getSessionPath() {
  return resolve(process.env.ICONSEARCH_SESSION_FILE || join(homedir(), '.iconsearch', 'mcp-session.json'))
}

function isStoredSession(value: Partial<StoredSession>): value is StoredSession {
  return (
    typeof value.token === 'string' &&
    value.token.length >= 20 &&
    value.token.length <= 4_096 &&
    typeof value.savedAt === 'string' &&
    Number.isFinite(Date.parse(value.savedAt))
  )
}

function isMissingFile(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
}
