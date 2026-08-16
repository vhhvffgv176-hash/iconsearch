import { lstat, realpath, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, isAbsolute, parse, relative, resolve, sep } from 'node:path'

export async function resolveProjectRoot(requestedRoot?: string) {
  const configured = requestedRoot?.trim() || process.env.ICONSEARCH_PROJECT_ROOT?.trim() || process.cwd()
  if (!configured) throw new Error('A project root is required.')

  const absolute = resolve(configured)
  const info = await stat(absolute).catch(() => undefined)
  if (!info?.isDirectory()) throw new Error('The IconSearch project root must be an existing directory.')

  const root = await realpath(absolute)
  if (root === parse(root).root) throw new Error('The filesystem root cannot be used as an IconSearch project root.')
  if (root === resolve(homedir())) throw new Error('The user home directory is too broad to use as an IconSearch project root.')
  return root
}

export function assertWithinProject(root: string, candidate: string) {
  const absoluteRoot = resolve(root)
  const absoluteCandidate = resolve(candidate)
  const relation = relative(absoluteRoot, absoluteCandidate)
  if (!relation || relation === '.') return absoluteCandidate
  if (relation.startsWith(`..${sep}`) || relation === '..' || isAbsolute(relation)) {
    throw new Error('A requested path escaped the IconSearch project root.')
  }
  return absoluteCandidate
}

export async function assertNoSymlinkPath(root: string, candidate: string) {
  const safeCandidate = assertWithinProject(root, candidate)
  const segments: string[] = []
  let current = safeCandidate

  while (current !== root) {
    segments.push(current)
    const parent = dirname(current)
    if (parent === current) throw new Error('Could not validate the project path.')
    current = parent
  }

  for (const segment of segments.reverse()) {
    const info = await lstat(segment).catch(() => undefined)
    if (info?.isSymbolicLink()) throw new Error('IconSearch refuses to read or write through symbolic links.')
  }
}

export function validateSemanticName(value: string) {
  const name = value.trim().toLowerCase()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 80) {
    throw new Error('Semantic names must be kebab-case and at most 80 characters.')
  }
  return name
}
