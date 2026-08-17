'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { IconLibraryMeta } from '../../../../data/library-catalog'
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Download,
  Palette,
  Sliders,
} from 'lucide-react'

const QUICK_COLORS = [
  '#FFFFFF',
  '#94A3B8',
  '#8B5CF6',
  '#38BDF8',
  '#34D399',
  '#FBBF24',
  '#F43F5E',
  '#FB923C',
]

export default function IconDetailClient({
  iconName,
  displayName,
  library,
  svgApiUrl,
}: {
  iconName: string
  displayName: string
  library: IconLibraryMeta
  svgApiUrl: string
}) {
  const [color, setColor] = useState('#FFFFFF')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [bgMode, setBgMode] = useState<'dark' | 'light' | 'grid' | 'accent'>('dark')
  const [codeTab, setCodeTab] = useState<'react' | 'svg' | 'vue' | 'svelte' | 'datauri'>('react')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [svgText, setSvgText] = useState<string>('')
  const [loadingSvg, setLoadingSvg] = useState<boolean>(true)
  const [pngSize, setPngSize] = useState<number>(256)

  // Fetch raw SVG
  useEffect(() => {
    let isMounted = true
    fetch(svgApiUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load SVG')
        return res.text()
      })
      .then((text) => {
        if (isMounted) {
          setSvgText(text)
          setLoadingSvg(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setSvgText('')
          setLoadingSvg(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [svgApiUrl])

  const copyToClipboard = (text: string, key: string) => {
    if (!navigator?.clipboard) return
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }

  // Component PascalCase Name
  const componentName = displayName.replace(/[^a-zA-Z0-9]/g, '') || 'Icon'

  // Generated code snippets
  const reactSnippet = `import React from 'react'

export function ${componentName}Icon({ size = 24, className = '', ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    ${svgText
      .replace(/<svg([^>]*)>/i, `<svg$1 width={size} height={size} className={className} {...props}>`)
      .replace(/stroke-width="[^"]*"/gi, `strokeWidth="${strokeWidth}"`)
      .replace(/fill="currentColor"/gi, `fill="currentColor"`)
      .replace(/stroke="currentColor"/gi, `stroke="currentColor"`) || `/* ${displayName} SVG */`}
  )
}`

  const cleanSvgSnippet = svgText
    ? svgText
        .replace(/width="[^"]*"/i, 'width="24"')
        .replace(/height="[^"]*"/i, 'height="24"')
        .replace(/stroke-width="[^"]*"/gi, `stroke-width="${strokeWidth}"`)
    : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}"><path d="..."/></svg>`

  const vueSnippet = `<template>
  ${cleanSvgSnippet.replace(/<svg/i, `<svg :width="size" :height="size" :stroke="color"`)}
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 24 },
  color: { type: String, default: '${color}' }
})
</script>`

  const svelteSnippet = `<script>
  export let size = 24;
  export let color = '${color}';
</script>

${cleanSvgSnippet.replace(/<svg/i, `<svg width={size} height={size} stroke={color}`)}`

  const dataUriSnippet = svgText
    ? `background-image: url("data:image/svg+xml,${encodeURIComponent(svgText)}");`
    : ''

  // Download SVG
  const handleDownloadSvg = () => {
    if (!svgText) return
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${library.slug}-${iconName}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Download PNG / WebP via Canvas
  const handleDownloadRaster = (format: 'png' | 'webp') => {
    if (!svgText) return
    const img = new Image()
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pngSize
      canvas.height = pngSize
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, pngSize, pngSize)
        ctx.drawImage(img, 0, 0, pngSize, pngSize)
        const mime = format === 'webp' ? 'image/webp' : 'image/png'
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = downloadUrl
            a.download = `${library.slug}-${iconName}-${pngSize}x${pngSize}.${format}`
            a.click()
            URL.revokeObjectURL(downloadUrl)
          }
        }, mime)
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '24px',
          fontFamily: 'var(--font-mono)',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Home
        </Link>
        <span>/</span>
        <Link href="/free-svg-icons" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Free SVG Icons
        </Link>
        <span>/</span>
        <Link href={`/icons/${library.slug}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          {library.name}
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{displayName}</span>
      </nav>

      {/* Main Studio Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
          gap: '32px',
          marginBottom: '48px',
        }}
      >
        {/* Left: Interactive Canvas & Customizer */}
        <section
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent)',
                  letterSpacing: '1px',
                  marginBottom: '6px',
                }}
              >
                {library.name.toUpperCase()} ICON
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, margin: 0 }}>
                {displayName}
              </h1>
            </div>

            <span
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                padding: '4px 10px',
                borderRadius: '6px',
                color: 'var(--text-muted)',
              }}
            >
              {library.license}
            </span>
          </div>

          {/* Canvas Box */}
          <div
            style={{
              minHeight: '280px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              border: '1px solid var(--border)',
              background:
                bgMode === 'dark'
                  ? '#09090b'
                  : bgMode === 'light'
                  ? '#ffffff'
                  : bgMode === 'accent'
                  ? 'linear-gradient(135deg, #1e113d 0%, #09090b 100%)'
                  : 'repeating-conic-gradient(#18181b 0% 25%, #09090b 0% 50%) 50% / 20px 20px',
              transition: 'background 0.2s ease',
            }}
          >
            {loadingSvg ? (
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Loading vector SVG...
              </div>
            ) : svgText ? (
              <div
                style={{
                  width: '128px',
                  height: '128px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: color,
                }}
                dangerouslySetInnerHTML={{
                  __html: svgText
                    .replace(/width="[^"]*"/i, 'width="128"')
                    .replace(/height="[^"]*"/i, 'height="128"')
                    .replace(/currentColor/gi, color)
                    .replace(/stroke="[^"]*"/gi, `stroke="${color}"`)
                    .replace(/stroke-width="[^"]*"/gi, `stroke-width="${strokeWidth}"`),
                }}
              />
            ) : (
              <div style={{ color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                Unable to load SVG preview.
              </div>
            )}

            {/* Canvas mode toggles */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                display: 'flex',
                gap: '6px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                padding: '4px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              {(['dark', 'light', 'grid', 'accent'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBgMode(mode)}
                  style={{
                    background: bgMode === mode ? 'var(--accent)' : 'transparent',
                    color: bgMode === mode ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Color & Stroke Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Palette size={16} style={{ color: 'var(--accent)' }} />
                <span>Icon Color</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    width: '28px',
                    height: '28px',
                    padding: 0,
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {color.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Quick color pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {QUICK_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transform: color === c ? 'scale(1.1)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
              ))}
            </div>

            {/* Stroke Width Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <Sliders size={15} style={{ color: 'var(--accent)' }} /> Stroke Width
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{strokeWidth}px</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.25"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Instant Download Options */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderTop: '1px solid var(--border)',
              paddingTop: '20px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Export Formats
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
              <button
                onClick={handleDownloadSvg}
                style={{
                  background: 'var(--accent)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontWeight: 600,
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Download size={15} /> SVG Vector
              </button>

              <button
                onClick={() => handleDownloadRaster('png')}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontWeight: 600,
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Download size={15} /> PNG ({pngSize}px)
              </button>

              <button
                onClick={() => handleDownloadRaster('webp')}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontWeight: 600,
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Download size={15} /> WebP
              </button>
            </div>

            {/* PNG Resolution Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                PNG Size:
              </span>
              {[64, 128, 256, 512, 1024].map((s) => (
                <button
                  key={s}
                  onClick={() => setPngSize(s)}
                  style={{
                    background: pngSize === s ? 'var(--accent)' : 'transparent',
                    color: pngSize === s ? '#ffffff' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                  }}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right: Code Generator & Export Tabs */}
        <section
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700 }}>
              <Code2 size={18} style={{ color: 'var(--accent)' }} />
              <span>Developer Code Export</span>
            </div>

            <button
              onClick={() => {
                const textToCopy =
                  codeTab === 'react'
                    ? reactSnippet
                    : codeTab === 'svg'
                    ? cleanSvgSnippet
                    : codeTab === 'vue'
                    ? vueSnippet
                    : codeTab === 'svelte'
                    ? svelteSnippet
                    : dataUriSnippet
                copyToClipboard(textToCopy, 'tab-code')
              }}
              style={{
                background: copiedKey === 'tab-code' ? '#10b981' : 'var(--accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
            >
              {copiedKey === 'tab-code' ? <Check size={14} /> : <Copy size={14} />}
              {copiedKey === 'tab-code' ? 'Copied Code!' : 'Copy Code'}
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '8px',
              overflowX: 'auto',
            }}
          >
            {(['react', 'svg', 'vue', 'svelte', 'datauri'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCodeTab(tab)}
                style={{
                  background: codeTab === tab ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  color: codeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                  border: codeTab === tab ? '1px solid var(--accent)' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {tab === 'react' ? 'React / JSX' : tab === 'svg' ? 'Raw SVG' : tab === 'vue' ? 'Vue 3' : tab === 'svelte' ? 'Svelte' : 'Data URI'}
              </button>
            ))}
          </div>

          {/* Code Viewer */}
          <div
            style={{
              background: '#09090b',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '16px',
              minHeight: '220px',
              maxHeight: '320px',
              overflowY: 'auto',
            }}
          >
            <pre
              style={{
                margin: 0,
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: '#34d399',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {codeTab === 'react'
                ? reactSnippet
                : codeTab === 'svg'
                ? cleanSvgSnippet
                : codeTab === 'vue'
                ? vueSnippet
                : codeTab === 'svelte'
                ? svelteSnippet
                : dataUriSnippet}
            </pre>
          </div>

          {/* Metadata Specs Table */}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              fontSize: '13px',
            }}
          >
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                ICON LIBRARY
              </div>
              <Link
                href={`/icons/${library.slug}`}
                style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
              >
                {library.name} →
              </Link>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                LICENSE
              </div>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>{library.license}</div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                TOTAL COLLECTION
              </div>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>
                {library.iconCount.toLocaleString('en-US')} Icons
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                EXPLORE SIMILAR
              </div>
              <Link
                href={`/icon-search?q=${encodeURIComponent(iconName)}`}
                style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
              >
                Search {displayName} Icons →
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Back to Collection Navigation Bar */}
      <section
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>
            Explore More in {library.name}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            Browse all {library.iconCount.toLocaleString('en-US')} open-source vector SVG icons in this collection.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href={`/icons/${library.slug}`}
            style={{
              background: 'var(--accent)',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={16} /> {library.name} Catalog
          </Link>
          <Link
            href="/free-svg-icons"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '10px 18px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Browse All 229 Libraries
          </Link>
        </div>
      </section>
    </div>
  )
}
