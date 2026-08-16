import { randomBytes } from 'node:crypto'
import { mkdir, open, readFile, rename, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import { assertNoSymlinkPath, assertWithinProject, validateSemanticName } from './root.js'

export const MANIFEST_FILENAME = 'iconsearch.json'
export const ICON_DIRECTORY = '.iconsearch/icons'
const MAX_MANIFEST_BYTES = 1024 * 1024
const MAX_MANIFEST_ICONS = 5_000

const safeSegmentSchema = z.string().trim().min(1).max(120).regex(/^[a-z0-9][a-z0-9._-]*$/i)
const safeUrlSchema = z.string().url().max(2_048)

const manifestIconSchema = z.object({
  library: safeSegmentSchema,
  name: safeSegmentSchema,
  path: z.string().regex(/^\.iconsearch\/icons\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/),
  displayName: z.string().max(160).optional(),
  license: z.string().max(120).optional(),
  licenseUrl: safeUrlSchema.optional(),
  sourceUrl: safeUrlSchema.optional(),
  authorName: z.string().max(160).optional(),
  checksum: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  savedAt: z.string().datetime(),
}).strict()

export const projectManifestSchema = z.object({
  version: z.literal(1),
  style: z.object({
    preferredLibraries: z.array(safeSegmentSchema).max(20).default([]),
    defaultSize: z.number().int().min(8).max(512).default(20),
    color: z.string().regex(/^(?:currentColor|#[0-9a-fA-F]{3,8})$/).default('currentColor'),
    strokeWidth: z.number().min(0.5).max(4).default(2),
  }).strict(),
  icons: z.record(z.string(), manifestIconSchema),
}).strict()

export type ProjectManifest = z.infer<typeof projectManifestSchema>
export type ProjectManifestIcon = z.infer<typeof manifestIconSchema>

export function createEmptyManifest(): ProjectManifest {
  return {
    version: 1,
    style: {
      preferredLibraries: [],
      defaultSize: 20,
      color: 'currentColor',
      strokeWidth: 2,
    },
    icons: {},
  }
}

export async function readProjectManifest(root: string) {
  const path = assertWithinProject(root, join(root, MANIFEST_FILENAME))
  await assertNoSymlinkPath(root, path)

  let contents: string
  try {
    contents = await readFile(path, 'utf8')
  } catch (error) {
    if (isMissingFile(error)) return { path, exists: false, manifest: createEmptyManifest() }
    throw error
  }

  if (Buffer.byteLength(contents, 'utf8') > MAX_MANIFEST_BYTES) {
    throw new Error(`${MANIFEST_FILENAME} exceeds the 1 MB safety limit.`)
  }

  let raw: unknown
  try {
    raw = JSON.parse(contents)
  } catch {
    throw new Error(`${MANIFEST_FILENAME} is not valid JSON.`)
  }

  const parsed = projectManifestSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new Error(`${MANIFEST_FILENAME} is invalid at ${issue?.path.join('.') || 'root'}: ${issue?.message || 'invalid value'}`)
  }

  const entries = Object.entries(parsed.data.icons)
  if (entries.length > MAX_MANIFEST_ICONS) throw new Error(`${MANIFEST_FILENAME} contains too many icon assignments.`)
  for (const [semanticName, icon] of entries) {
    validateSemanticName(semanticName)
    const expectedPath = `${ICON_DIRECTORY}/${semanticName}.svg`
    if (icon.path !== expectedPath) throw new Error(`Manifest path for ${semanticName} must be ${expectedPath}.`)
  }

  return { path, exists: true, manifest: parsed.data }
}

export async function writeProjectManifest(root: string, manifest: ProjectManifest) {
  const parsed = projectManifestSchema.parse(manifest)
  if (Object.keys(parsed.icons).length > MAX_MANIFEST_ICONS) throw new Error('The manifest icon limit was exceeded.')

  const destination = assertWithinProject(root, join(root, MANIFEST_FILENAME))
  await assertNoSymlinkPath(root, destination)
  await atomicWriteFile(destination, `${JSON.stringify(parsed, null, 2)}\n`)
  return destination
}

export async function atomicWriteFile(destination: string, contents: string) {
  await mkdir(dirname(destination), { recursive: true })
  const temporary = `${destination}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`
  let handle: Awaited<ReturnType<typeof open>> | undefined

  try {
    handle = await open(temporary, 'wx', 0o600)
    await handle.writeFile(contents, 'utf8')
    await handle.sync()
    await handle.close()
    handle = undefined
    await rename(temporary, destination)
  } catch (error) {
    await handle?.close().catch(() => undefined)
    await rm(temporary, { force: true }).catch(() => undefined)
    throw error
  }
}

function isMissingFile(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
}
