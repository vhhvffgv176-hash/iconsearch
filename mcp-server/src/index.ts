#!/usr/bin/env node
import { pathToFileURL } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import {
  getApiBase,
  getIcon,
  searchIcons,
  type IconSearchIcon,
  type OutputFormat,
} from './api-client.js'
import { auditProjectIcons } from './project/audit.js'
import { readProjectManifest } from './project/manifest.js'
import { resolveProjectRoot } from './project/root.js'
import { saveProjectIcon } from './project/store.js'
import { getSession, removeSession, saveSession } from './session.js'

const PRODUCT = 'mcp'
const DEFAULT_LIMIT = 12
const MAX_AUTH_RESPONSE_BYTES = 256 * 1024

const outputFormatSchema = z.enum(['react', 'svg', 'vue', 'svelte', 'tailwind', 'url'])
const searchStyleSchema = z.enum(['all', 'stroke', 'solid', 'duotone', 'twotone', 'sharp'])
const safeSegmentSchema = z.string().trim().min(1).max(120).regex(/^[a-z0-9][a-z0-9._:-]*$/i)
const projectRootSchema = z.string().trim().max(2_048).optional()

export function createIconSearchServer() {
  const server = new McpServer(
    { name: 'iconsearch', version: '0.2.0' },
    {
      instructions:
        'Before choosing new icons, call iconsearch_get_project_icons to read the project style and approved semantic assignments. Search by UI intent, retrieve exact metadata, and use iconsearch_save_project_icon only when the user wants a repository change. Saving writes only iconsearch.json and .iconsearch/icons inside the validated project root. Run iconsearch_audit_project_icons before shipping. Search and retrieval require a connected IconSearch account.',
    },
  )

  registerAuthenticationTools(server)
  registerProjectTools(server)
  registerCatalogTools(server)
  return server
}

function registerAuthenticationTools(server: McpServer) {
  server.registerTool(
    'iconsearch_start_sign_in',
    {
      title: 'Start IconSearch Sign-In',
      description: 'Start the revocable IconSearch browser device sign-in flow.',
      inputSchema: {
        clientName: z.string().trim().min(1).max(80).default('MCP client'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ clientName }) => {
      const payload = await postJson(`${getApiBase()}/api/device/start`, { product: PRODUCT, clientName })
      return jsonContent({
        verificationUrl: stringFrom(payload.verificationUriComplete),
        deviceCode: stringFrom(payload.deviceCode),
        expiresIn: numberFrom(payload.expiresIn, 1_800),
        interval: numberFrom(payload.interval, 3),
        nextStep: 'Open verificationUrl, approve access, then call iconsearch_finish_sign_in with deviceCode.',
      })
    },
  )

  server.registerTool(
    'iconsearch_finish_sign_in',
    {
      title: 'Finish IconSearch Sign-In',
      description: 'Check an approved device code once and securely store the local MCP session.',
      inputSchema: { deviceCode: z.string().trim().min(20).max(256) },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ deviceCode }) => {
      const payload = await postJson(`${getApiBase()}/api/device/status`, { deviceCode })
      const status = stringFrom(payload.status)
      if (status !== 'authorized') {
        return jsonContent({ status, message: 'Approval is not complete yet. Try again after approving the browser link.' })
      }

      const token = stringFrom(payload.token)
      if (!token) throw new Error('The approved IconSearch session did not include a token.')
      await saveSession({ token, access: asRecord(payload.access), savedAt: new Date().toISOString() })
      return jsonContent({ status: 'connected', product: PRODUCT, access: asRecord(payload.access) })
    },
  )

  server.registerTool(
    'iconsearch_status',
    {
      title: 'IconSearch Connection Status',
      description: 'Check whether this MCP process has an IconSearch session.',
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const session = await getSession()
      return jsonContent({
        connected: Boolean(session?.token),
        source: process.env.ICONSEARCH_TOKEN ? 'ICONSEARCH_TOKEN' : session?.token ? 'local-session' : 'none',
        access: session?.access || null,
      })
    },
  )

  server.registerTool(
    'iconsearch_sign_out',
    {
      title: 'Sign Out of IconSearch',
      description: 'Remove the locally stored MCP session. Environment-provided tokens are not changed.',
      inputSchema: {},
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      await removeSession()
      return textContent('Removed the local IconSearch MCP session.')
    },
  )
}

function registerProjectTools(server: McpServer) {
  server.registerTool(
    'iconsearch_get_project_icons',
    {
      title: 'Read Project Icon Memory',
      description: 'Read the project icon style and approved semantic assignments from iconsearch.json.',
      inputSchema: { projectRoot: projectRootSchema },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ projectRoot }) => {
      const root = await resolveProjectRoot(projectRoot)
      const result = await readProjectManifest(root)
      return jsonContent({
        root,
        exists: result.exists,
        manifestPath: result.path,
        style: result.manifest.style,
        icons: result.manifest.icons,
        guidance: result.exists
          ? 'Reuse an existing semantic assignment when it matches the requested UI purpose.'
          : 'No project memory exists yet. Search, retrieve, and save the first approved icon to create it.',
      })
    },
  )

  server.registerTool(
    'iconsearch_save_project_icon',
    {
      title: 'Save an Approved Project Icon',
      description: 'Retrieve an exact SVG, save it beneath .iconsearch/icons, and update iconsearch.json.',
      inputSchema: {
        semanticName: z.string().trim().min(1).max(80),
        library: safeSegmentSchema,
        name: safeSegmentSchema,
        projectRoot: projectRootSchema,
        overwrite: z.boolean().default(false),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    },
    async ({ semanticName, library, name, projectRoot, overwrite }) => {
      const root = await resolveProjectRoot(projectRoot)
      const icon = await getIcon(library, name)
      const result = await saveProjectIcon({ root, semanticName, icon, overwrite })
      return jsonContent({
        saved: true,
        semanticName: result.key,
        path: result.path,
        checksum: result.checksum,
        icon: publicIcon(icon),
      })
    },
  )

  server.registerTool(
    'iconsearch_audit_project_icons',
    {
      title: 'Audit Project Icons',
      description: 'Read the repository and report missing managed icons, drift, mixed packages, inline SVGs, and unmanaged assets.',
      inputSchema: { projectRoot: projectRootSchema },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ projectRoot }) => {
      const root = await resolveProjectRoot(projectRoot)
      return jsonContent(await auditProjectIcons(root))
    },
  )
}

function registerCatalogTools(server: McpServer) {
  server.registerTool(
    'iconsearch_search',
    {
      title: 'Search Icons by Intent',
      description: 'Search IconSearch by semantic UI intent, preferred library, style, and licence safety.',
      inputSchema: {
        query: z.string().trim().max(160).default(''),
        library: safeSegmentSchema.or(z.literal('all')).default('all'),
        style: searchStyleSchema.default('all'),
        legalOnly: z.boolean().default(true),
        limit: z.number().int().min(1).max(50).default(DEFAULT_LIMIT),
        page: z.number().int().min(1).max(1_000).default(1),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ query, library, style, legalOnly, limit, page }) => {
      const result = await searchIcons({ query, library, style, legalOnly, limit, page })
      return jsonContent({
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        interpretation: result.query,
        icons: result.icons.map(publicIcon),
      })
    },
  )

  server.registerTool(
    'iconsearch_get_icon',
    {
      title: 'Retrieve Exact Icon',
      description: 'Retrieve exact sanitized SVG markup and complete source and licence metadata.',
      inputSchema: { library: safeSegmentSchema, name: safeSegmentSchema },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ library, name }) => jsonContent({ icon: await getIcon(library, name) }),
  )

  server.registerTool(
    'iconsearch_snippet',
    {
      title: 'Create Icon Snippet (Compatibility)',
      description: 'Compatibility helper that returns React, SVG, Vue, Svelte, Tailwind, or URL output.',
      inputSchema: {
        name: z.string().trim().min(1).max(160),
        library: safeSegmentSchema.or(z.literal('all')).default('all'),
        format: outputFormatSchema.default('react'),
        classes: z.string().trim().max(500).default('w-5 h-5'),
        legalOnly: z.boolean().default(true),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ name, library, format, classes, legalOnly }) => {
      const result = await searchIcons({ query: name, library, style: 'all', legalOnly, limit: 1, page: 1 })
      const match = result.icons[0]
      if (!match) throw new Error(`No IconSearch icon found for "${name}".`)
      const exact = format === 'svg' ? await getIcon(match.library, match.name) : match
      return jsonContent({ icon: publicIcon(match), format, snippet: createSnippet(exact, format, classes) })
    },
  )
}

export async function main() {
  const server = createIconSearchServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`IconSearch MCP server failed: ${safeError(error)}\n`)
    process.exitCode = 1
  })
}

function publicIcon(icon: IconSearchIcon) {
  return {
    id: icon.id,
    name: icon.name,
    displayName: icon.displayName,
    library: icon.library,
    libraryName: icon.libraryName,
    authorName: icon.authorName,
    sourceUrl: icon.sourceUrl,
    license: icon.license,
    licenseUrl: icon.licenseUrl,
    licenseNotice: icon.licenseNotice,
    usageRequirements: icon.usageRequirements,
    legalSafe: icon.legalSafe,
    svgUrl: icon.svgUrl,
    tags: icon.tags.slice(0, 12),
  }
}

function createSnippet(icon: IconSearchIcon, format: OutputFormat, classes: string) {
  if (format === 'url') return icon.svgUrl
  if (format === 'svg') {
    if (!icon.svg) throw new Error('Exact SVG markup is unavailable.')
    return applySvgClass(icon.svg, classes)
  }
  if (format === 'react') return createReactSnippet(icon, classes)
  return createUrlSnippet(icon, format, classes)
}

function createReactSnippet(icon: IconSearchIcon, classes: string) {
  const usage = applyJsxClassName(
    icon.reactUsage || `<img src="${escapeAttribute(icon.svgUrl)}" alt="${escapeAttribute(icon.name)}" />`,
    classes,
  )
  const importText = normalizeReactImport(icon.reactImport)
  return importText ? `${importText}\n\n${usage}` : usage
}

function createUrlSnippet(icon: IconSearchIcon, format: Exclude<OutputFormat, 'react' | 'svg' | 'url'>, classes: string) {
  const safeClasses = escapeAttribute(classes.trim() || 'w-5 h-5')
  const safeName = escapeAttribute(icon.name)
  const safeUrl = escapeAttribute(icon.svgUrl)
  if (format === 'tailwind') {
    return `<span class="inline-block ${safeClasses} bg-current" style="mask: url('${safeUrl}') center / contain no-repeat; -webkit-mask: url('${safeUrl}') center / contain no-repeat;" role="img" aria-label="${safeName}"></span>`
  }
  if (format === 'vue') return `<template>\n  <img src="${safeUrl}" alt="${safeName}" class="${safeClasses}" />\n</template>`
  return `<img src="${safeUrl}" alt="${safeName}" class="${safeClasses}" />`
}

function normalizeReactImport(value: string | undefined) {
  if (!value) return ''
  const trimmed = value.trim().replace(/;$/, '')
  const sideEffectMatch = /^import\s+['"]([^'"]+)['"]$/.exec(trimmed)
  if (sideEffectMatch) return `import '${sideEffectMatch[1]}';`
  const namedMatch = /^import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]$/.exec(trimmed)
  if (!namedMatch) return trimmed
  const importedName = namedMatch[1].split(',')[0]?.trim()
  const moduleSpecifier = namedMatch[2]
  return importedName && moduleSpecifier ? `import { ${importedName} } from '${moduleSpecifier}';` : trimmed
}

function applyJsxClassName(jsx: string, classes: string) {
  const cleanClasses = classes.trim()
  if (!cleanClasses) return jsx
  const escapedClasses = escapeAttribute(cleanClasses)
  if (/\sclassName=/.test(jsx.slice(0, 300))) return jsx.replace(/\sclassName=(["'])(.*?)\1/, ` className=$1$2 ${escapedClasses}$1`)
  if (/\sclass=/.test(jsx.slice(0, 300))) return jsx.replace(/\sclass=(["'])(.*?)\1/, ` className=$1$2 ${escapedClasses}$1`)
  return jsx.replace(/^<([A-Za-z][\w:.]*)(\s|\/?>)/, `<$1 className="${escapedClasses}"$2`)
}

function applySvgClass(svg: string, classes: string) {
  const cleanClasses = classes.trim()
  if (!cleanClasses) return svg
  const escapedClasses = escapeAttribute(cleanClasses)
  if (/\sclass=/.test(svg.slice(0, 300))) return svg.replace(/\sclass=(["'])(.*?)\1/, ` class=$1$2 ${escapedClasses}$1`)
  return svg.replace('<svg', `<svg class="${escapedClasses}"`)
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  })
  const text = await response.text()
  if (Buffer.byteLength(text, 'utf8') > MAX_AUTH_RESPONSE_BYTES) throw new Error('IconSearch returned an unexpectedly large response.')
  let payload: Record<string, unknown> = {}
  try {
    payload = asRecord(JSON.parse(text))
  } catch {
    if (response.ok) throw new Error('IconSearch returned invalid JSON.')
  }
  if (!response.ok) throw new Error(stringFrom(payload.error) || `IconSearch returned ${response.status}.`)
  return payload
}

function jsonContent(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] }
}

function textContent(value: string) {
  return { content: [{ type: 'text' as const, text: value }] }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function stringFrom(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function numberFrom(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function safeError(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function escapeAttribute(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
