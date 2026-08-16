import { createHash } from 'node:crypto'

export const MAX_SVG_BYTES = 512 * 1024

const FORBIDDEN_ELEMENTS = /<(?:script|foreignObject|iframe|object|embed|image|audio|video|canvas|style|link|meta)\b/i
const FORBIDDEN_PROTOCOLS = /(?:javascript|vbscript|data|file):/i
const EXTERNAL_URL = /url\(\s*['"]?(?:https?:|\/\/|data:)/i

export function sanitizeProjectSvg(value: string) {
  if (Buffer.byteLength(value, 'utf8') > MAX_SVG_BYTES) throw new Error('The SVG exceeds the 512 KB safety limit.')

  let svg = value
    .replace(/^\uFEFF/, '')
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<!doctype[\s\S]*?>/gi, '')
    .replace(/<!--([\s\S]*?)-->/g, '')
    .trim()

  if (!/^<svg\b/i.test(svg) || !/<\/svg>\s*$/i.test(svg)) throw new Error('The response is not a complete SVG document.')
  if (FORBIDDEN_ELEMENTS.test(svg)) throw new Error('The SVG contains an unsupported active or embedded element.')
  if (/<!entity/i.test(svg) || FORBIDDEN_PROTOCOLS.test(svg) || EXTERNAL_URL.test(svg)) {
    throw new Error('The SVG contains an unsafe external reference.')
  }

  svg = svg
    .replace(/\s(on[a-z]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(?:href|xlink:href)\s*=\s*(?:"(?!#)[^"]*"|'(?!#)[^']*'|[^#\s][^\s>]*)/gi, '')
    .replace(/\sstyle\s*=\s*(?:"[^"]*url\([^)]*\)[^"]*"|'[^']*url\([^)]*\)[^']*')/gi, '')

  if (!/\sxmlns=/.test(svg.slice(0, 500))) {
    svg = svg.replace(/^<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"')
  }

  return `${svg}\n`
}

export function checksumSvg(svg: string) {
  return `sha256:${createHash('sha256').update(svg).digest('hex')}`
}
