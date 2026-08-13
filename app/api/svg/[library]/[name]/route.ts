import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { NextResponse } from 'next/server'
import { publicOptions, publicJson } from '@/lib/device-auth'

export const runtime = 'nodejs'

const SVG_HEADERS = {
  'Content-Type': 'image/svg+xml; charset=utf-8',
  'Cache-Control': 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-iconsearch-product',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

// Keep the runtime cache outside the project tree so output tracing cannot
// accidentally bundle the entire repository into this server function.
const CACHE_DIR = path.join(tmpdir(), 'iconsearch', 'svgs')

function isSafeSegment(value: string) {
  return /^[a-z0-9][a-z0-9._-]*$/i.test(value)
}

function normalizeName(name: string) {
  return name.replace(/\.svg$/i, '').replace(/_/g, '-').trim()
}

function sanitizeSvg(svg: string): string {
  if (!/^<svg\b/i.test(svg.trim())) return ''

  let clean = svg
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<!doctype[\s\S]*?>/gi, '')
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<foreignObject\b[\s\S]*?<\/foreignObject\s*>/gi, '')
    .replace(/<link\b[\s\S]*?>/gi, '')
    .replace(/\s(on[a-z]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(?:href|xlink:href)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, '')
    .trim()

  if (!/\sxmlns=/.test(clean)) {
    clean = clean.replace(/^<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"')
  }

  return clean
}

function customizeSvg(svg: string, request: Request) {
  const { searchParams } = new URL(request.url)
  const requestedSize = Number.parseInt(searchParams.get('width') || '', 10)
  const size = Number.isFinite(requestedSize) ? Math.min(512, Math.max(8, requestedSize)) : null
  const requestedColor = searchParams.get('color') || ''
  const color = /^#[0-9a-f]{6}$/i.test(requestedColor) ? requestedColor.toUpperCase() : ''

  let customized = svg
  if (size) {
    customized = setSvgRootAttribute(customized, 'width', String(size))
    customized = setSvgRootAttribute(customized, 'height', String(size))
  }
  if (color) {
    customized = setSvgRootAttribute(customized, 'color', color).replace(/currentColor/gi, color)
  }
  return customized
}

function setSvgRootAttribute(svg: string, name: string, value: string) {
  const attributePattern = new RegExp(`\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`, 'i')
  const attribute = ` ${name}="${value}"`
  return svg.replace(/<svg\b[^>]*>/i, (openingTag) =>
    attributePattern.test(openingTag)
      ? openingTag.replace(attributePattern, attribute)
      : openingTag.replace(/^<svg\b/i, `<svg${attribute}`),
  )
}

function findLocalSvgFile(library: string, name: string): string {
  if (library === 'patternfly-icons') {
    const candidate = path.join(
      process.cwd(),
      'node_modules',
      '@patternfly',
      'react-icons',
      'dist',
      'static',
      `${name}.svg`,
    )
    if (existsSync(candidate)) return candidate
  }

  if (library === 'bootstrap-icons') {
    const candidate = path.join(
      process.cwd(),
      'node_modules',
      'bootstrap-icons',
      'icons',
      `${name}.svg`,
    )
    if (existsSync(candidate)) return candidate
  }

  if (library === 'untitled-ui-icons') {
    const candidate = path.join(process.cwd(), 'public', 'untitled-ui-icons', `${name}.svg`)
    if (existsSync(candidate)) return candidate
  }

  return ''
}

function getUpstreamCandidateUrls(library: string, name: string): string[] {
  const candidates = new Set<string>()
  const rawVariants = Array.from(new Set([name, name.replace(/_/g, '-'), name.replace(/-/g, '_')]))
  const variants: string[] = []
  for (const v of rawVariants) {
    variants.push(v)
    if (!v.endsWith('-outline') && !v.endsWith('-solid') && !v.endsWith('-regular') && !v.endsWith('-filled')) {
      variants.push(`${v}-outline`, `${v}-solid`, `${v}-regular`, `${v}-filled`, `${v}-line`, `${v}-fill`)
    }
  }

  const add = (url: string) => candidates.add(url)

  if (library.startsWith('iconify-')) {
    const prefix = library.replace(/^iconify-/, '')
    for (const v of variants) {
      add(`https://api.iconify.design/${prefix}/${v}.svg`)
    }
  } else if (library === 'elusive-icons') {
    for (const v of variants) {
      add(`https://api.iconify.design/el/${v}.svg`)
      add(`https://api.iconify.design/elusive/${v}.svg`)
    }
  } else if (library === 'teenyicons') {
    for (const v of variants) {
      add(`https://api.iconify.design/teenyicons/${v}.svg`)
      add(`https://api.iconify.design/teeny/${v}.svg`)
    }
  } else if (library === 'circum-icons') {
    for (const v of variants) {
      add(`https://api.iconify.design/circum/${v}.svg`)
    }
  } else if (library === 'radix-icons') {
    for (const v of variants) {
      add(`https://api.iconify.design/radix-icons/${v}.svg`)
      add(`https://api.iconify.design/radix-ui/${v}.svg`)
      add(`https://api.iconify.design/radix/${v}.svg`)
    }
  } else if (library === 'devicons') {
    for (const v of variants) {
      add(`https://api.iconify.design/devicon/${v}.svg`)
      add(`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${v}/${v}-original.svg`)
    }
  } else if (library === 'lucide-icons') {
    for (const v of variants) {
      add(`https://cdn.jsdelivr.net/npm/lucide-static/icons/${v}.svg`)
      add(`https://api.iconify.design/lucide/${v}.svg`)
    }
  } else if (library === 'tabler-icons') {
    for (const v of variants) {
      add(`https://cdn.jsdelivr.net/npm/@tabler/icons/icons/${v}.svg`)
      add(`https://api.iconify.design/tabler/${v}.svg`)
    }
  } else if (library === 'phosphor-icons') {
    for (const v of variants) {
      add(`https://cdn.jsdelivr.net/npm/@phosphor-icons/core/assets/regular/${v}.svg`)
      add(`https://api.iconify.design/ph/${v}.svg`)
    }
  } else if (library === 'heroicons') {
    for (const v of variants) {
      add(`https://api.iconify.design/heroicons/${v}.svg`)
      add(`https://api.iconify.design/heroicons-outline/${v}.svg`)
      add(`https://api.iconify.design/heroicons-solid/${v}.svg`)
    }
  } else if (library === 'feather-icons') {
    for (const v of variants) {
      add(`https://unpkg.com/feather-icons/dist/icons/${v}.svg`)
      add(`https://api.iconify.design/feather/${v}.svg`)
    }
  } else if (library === 'remix-icon') {
    for (const v of variants) {
      add(`https://api.iconify.design/ri/${v}.svg`)
    }
  } else if (library === 'iconoir') {
    for (const v of variants) {
      add(`https://api.iconify.design/iconoir/${v}.svg`)
    }
  } else if (library === 'ionicons') {
    for (const v of variants) {
      add(`https://api.iconify.design/ion/${v}.svg`)
    }
  } else if (library === 'octicons') {
    for (const v of variants) {
      add(`https://api.iconify.design/octicon/${v}.svg`)
    }
  } else if (library === 'ant-design-icons') {
    for (const v of variants) {
      add(`https://api.iconify.design/ant-design/${v}.svg`)
      add(`https://api.iconify.design/ant-design/${v}-outlined.svg`)
      add(`https://api.iconify.design/ant-design/${v}-filled.svg`)
    }
  } else {
    const prefix = library.replace(/-icons?$/, '').replace(/_/g, '-')
    for (const v of variants) {
      add(`https://api.iconify.design/${prefix}/${v}.svg`)
    }
  }

  return Array.from(candidates)
}

async function fetchAndCacheUpstream(library: string, name: string): Promise<string> {
  const candidates = getUpstreamCandidateUrls(library, name)
  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'IconSearch-Server/1.0' },
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) continue
      const text = await response.text()
      const cleanSvg = sanitizeSvg(text)
      if (!cleanSvg) continue

      try {
        const libDir = path.join(CACHE_DIR, library)
        if (!existsSync(libDir)) {
          mkdirSync(libDir, { recursive: true })
        }
        const cachePath = path.join(libDir, `${name}.svg`)
        writeFileSync(cachePath, cleanSvg, 'utf8')
      } catch {
        // Disk write failed (e.g. read-only serverless filesystem), safely ignore
      }

      return cleanSvg
    } catch {
      // Continue to next candidate
    }
  }

  return ''
}


export function OPTIONS() {
  return publicOptions()
}

export async function GET(
  request: Request,
  context: { params: Promise<{ library: string; name: string }> }
) {
  // Validate route parameters
  const { library, name: rawName } = await context.params
  const name = normalizeName(rawName)

  if (!isSafeSegment(library) || !isSafeSegment(name)) {
    return publicJson({ error: 'Invalid icon path parameters.' }, { status: 400 })
  }


  // 3. Resolve from local package / public directory
  const localFile = findLocalSvgFile(library, name)
  if (localFile) {
    const rawContent = readFileSync(localFile, 'utf8')
    return new NextResponse(customizeSvg(sanitizeSvg(rawContent), request), { status: 200, headers: SVG_HEADERS })
  }

  // 4. Resolve from server disk cache
  const cachePath = path.join(CACHE_DIR, library, `${name}.svg`)
  if (existsSync(cachePath)) {
    const cachedContent = readFileSync(cachePath, 'utf8')
    return new NextResponse(customizeSvg(cachedContent, request), { status: 200, headers: SVG_HEADERS })
  }

  // 5. Upstream server-side fetch & cache
  const fetchedContent = await fetchAndCacheUpstream(library, name)
  if (fetchedContent) {
    return new NextResponse(customizeSvg(fetchedContent, request), { status: 200, headers: SVG_HEADERS })
  }

  return publicJson({ error: 'Icon SVG not found.' }, { status: 404 })
}
