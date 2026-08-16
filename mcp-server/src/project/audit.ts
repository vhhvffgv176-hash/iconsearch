import { createReadStream } from 'node:fs'
import { lstat, readdir, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { extname, join, relative, sep } from 'node:path'
import { createInterface } from 'node:readline'
import { ICON_DIRECTORY, readProjectManifest } from './manifest.js'
import { assertNoSymlinkPath, assertWithinProject } from './root.js'

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.turbo',
  '.vercel',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'public/build',
  'vendor',
])

const SOURCE_EXTENSIONS = new Set([
  '.astro', '.css', '.html', '.js', '.jsx', '.md', '.mdx', '.scss', '.svelte', '.ts', '.tsx', '.vue',
])
const MAX_FILES = 20_000
const MAX_SOURCE_BYTES = 2 * 1024 * 1024
const MAX_FINDINGS = 300

const ICON_PACKAGES = [
  'lucide-react',
  '@heroicons/react',
  '@tabler/icons-react',
  '@phosphor-icons/react',
  '@radix-ui/react-icons',
  'react-icons',
  'react-feather',
  'iconoir-react',
  '@untitledui/icons',
  'bootstrap-icons',
  '@fortawesome',
  '@iconify/react',
]

export type AuditFinding = {
  severity: 'error' | 'warning' | 'info'
  code: string
  message: string
  file?: string
  line?: number
}

export async function auditProjectIcons(root: string) {
  const manifestResult = await readProjectManifest(root)
  const findings: AuditFinding[] = []
  const packages = new Set<string>()
  const referencedSvgs = new Set<string>()
  let scannedFiles = 0
  let sourceFiles = 0
  let svgFiles = 0
  let inlineSvgCount = 0

  if (!manifestResult.exists) {
    pushFinding(findings, {
      severity: 'warning',
      code: 'missing-manifest',
      message: 'No iconsearch.json project memory exists yet.',
    })
  }

  for (const [semanticName, icon] of Object.entries(manifestResult.manifest.icons)) {
    const fullPath = assertWithinProject(root, join(root, ...icon.path.split('/')))
    await assertNoSymlinkPath(root, fullPath)
    const info = await lstat(fullPath).catch(() => undefined)
    if (!info?.isFile()) {
      pushFinding(findings, {
        severity: 'error',
        code: 'missing-managed-icon',
        message: `Managed icon "${semanticName}" is missing from disk.`,
        file: icon.path,
      })
      continue
    }

    const checksum = await hashFile(fullPath)
    if (checksum !== icon.checksum) {
      pushFinding(findings, {
        severity: 'error',
        code: 'managed-icon-drift',
        message: `Managed icon "${semanticName}" no longer matches its recorded checksum.`,
        file: icon.path,
      })
    }
  }

  const queue = [root]
  while (queue.length) {
    const directory = queue.pop()
    if (!directory) break
    const entries = await readdir(directory, { withFileTypes: true })

    for (const entry of entries) {
      if (scannedFiles >= MAX_FILES) break
      const fullPath = assertWithinProject(root, join(directory, entry.name))
      const projectPath = toProjectPath(root, fullPath)

      if (entry.isSymbolicLink()) {
        pushFinding(findings, {
          severity: 'info',
          code: 'skipped-symlink',
          message: 'Skipped symbolic link during repository audit.',
          file: projectPath,
        })
        continue
      }

      if (entry.isDirectory()) {
        if (shouldIgnoreDirectory(projectPath)) continue
        queue.push(fullPath)
        continue
      }
      if (!entry.isFile()) continue

      scannedFiles += 1
      const extension = extname(entry.name).toLowerCase()
      if (extension === '.svg') {
        svgFiles += 1
        if (!projectPath.startsWith(`${ICON_DIRECTORY}/`)) {
          pushFinding(findings, {
            severity: 'warning',
            code: 'unmanaged-svg',
            message: 'SVG is outside the managed .iconsearch/icons directory.',
            file: projectPath,
          })
        }
      }

      if (!SOURCE_EXTENSIONS.has(extension)) continue
      const info = await lstat(fullPath)
      if (info.size > MAX_SOURCE_BYTES) {
        pushFinding(findings, {
          severity: 'info',
          code: 'skipped-large-file',
          message: 'Skipped source file larger than 2 MB.',
          file: projectPath,
        })
        continue
      }

      sourceFiles += 1
      const content = await readFile(fullPath, 'utf8')
      for (const packageName of ICON_PACKAGES) {
        if (content.includes(`'${packageName}`) || content.includes(`"${packageName}`)) packages.add(packageName)
      }

      const inlineMatches = content.match(/<svg\b/gi)
      if (inlineMatches?.length) {
        inlineSvgCount += inlineMatches.length
        pushFinding(findings, {
          severity: 'warning',
          code: 'inline-svg',
          message: `Found ${inlineMatches.length} inline SVG${inlineMatches.length === 1 ? '' : 's'}.`,
          file: projectPath,
          line: lineNumberAt(content, content.search(/<svg\b/i)),
        })
      }

      for (const match of content.matchAll(/["'`](\.?\.?\/[a-zA-Z0-9_./-]+\.svg(?:\?[^"'`]*)?)["'`]/g)) {
        referencedSvgs.add(match[1].split('?')[0])
      }
    }
  }

  if (packages.size > 1) {
    pushFinding(findings, {
      severity: 'warning',
      code: 'mixed-icon-packages',
      message: `Multiple icon packages are used: ${Array.from(packages).sort().join(', ')}.`,
    })
  }

  if (Object.keys(manifestResult.manifest.icons).length === 0) {
    pushFinding(findings, {
      severity: 'info',
      code: 'empty-project-memory',
      message: 'The project manifest has no approved semantic icon assignments.',
    })
  }

  const counts = findings.reduce(
    (summary, finding) => ({ ...summary, [finding.severity]: summary[finding.severity] + 1 }),
    { error: 0, warning: 0, info: 0 },
  )

  return {
    root,
    healthy: counts.error === 0,
    truncated: findings.length >= MAX_FINDINGS || scannedFiles >= MAX_FILES,
    summary: {
      ...counts,
      scannedFiles,
      sourceFiles,
      svgFiles,
      inlineSvgCount,
      managedIcons: Object.keys(manifestResult.manifest.icons).length,
      referencedSvgPaths: referencedSvgs.size,
      iconPackages: Array.from(packages).sort(),
    },
    findings,
  }
}

function shouldIgnoreDirectory(projectPath: string) {
  const normalized = projectPath.split(sep).join('/')
  return normalized.split('/').some((segment) => IGNORED_DIRECTORIES.has(segment)) || IGNORED_DIRECTORIES.has(normalized)
}

function pushFinding(findings: AuditFinding[], finding: AuditFinding) {
  if (findings.length < MAX_FINDINGS) findings.push(finding)
}

function toProjectPath(root: string, fullPath: string) {
  return relative(root, fullPath).split(sep).join('/')
}

function lineNumberAt(content: string, index: number) {
  return index >= 0 ? content.slice(0, index).split('\n').length : undefined
}

async function hashFile(path: string) {
  const hash = createHash('sha256')
  const stream = createReadStream(path)
  const reader = createInterface({ input: stream, crlfDelay: Infinity })
  let first = true
  for await (const line of reader) {
    if (!first) hash.update('\n')
    hash.update(line)
    first = false
  }
  if (!first) hash.update('\n')
  return `sha256:${hash.digest('hex')}`
}
