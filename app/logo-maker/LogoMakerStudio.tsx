'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import JSZip from 'jszip'
import {
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Download,
  Copy,
  Check,
  Search,
  Sparkles,
  Sliders,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Layers,
  Palette,
  Shield,
  Square,
  Circle,
  Hexagon,
  RefreshCw,
  FileCode,
  Archive,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react'

export type StudioIcon = {
  id: string
  name: string
  displayName?: string
  library: string
  libraryName?: string
  svgUrl: string
  tags?: string[]
}

const DEFAULT_STARTER_ICONS: StudioIcon[] = [
  { id: 'camera', name: 'camera', displayName: 'Camera', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/camera.svg' },
  { id: 'github', name: 'github', displayName: 'GitHub', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/github.svg' },
  { id: 'linkedin', name: 'linkedin', displayName: 'LinkedIn', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/linkedin.svg' },
  { id: 'sparkles', name: 'sparkles', displayName: 'Sparkles', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/sparkles.svg' },
  { id: 'rocket', name: 'rocket', displayName: 'Rocket', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/rocket.svg' },
  { id: 'zap', name: 'zap', displayName: 'Lightning', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/zap.svg' },
  { id: 'shield', name: 'shield', displayName: 'Shield', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/shield.svg' },
  { id: 'flame', name: 'flame', displayName: 'Flame', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/flame.svg' },
  { id: 'heart', name: 'heart', displayName: 'Heart', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/heart.svg' },
  { id: 'globe', name: 'globe', displayName: 'Globe', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/globe.svg' },
  { id: 'code', name: 'code', displayName: 'Code', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/code.svg' },
  { id: 'music', name: 'music', displayName: 'Music', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/music.svg' },
  { id: 'video', name: 'video', displayName: 'Video', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/video.svg' },
  { id: 'compass', name: 'compass', displayName: 'Compass', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/compass.svg' },
  { id: 'feather', name: 'feather', displayName: 'Feather', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/feather.svg' },
  { id: 'cpu', name: 'cpu', displayName: 'Processor', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/cpu.svg' },
  { id: 'cloud', name: 'cloud', displayName: 'Cloud', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/cloud.svg' },
  { id: 'lock', name: 'lock', displayName: 'Lock', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/lock.svg' },
  { id: 'settings', name: 'settings', displayName: 'Settings', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/settings.svg' },
  { id: 'bell', name: 'bell', displayName: 'Bell', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/bell.svg' },
  { id: 'calendar', name: 'calendar', displayName: 'Calendar', library: 'lucide-icons', svgUrl: 'https://unpkg.com/lucide-static@latest/icons/calendar.svg' },
]

const MATERIAL_PRESETS = [
  { id: 'crimson', name: 'Sunset Crimson', bg: '#E41540', gradient: 'linear-gradient(135deg, #FF3366 0%, #E41540 50%, #B3002D 100%)', color: '#FFFFFF' },
  { id: 'royal', name: 'Royal Violet', bg: '#6366F1', gradient: 'linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #4338CA 100%)', color: '#FFFFFF' },
  { id: 'cyan', name: 'Cyber Cyan', bg: '#06B6D4', gradient: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 50%, #0E7490 100%)', color: '#FFFFFF' },
  { id: 'emerald', name: 'Emerald Mint', bg: '#10B981', gradient: 'linear-gradient(135deg, #34D399 0%, #10B981 50%, #047857 100%)', color: '#FFFFFF' },
  { id: 'amber', name: 'Solar Amber', bg: '#F59E0B', gradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)', color: '#FFFFFF' },
  { id: 'dark', name: 'Dark Titanium', bg: '#18181B', gradient: 'linear-gradient(135deg, #27272A 0%, #18181B 50%, #09090B 100%)', color: '#FFFFFF' },
  { id: 'monochrome', name: 'Pure White', bg: '#FFFFFF', gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F4F4F5 100%)', color: '#18181B' },
]

// Resilient thumbnail preview renderer
function IconThumbnail({ icon, isSelected, onSelect }: { icon: StudioIcon; isSelected: boolean; onSelect: () => void }) {
  const [candidateIndex, setCandidateIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  const candidateUrls = useMemo(() => {
    const list: string[] = []
    if (icon.svgUrl) list.push(icon.svgUrl)
    list.push(`/api/svg/${encodeURIComponent(icon.library)}/${encodeURIComponent(icon.name)}`)
    list.push(`https://api.iconify.design/${icon.library}/${icon.name}.svg`)
    return list
  }, [icon.svgUrl, icon.library, icon.name])

  const src = candidateUrls[candidateIndex] || candidateUrls[0]

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        aspectRatio: '1/1',
        background: isSelected ? 'rgba(228, 21, 64, 0.12)' : 'rgba(255,255,255,0.03)',
        border: isSelected ? '2px solid #E41540' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: '12px',
        transition: 'all 0.15s',
        position: 'relative',
      }}
      title={`${icon.displayName || icon.name} (${icon.library})`}
    >
      {!failed ? (
        <img
          src={src}
          alt={icon.name}
          style={{
            width: '26px',
            height: '26px',
            filter: isSelected ? 'none' : 'invert(1)',
            opacity: isSelected ? 1 : 0.75,
            objectFit: 'contain',
          }}
          onError={() => {
            if (candidateIndex < candidateUrls.length - 1) {
              setCandidateIndex((prev) => prev + 1)
            } else {
              setFailed(true)
            }
          }}
        />
      ) : (
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono, monospace)' }}>
          {icon.name.slice(0, 3)}
        </span>
      )}
    </button>
  )
}

export default function LogoMakerStudio({ initialIcons }: { initialIcons?: StudioIcon[] }) {
  // ── 1. Active Icon & Search State ──────────────────────────────────────────
  const [selectedIcon, setSelectedIcon] = useState<StudioIcon>(DEFAULT_STARTER_ICONS[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [iconsList, setIconsList] = useState<StudioIcon[]>(initialIcons && initialIcons.length > 0 ? initialIcons : DEFAULT_STARTER_ICONS)
  const [searching, setSearching] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // ── 2. SVG Markup Cache ───────────────────────────────────────────────────
  const [svgContent, setSvgContent] = useState<string>('')
  const [loadingSvg, setLoadingSvg] = useState(false)

  // ── 3. Customization State ────────────────────────────────────────────────
  const [shape, setShape] = useState<'squircle' | 'rounded' | 'circle' | 'hexagon' | 'shield' | 'none'>('squircle')
  const [bgMode, setBgMode] = useState<'gradient' | 'solid' | 'transparent'>('gradient')
  const [bgColor, setBgColor] = useState('#E41540')
  const [bgGradient, setBgGradient] = useState('linear-gradient(135deg, #FF3366 0%, #E41540 50%, #B3002D 100%)')
  const [iconColor, setIconColor] = useState('#FFFFFF')

  // Sliders
  const [canvasSize, setCanvasSize] = useState(288) // px
  const [iconSize, setIconSize] = useState(140) // px
  const [padding, setPadding] = useState(76) // px
  const [rotation, setRotation] = useState(0) // deg
  const [radius, setRadius] = useState(64) // px
  const [opacity, setOpacity] = useState(100) // %
  const [strokeWidth, setStrokeWidth] = useState(2) // px

  // Effects Toggles
  const [dropShadow, setDropShadow] = useState(true)
  const [shadowBlur, setShadowBlur] = useState(24)
  const [shadowY, setShadowY] = useState(12)
  const [borderStroke, setBorderStroke] = useState(false)
  const [borderWidth, setBorderWidth] = useState(2)
  const [borderColor, setBorderColor] = useState('rgba(255,255,255,0.2)')
  const [lightSheen, setLightSheen] = useState(true)

  // Canvas Viewport Controls
  const [zoom, setZoom] = useState(100)
  const [showGrid, setShowGrid] = useState(true)
  const [isRotating, setIsRotating] = useState(false)
  const [dragStartAngle, setDragStartAngle] = useState(0)

  // Feedback & Copy State
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [exportingZip, setExportingZip] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  const previewCardRef = useRef<HTMLDivElement>(null)

  // ── 4. Fetch Selected SVG String ──────────────────────────────────────────
  useEffect(() => {
    let isMounted = true
    async function loadIconSvg() {
      if (!selectedIcon) return
      setLoadingSvg(true)
      try {
        let rawText = ''
        
        // 1. Try internal SVG endpoint
        try {
          const internalRes = await fetch(`/api/svg/${encodeURIComponent(selectedIcon.library)}/${encodeURIComponent(selectedIcon.name)}`)
          if (internalRes.ok) {
            rawText = await internalRes.text()
          }
        } catch {}

        // 2. Fallback to direct svgUrl
        if (!rawText && selectedIcon.svgUrl) {
          try {
            const res = await fetch(selectedIcon.svgUrl)
            if (res.ok) {
              rawText = await res.text()
            }
          } catch {}
        }

        // 3. Fallback to Iconify
        if (!rawText) {
          try {
            const iconifyRes = await fetch(`https://api.iconify.design/${encodeURIComponent(selectedIcon.library)}/${encodeURIComponent(selectedIcon.name)}.svg`)
            if (iconifyRes.ok) {
              rawText = await iconifyRes.text()
            }
          } catch {}
        }

        if (isMounted && rawText) {
          let cleaned = rawText
            .replace(/<\?xml.*?\?>/i, '')
            .replace(/<!DOCTYPE.*?>/i, '')
          setSvgContent(cleaned)
        }
      } catch (err) {
        console.error('Failed to load icon SVG:', err)
      } finally {
        if (isMounted) setLoadingSvg(false)
      }
    }
    loadIconSvg()
    return () => {
      isMounted = false
    }
  }, [selectedIcon])

  const [selectedLibrary, setSelectedLibrary] = useState<string>('all')
  const [totalCount, setTotalCount] = useState<number>(355702)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // ── 5. Search 355k Icon Index ─────────────────────────────────────────────
  const performSearch = useCallback(async (query: string, pageNum: number = 1, append: boolean = false, libFilter: string = selectedLibrary) => {
    setSearching(true)
    try {
      const q = query.trim()
      let url = `/api/icon-search?legalOnly=0&page=${pageNum}&limit=60`
      if (q) {
        url += `&q=${encodeURIComponent(q)}`
      } else {
        url += `&sort=popular`
      }
      if (libFilter && libFilter !== 'all') {
        url += `&library=${encodeURIComponent(libFilter)}`
      }
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (data.total !== undefined) {
          setTotalCount(data.total)
        }
        if (data.icons && Array.isArray(data.icons)) {
          const formatted: StudioIcon[] = data.icons.map((item: any, idx: number) => ({
            id: item.id || `${item.library}-${item.name}-${pageNum}-${idx}`,
            name: item.name,
            displayName: item.displayName || item.name,
            library: item.library,
            libraryName: item.libraryName || item.library,
            svgUrl: item.svgUrl || `/api/svg/${encodeURIComponent(item.library)}/${encodeURIComponent(item.name)}`,
            tags: item.tags || [],
          }))

          if (append) {
            setIconsList(prev => {
              const seen = new Set(prev.map(p => p.id))
              const unique = formatted.filter(f => !seen.has(f.id))
              return [...prev, ...unique]
            })
          } else {
            setIconsList(formatted.length > 0 ? formatted : DEFAULT_STARTER_ICONS)
          }

          const totalP = data.totalPages || Math.ceil((data.total || 355702) / 60)
          setHasMore(pageNum < totalP && formatted.length > 0)
        }
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }, [selectedLibrary])

  // Debounced search on input change or library filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      performSearch(searchQuery, 1, false, selectedLibrary)
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedLibrary, performSearch])

  const handleLoadMore = useCallback(() => {
    if (searching || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    performSearch(searchQuery, nextPage, true, selectedLibrary)
  }, [page, searching, hasMore, searchQuery, selectedLibrary, performSearch])

  // Automatic Infinite Scroll on Sentinel Intersection
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !searching) {
          handleLoadMore()
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [handleLoadMore, hasMore, searching])

  // ── 6. Interactive Drag Rotation on Canvas ────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsRotating(true)
    if (!previewCardRef.current) return
    const rect = previewCardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
    setDragStartAngle(angle - rotation)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isRotating || !previewCardRef.current) return
      const rect = previewCardRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
      let newRot = Math.round(angle - dragStartAngle)
      while (newRot > 180) newRot -= 360
      while (newRot < -180) newRot += 360
      setRotation(newRot)
    }

    const handleMouseUp = () => {
      setIsRotating(false)
    }

    if (isRotating) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isRotating, dragStartAngle, rotation])

  // ── 7. Generate Customized SVG Code ───────────────────────────────────────
  const generatedSvgMarkup = useMemo(() => {
    if (!svgContent) return ''

    let modified = svgContent
    modified = modified.replace(/stroke-width="[^"]*"/g, `stroke-width="${strokeWidth}"`)
    
    if (modified.includes('stroke="currentColor"')) {
      modified = modified.replace(/stroke="currentColor"/g, `stroke="${iconColor}"`)
    } else if (!modified.includes('stroke=') && modified.includes('fill="currentColor"')) {
      modified = modified.replace(/fill="currentColor"/g, `fill="${iconColor}"`)
    } else {
      modified = modified.replace(/currentColor/g, iconColor)
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasSize} ${canvasSize}" width="${canvasSize}" height="${canvasSize}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF3366" />
      <stop offset="50%" stop-color="#E41540" />
      <stop offset="100%" stop-color="#B3002D" />
    </linearGradient>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${shadowY}" stdDeviation="${shadowBlur / 2}" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>
  ${bgMode !== 'transparent' ? `
  <rect width="${canvasSize}" height="${canvasSize}" rx="${shape === 'circle' ? canvasSize / 2 : radius}" fill="${bgMode === 'gradient' ? 'url(#bgGrad)' : bgColor}" ${dropShadow ? 'filter="url(#cardShadow)"' : ''} />
  ` : ''}
  <g transform="translate(${canvasSize / 2}, ${canvasSize / 2}) rotate(${rotation}) translate(-${iconSize / 2}, -${iconSize / 2})" opacity="${opacity / 100}">
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
      ${modified.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
    </svg>
  </g>
</svg>`
  }, [svgContent, strokeWidth, iconColor, bgMode, bgGradient, bgColor, canvasSize, shape, radius, dropShadow, shadowY, shadowBlur, rotation, iconSize, opacity])

  // ── 8. Single File Downloads (SVG / PNG) ───────────────────────────────────
  const downloadSvg = () => {
    const blob = new Blob([generatedSvgMarkup], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedIcon.name || 'logo'}-icon.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPng = async (dimension: number = canvasSize * 2) => {
    const canvas = document.createElement('canvas')
    canvas.width = dimension
    canvas.height = dimension
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    const svgBlob = new Blob([generatedSvgMarkup], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      ctx.drawImage(img, 0, 0, dimension, dimension)
      URL.revokeObjectURL(url)
      const pngUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = `${selectedIcon.name || 'logo'}-${dimension}x${dimension}.png`
      a.click()
    }
    img.src = url
  }

  // ── 9. Copy to Clipboard Helper ───────────────────────────────────────────
  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2000)
    } catch (e) {
      console.warn('Copy failed', e)
    }
  }

  // ── 10. Download Complete Production Asset Pack (.ZIP) ───────────────────
  const downloadAssetZip = async () => {
    setExportingZip(true)
    try {
      const zip = new JSZip()
      const iconName = selectedIcon.name || 'app-icon'

      zip.file(`${iconName}.svg`, generatedSvgMarkup)

      const sizes = [
        { name: 'favicon-16x16.png', size: 16 },
        { name: 'favicon-32x32.png', size: 32 },
        { name: 'favicon-48x48.png', size: 48 },
        { name: 'apple-touch-icon.png', size: 180 },
        { name: 'android-chrome-192x192.png', size: 192 },
        { name: 'android-chrome-512x512.png', size: 512 },
        { name: 'logo-1024x1024.png', size: 1024 },
      ]

      for (const item of sizes) {
        const canvas = document.createElement('canvas')
        canvas.width = item.size
        canvas.height = item.size
        const ctx = canvas.getContext('2d')
        if (ctx) {
          await new Promise<void>((resolve) => {
            const img = new Image()
            const svgBlob = new Blob([generatedSvgMarkup], { type: 'image/svg+xml;charset=utf-8' })
            const url = URL.createObjectURL(svgBlob)
            img.onload = () => {
              ctx.drawImage(img, 0, 0, item.size, item.size)
              URL.revokeObjectURL(url)
              const base64Data = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '')
              zip.file(item.name, base64Data, { base64: true })
              resolve()
            }
            img.src = url
          })
        }
      }

      const manifest = {
        name: `${selectedIcon.displayName || 'IconSearch'} App`,
        short_name: 'App',
        icons: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
        ],
        theme_color: bgColor,
        background_color: '#09090b',
        display: 'standalone'
      }
      zip.file('site.webmanifest', JSON.stringify(manifest, null, 2))

      const htmlSnippet = `<!-- Favicon and App Icon Meta Tags -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${bgColor}">`
      zip.file('head-tags.html', htmlSnippet)

      const content = await zip.generateAsync({ type: 'blob' })
      const zipUrl = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = zipUrl
      a.download = `${iconName}-icon-package.zip`
      a.click()
      URL.revokeObjectURL(zipUrl)
    } catch (err) {
      console.error('Failed to create zip package:', err)
    } finally {
      setExportingZip(false)
    }
  }

  const applyMaterial = (mat: typeof MATERIAL_PRESETS[0]) => {
    setBgMode('gradient')
    setBgColor(mat.bg)
    setBgGradient(mat.gradient)
    setIconColor(mat.color)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: '#09090b', color: '#f4f4f5', overflow: 'hidden', position: 'fixed', top: 0, left: 0, zIndex: 999 }}>
      
      {/* ── TOP HEADER / TOOLBAR ────────────────────────────────────────── */}
      <header style={{
        height: '56px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: '#121215',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/free-svg-icons"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <ArrowLeft size={14} />
            <span>Icons</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: '#E41540',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '15px',
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>+</span>
            <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Logo Builder
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono, monospace)' }}>
            355,702 SVGs
          </span>
        </div>

        {/* Center Canvas Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Shape selector buttons */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px', gap: '2px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { id: 'squircle', label: 'Squircle', icon: Square },
              { id: 'circle', label: 'Circle', icon: Circle },
              { id: 'hexagon', label: 'Hexagon', icon: Hexagon },
              { id: 'shield', label: 'Shield', icon: Shield },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setShape(s.id as any)}
                title={s.label}
                style={{
                  background: shape === s.id ? '#E41540' : 'transparent',
                  color: shape === s.id ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                <s.icon size={13} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px 8px', gap: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex' }}
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', minWidth: '40px', textAlign: 'center', color: '#fff' }}>
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex' }}
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle background grid"
            style={{
              background: showGrid ? 'rgba(228, 21, 64, 0.15)' : 'rgba(255,255,255,0.05)',
              color: showGrid ? '#E41540' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${showGrid ? '#E41540' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Layers size={13} />
            <span>Grid</span>
          </button>
        </div>

        {/* Export & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          <button
            onClick={() => copyToClipboard(generatedSvgMarkup, 'svg')}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#ffffff',
              padding: '7px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {copiedType === 'svg' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            <span>{copiedType === 'svg' ? 'Copied SVG' : 'Copy SVG'}</span>
          </button>

          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            style={{
              background: '#E41540',
              border: 'none',
              color: '#ffffff',
              padding: '7px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(228, 21, 64, 0.35)',
            }}
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          {/* Export Dropdown Menu */}
          {exportMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              background: '#18181b',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
              width: '240px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              zIndex: 100,
            }}>
              <button
                onClick={() => { downloadPng(512); setExportMenuOpen(false) }}
                style={{ background: 'none', border: 'none', color: '#fff', padding: '10px 12px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                className="hover-bg-muted"
              >
                <ImageIcon size={15} color="#22D3EE" />
                <div>
                  <strong>Download PNG</strong>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>512x512 High-Res</div>
                </div>
              </button>

              <button
                onClick={() => { downloadSvg(); setExportMenuOpen(false) }}
                style={{ background: 'none', border: 'none', color: '#fff', padding: '10px 12px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                className="hover-bg-muted"
              >
                <FileCode size={15} color="#F59E0B" />
                <div>
                  <strong>Download SVG</strong>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Vector Markup</div>
                </div>
              </button>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

              <button
                disabled={exportingZip}
                onClick={() => { downloadAssetZip(); setExportMenuOpen(false) }}
                style={{ background: 'rgba(228, 21, 64, 0.15)', border: '1px solid rgba(228, 21, 64, 0.3)', color: '#FF4D6D', padding: '10px 12px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
              >
                <Archive size={15} />
                <div>
                  <strong>{exportingZip ? 'Generating ZIP...' : 'Full Asset Pack (.ZIP)'}</strong>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Favicons, WebManifest & Icons</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── 3-COLUMN MAIN WORKSPACE ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

        {/* ── LEFT PANEL: ICON SEARCH & PICKER ──────────────────────────── */}
        <aside style={{
          width: '280px',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          background: '#0d0d10',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100%',
        }}>
          {/* Search Box & Library Filter */}
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: '#18181b',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              padding: '0 10px',
              marginBottom: '10px',
            }}>
              <Search size={14} color="rgba(255,255,255,0.4)" />
              <input
                type="text"
                placeholder="Search 355,702 icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  padding: '9px 8px',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none',
                }}
              />
              {searching && <RefreshCw size={12} className="spin" color="#E41540" />}
            </div>

            {/* Library Quick Filters */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'lucide-icons', label: 'Lucide' },
                { id: 'heroicons', label: 'Heroicons' },
                { id: 'tabler-icons', label: 'Tabler' },
                { id: 'phosphor-icons', label: 'Phosphor' },
                { id: 'remix-icon', label: 'Remix' },
              ].map((lib) => (
                <button
                  key={lib.id}
                  onClick={() => setSelectedLibrary(lib.id)}
                  style={{
                    background: selectedLibrary === lib.id ? '#E41540' : 'rgba(255,255,255,0.05)',
                    color: selectedLibrary === lib.id ? '#ffffff' : 'rgba(255,255,255,0.6)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {lib.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '6px', fontFamily: 'var(--font-mono, monospace)' }}>
              {totalCount.toLocaleString('en-US')} icons available
            </div>
          </div>

          {/* Icons Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {iconsList.map((item, idx) => (
                <IconThumbnail
                  key={`${item.id}-${idx}`}
                  icon={item}
                  isSelected={selectedIcon.id === item.id}
                  onSelect={() => setSelectedIcon(item)}
                />
              ))}
            </div>

            {/* Sentinel element for automatic infinite scroll */}
            <div ref={sentinelRef} style={{ height: '20px' }} />

            {/* Manual Load More Button */}
            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={searching}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  marginBottom: '16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {searching && <RefreshCw size={12} className="spin" />}
                <span>{searching ? 'Loading...' : 'Load More Icons'}</span>
              </button>
            )}
          </div>
        </aside>

        {/* ── CENTER PANEL: INTERACTIVE ARTBOARD CANVAS ─────────────────── */}
        <main style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: showGrid
            ? 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)'
            : '#09090b',
          backgroundSize: '24px 24px',
          overflow: 'hidden',
          height: '100%',
        }}>
          
          {/* Main Card Wrapper (Scaled according to Zoom) */}
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transition: isRotating ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            {/* The Logo Container Box */}
            <div
              ref={previewCardRef}
              onMouseDown={handleMouseDown}
              style={{
                width: `${canvasSize}px`,
                height: `${canvasSize}px`,
                background: bgMode === 'transparent' ? 'transparent' : (bgMode === 'gradient' ? bgGradient : bgColor),
                borderRadius: shape === 'circle' ? '50%' : (shape === 'none' ? '0' : `${radius}px`),
                boxShadow: dropShadow
                  ? `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.2)`
                  : 'none',
                border: borderStroke ? `${borderWidth}px solid ${borderColor}` : 'none',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isRotating ? 'grabbing' : 'grab',
                userSelect: 'none',
                overflow: 'hidden',
              }}
            >
              {/* Optional Light Sheen / Gloss Effect */}
              {lightSheen && bgMode !== 'transparent' && (
                <div style={{
                  position: 'absolute',
                  top: '-40%',
                  left: '-40%',
                  width: '180%',
                  height: '180%',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, transparent 60%)',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Center SVG Icon */}
              <div
                style={{
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `rotate(${rotation}deg)`,
                  opacity: opacity / 100,
                  transition: isRotating ? 'none' : 'transform 0.15s ease-out',
                }}
              >
                {loadingSvg ? (
                  <RefreshCw className="spin" size={28} color={iconColor} />
                ) : svgContent ? (
                  <div
                    style={{ width: '100%', height: '100%', color: iconColor }}
                    dangerouslySetInnerHTML={{
                      __html: svgContent
                        .replace(/width="[^"]*"/g, 'width="100%"')
                        .replace(/height="[^"]*"/g, 'height="100%"')
                        .replace(/stroke-width="[^"]*"/g, `stroke-width="${strokeWidth}"`)
                        .replace(/currentColor/g, iconColor)
                    }}
                  />
                ) : (
                  <img
                    src={selectedIcon.svgUrl}
                    alt={selectedIcon.name}
                    style={{ width: '100%', height: '100%', filter: iconColor === '#FFFFFF' ? 'brightness(0) invert(1)' : 'none' }}
                  />
                )}
              </div>
            </div>

            {/* Interaction Hint Tag */}
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '4px 12px',
              borderRadius: '100px',
              pointerEvents: 'none',
            }}>
              Drag on preview to rotate • {rotation}°
            </div>
          </div>
        </main>

        {/* ── RIGHT PANEL: DESIGN CONTROLS & INSPECTOR ──────────────────── */}
        <aside style={{
          width: '320px',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          background: '#0d0d10',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflowY: 'auto',
          padding: '20px',
          gap: '24px',
          height: '100%',
        }}>
          
          {/* 1. Materials / Presets */}
          <section>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '1px', marginBottom: '12px' }}>
              MATERIALS & PRESETS
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {MATERIAL_PRESETS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => applyMaterial(m)}
                  title={m.name}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: m.gradient,
                    border: bgColor === m.bg ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.15)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    transform: bgColor === m.bg ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.15s',
                  }}
                />
              ))}
            </div>
          </section>

          {/* 2. Colors */}
          <section style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '1px', marginBottom: '12px' }}>
              COLORS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Background Color Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Background</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => { setBgColor(e.target.value); setBgMode('solid') }}
                    style={{ width: '28px', height: '28px', border: 'none', borderRadius: '50%', cursor: 'pointer', background: 'none' }}
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => { setBgColor(e.target.value); setBgMode('solid') }}
                    style={{ width: '75px', background: '#18181b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '4px 6px', fontSize: '12px', color: '#fff', fontFamily: 'var(--font-mono, monospace)' }}
                  />
                </div>
              </div>

              {/* Icon Color Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Icon Color</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={iconColor}
                    onChange={(e) => setIconColor(e.target.value)}
                    style={{ width: '28px', height: '28px', border: 'none', borderRadius: '50%', cursor: 'pointer', background: 'none' }}
                  />
                  <input
                    type="text"
                    value={iconColor}
                    onChange={(e) => setIconColor(e.target.value)}
                    style={{ width: '75px', background: '#18181b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '4px 6px', fontSize: '12px', color: '#fff', fontFamily: 'var(--font-mono, monospace)' }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 3. Dimensions & Sliders */}
          <section style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '1px', marginBottom: '14px' }}>
              DIMENSIONS
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Canvas Size */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>Canvas</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono, monospace)' }}>{canvasSize}px</span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="512"
                  value={canvasSize}
                  onChange={(e) => setCanvasSize(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#E41540', cursor: 'pointer' }}
                />
              </div>

              {/* Icon Size */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>Icon Size</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono, monospace)' }}>{iconSize}px</span>
                </div>
                <input
                  type="range"
                  min="32"
                  max={Math.min(canvasSize - 20, 300)}
                  value={iconSize}
                  onChange={(e) => setIconSize(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#E41540', cursor: 'pointer' }}
                />
              </div>

              {/* Rotation */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>Rotation</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono, monospace)' }}>{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#E41540', cursor: 'pointer' }}
                />
              </div>

              {/* Corner Radius */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>Radius</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono, monospace)' }}>{radius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.floor(canvasSize / 2)}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#E41540', cursor: 'pointer' }}
                />
              </div>

              {/* Opacity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>Opacity</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono, monospace)' }}>{opacity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#E41540', cursor: 'pointer' }}
                />
              </div>

              {/* Stroke Width */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>Stroke Width</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono, monospace)' }}>{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.5"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#E41540', cursor: 'pointer' }}
                />
              </div>
            </div>
          </section>

          {/* 4. Effects */}
          <section style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '1px', marginBottom: '12px' }}>
              EFFECTS
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Drop Shadow Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Drop Shadow</span>
                <input
                  type="checkbox"
                  checked={dropShadow}
                  onChange={(e) => setDropShadow(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#E41540', cursor: 'pointer' }}
                />
              </div>

              {/* Gloss Sheen Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Glass Sheen</span>
                <input
                  type="checkbox"
                  checked={lightSheen}
                  onChange={(e) => setLightSheen(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#E41540', cursor: 'pointer' }}
                />
              </div>

              {/* Border Stroke Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Border Stroke</span>
                <input
                  type="checkbox"
                  checked={borderStroke}
                  onChange={(e) => setBorderStroke(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#E41540', cursor: 'pointer' }}
                />
              </div>
            </div>
          </section>

          {/* 5. Direct Export Block */}
          <section style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: 'auto' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '1px', marginBottom: '12px' }}>
              EXPORT
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <button
                onClick={() => downloadPng(512)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  padding: '9px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ImageIcon size={13} />
                <span>PNG</span>
              </button>

              <button
                onClick={downloadSvg}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  padding: '9px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <FileCode size={13} />
                <span>SVG</span>
              </button>
            </div>

            <button
              disabled={exportingZip}
              onClick={downloadAssetZip}
              style={{
                width: '100%',
                background: '#E41540',
                border: 'none',
                color: '#ffffff',
                padding: '11px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(228, 21, 64, 0.35)',
              }}
            >
              <Archive size={15} />
              <span>{exportingZip ? 'Packaging ZIP...' : 'Download All Assets (ZIP)'}</span>
            </button>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '6px' }}>
              Includes favicons, app icons, and HTML snippet
            </div>
          </section>

        </aside>

      </div>

    </div>
  )
}
