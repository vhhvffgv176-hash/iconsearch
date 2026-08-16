import { lstat, mkdir, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { IconSearchIcon } from '../api-client.js'
import {
  atomicWriteFile,
  ICON_DIRECTORY,
  readProjectManifest,
  writeProjectManifest,
} from './manifest.js'
import { assertNoSymlinkPath, assertWithinProject, validateSemanticName } from './root.js'
import { checksumSvg, sanitizeProjectSvg } from './svg.js'

export async function saveProjectIcon({
  root,
  semanticName,
  icon,
  overwrite,
}: {
  root: string
  semanticName: string
  icon: IconSearchIcon & { svg: string }
  overwrite: boolean
}) {
  const key = validateSemanticName(semanticName)
  const { manifest } = await readProjectManifest(root)
  if (!overwrite && manifest.icons[key]) throw new Error(`The semantic icon "${key}" already exists.`)

  const directory = assertWithinProject(root, join(root, ICON_DIRECTORY))
  const destination = assertWithinProject(root, join(directory, `${key}.svg`))
  await assertNoSymlinkPath(root, directory)
  await mkdir(directory, { recursive: true })
  await assertNoSymlinkPath(root, destination)

  const existing = await lstat(destination).catch(() => undefined)
  if (existing?.isSymbolicLink()) throw new Error('IconSearch refuses to overwrite a symbolic link.')
  if (existing && !existing.isFile()) throw new Error('The managed icon destination is not a regular file.')
  if (existing && !overwrite) throw new Error(`The icon file for "${key}" already exists.`)

  const svg = sanitizeProjectSvg(icon.svg)
  const checksum = checksumSvg(svg)
  const previousSvg = existing ? await readFile(destination, 'utf8') : undefined
  await atomicWriteFile(destination, svg)

  manifest.icons[key] = {
    library: icon.library,
    name: icon.name,
    path: `${ICON_DIRECTORY}/${key}.svg`,
    displayName: icon.displayName,
    license: icon.license,
    licenseUrl: icon.licenseUrl,
    sourceUrl: icon.sourceUrl,
    authorName: icon.authorName,
    checksum,
    savedAt: new Date().toISOString(),
  }

  if (!manifest.style.preferredLibraries.includes(icon.library)) {
    manifest.style.preferredLibraries = [...manifest.style.preferredLibraries, icon.library].slice(0, 20)
  }

  try {
    await writeProjectManifest(root, manifest)
  } catch (error) {
    try {
      if (previousSvg === undefined) await rm(destination, { force: true })
      else await atomicWriteFile(destination, previousSvg)
    } catch (rollbackError) {
      throw new AggregateError([error, rollbackError], 'Could not update project memory or restore the previous icon file.')
    }
    throw error
  }
  return { key, path: destination, checksum, manifest }
}
