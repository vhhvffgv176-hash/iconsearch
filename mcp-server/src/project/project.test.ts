import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import type { IconSearchIcon } from '../api-client.js'
import { auditProjectIcons } from './audit.js'
import { readProjectManifest } from './manifest.js'
import { resolveProjectRoot, validateSemanticName } from './root.js'
import { saveProjectIcon } from './store.js'
import { sanitizeProjectSvg } from './svg.js'

const TEST_SVG = '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>'
const SANITIZED_TEST_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>\n'

test('creates project memory and detects managed SVG drift', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'iconsearch-project-'))
  t.after(async () => rm(root, { recursive: true, force: true }))

  const resolved = await resolveProjectRoot(root)
  const icon: IconSearchIcon & { svg: string } = {
    id: 'lucide-square',
    name: 'square',
    displayName: 'Square',
    library: 'lucide',
    libraryName: 'Lucide',
    license: 'ISC',
    legalSafe: true,
    svgUrl: 'https://iconsearch.info/api/svg/lucide/square',
    previewUrls: [],
    tags: ['shape'],
    svg: TEST_SVG,
  }

  const saved = await saveProjectIcon({
    root: resolved,
    semanticName: 'empty-state',
    icon,
    overwrite: false,
  })
  assert.match(saved.checksum, /^sha256:[a-f0-9]{64}$/)

  const manifest = await readProjectManifest(resolved)
  assert.equal(manifest.exists, true)
  assert.equal(manifest.manifest.icons['empty-state'].name, 'square')
  assert.deepEqual(manifest.manifest.style.preferredLibraries, ['lucide'])

  const savedSvg = await readFile(join(root, '.iconsearch', 'icons', 'empty-state.svg'), 'utf8')
  assert.equal(savedSvg, SANITIZED_TEST_SVG)

  const cleanAudit = await auditProjectIcons(resolved)
  assert.equal(cleanAudit.summary.error, 0)

  await writeFile(join(root, '.iconsearch', 'icons', 'empty-state.svg'), '<svg></svg>\n', 'utf8')
  const driftAudit = await auditProjectIcons(resolved)
  assert.ok(driftAudit.findings.some((finding) => finding.code === 'managed-icon-drift'))
})

test('audit detects inline SVG and mixed packages without following symlinks', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'iconsearch-audit-'))
  t.after(async () => rm(root, { recursive: true, force: true }))

  await writeFile(
    join(root, 'component.tsx'),
    "import { Search } from 'lucide-react'\nimport { IconHome } from '@tabler/icons-react'\nexport const X = () => <svg />\n",
    'utf8',
  )

  const audit = await auditProjectIcons(await resolveProjectRoot(root))
  assert.ok(audit.findings.some((finding) => finding.code === 'inline-svg'))
  assert.ok(audit.findings.some((finding) => finding.code === 'mixed-icon-packages'))
  assert.deepEqual(audit.summary.iconPackages, ['@tabler/icons-react', 'lucide-react'])
})

test('rejects unsafe semantic names and active SVG content', () => {
  assert.throws(() => validateSemanticName('../escape'), /kebab-case/)
  assert.throws(() => sanitizeProjectSvg('<svg><script>alert(1)</script></svg>'), /unsupported/)
  assert.throws(() => sanitizeProjectSvg('<svg><image href="https://example.com/x.png"/></svg>'), /unsupported/)
  assert.equal(sanitizeProjectSvg(TEST_SVG), SANITIZED_TEST_SVG)
})

test('rolls back a newly written SVG when the manifest cannot be validated', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'iconsearch-rollback-'))
  t.after(async () => rm(root, { recursive: true, force: true }))

  const icon: IconSearchIcon & { svg: string } = {
    id: 'unsafe-square',
    name: 'square',
    displayName: 'Square',
    library: 'unsafe/library',
    libraryName: 'Unsafe test library',
    legalSafe: true,
    svgUrl: 'https://iconsearch.info/api/svg/unsafe/square',
    previewUrls: [],
    tags: [],
    svg: TEST_SVG,
  }

  await assert.rejects(
    saveProjectIcon({ root: await resolveProjectRoot(root), semanticName: 'rollback-test', icon, overwrite: false }),
  )
  await assert.rejects(readFile(join(root, '.iconsearch', 'icons', 'rollback-test.svg'), 'utf8'), /ENOENT/)
})
