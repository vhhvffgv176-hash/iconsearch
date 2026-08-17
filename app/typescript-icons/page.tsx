import { icons } from '../../lib/icons'
import Link from 'next/link'
import { createPageMetadata } from '../../lib/seo'

export const metadata = createPageMetadata({
  title: 'TypeScript Icons Guide (2026) — Strict Typing & Polymorphic SVG Wrappers',
  description: 'Master type-safe SVG icons in TypeScript. Learn prop interfaces, generic polymorphic Icon components, verbatimModuleSyntax, and VS Code autocomplete ergonomics.',
  path: '/typescript-icons',
  type: 'article',
})

const typescriptFaqs = [
  {
    q: 'What is the standard TypeScript type for React SVG icon components?',
    a: 'Most modern libraries export a dedicated prop interface (e.g., `LucideProps` from lucide-react) or extend standard SVG component props: `React.ComponentPropsWithoutRef<"svg"> & { size?: number | string; strokeWidth?: number | string }`. This ensures full compatibility with standard HTML SVG attributes.',
  },
  {
    q: 'How does verbatimModuleSyntax affect SVG icon imports in TypeScript 5+?',
    a: 'With `verbatimModuleSyntax: true` enabled in tsconfig.json, TypeScript strictly distinguishes type imports from runtime value imports. Value imports like `import { Home } from "lucide-react"` will be preserved as runtime JS, while type imports like `import type { LucideIcon } from "lucide-react"` are completely stripped at compile time.',
  },
  {
    q: 'How do I build a generic dynamic Icon component in TypeScript without bundling all icons?',
    a: 'Define an explicit string union type (e.g., `type IconName = "home" | "settings" | "user"`) and map each key to a statically imported component in an internal map object. TypeScript will provide strict compile-time autocomplete and prevent invalid string keys.',
  },
  {
    q: 'Why do some legacy icon packages have missing or broken .d.ts declaration files?',
    a: 'Older libraries published before the ESM migration frequently shipped CommonJS-only code or generated declarations with ambient namespaces that fail under strict modern `moduleResolution: "bundler"` or `"node16"`. All libraries highlighted on this page ship native .d.ts or .d.mts declarations.',
  },
]

export default function TypescriptIconsPage() {
  const tsIcons = icons.filter((i) => i.typescript)
  const nonTsIcons = icons.filter((i) => !i.typescript)

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: typescriptFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 48px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />

      {/* Header */}
      <section style={{ marginBottom: '48px', paddingBottom: '48px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '12px', color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '2px', marginBottom: '12px' }}>
          TYPESCRIPT ARCHITECTURE
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.15, marginBottom: '20px' }}>
          TypeScript Icons: <span style={{ color: 'var(--accent)' }}>Strict Typing & Polymorphic Wrappers</span> (2026)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '17px', maxWidth: '780px', lineHeight: 1.8, marginBottom: '20px' }}>
          Eliminate runtime SVG rendering bugs with strict TypeScript interfaces. 
          Discover how typed icon properties, generic polymorphic components, and IDE autocompletion improve developer productivity.
        </p>
        <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: '8px', padding: '14px 18px', display: 'inline-block' }}>
          <span style={{ fontSize: '13px', color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
            100% Type-Safe: {tsIcons.length} verified libraries ship native .d.ts declarations.
          </span>
        </div>
      </section>

      {/* Polymorphic Wrapper Guide */}
      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: 'var(--text)' }}>
          1. Building a Production Type-Safe Icon Wrapper
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.8, marginBottom: '20px' }}>
          When architecting a frontend design system, wrap your icon components in a typed polymorphic wrapper. 
          This centralizes default sizing, accessibility attributes (<code>aria-hidden</code>), and theme classes:
        </p>

        <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', marginBottom: '24px', overflowX: 'auto' }}>
          <pre style={{ margin: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--green)', lineHeight: 1.6 }}>
{`// components/ui/icon.tsx
import React from 'react'
import { LucideIcon, LucideProps } from 'lucide-react'

export interface IconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon
  label?: string // Optional accessible label
  className?: string
}

export function AppIcon({ icon: IconComponent, label, className = '', size = 20, ...rest }: IconProps) {
  return (
    <IconComponent
      size={size}
      className={className}
      aria-hidden={!label}
      aria-label={label}
      role={label ? 'img' : 'presentation'}
      {...rest}
    />
  )
}

// Usage in your React / Next.js app:
// <AppIcon icon={Home} size={24} className="text-blue-500" label="Go to homepage" />`}
          </pre>
        </div>
      </section>

      {/* TypeScript Benefits Grid */}
      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', color: 'var(--text)' }}>
          Core Advantages of Native TypeScript Support
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { title: 'IntelliSense Autocomplete', desc: 'VS Code and JetBrains IDEs instantly suggest symbol names as you type, reducing typos and API lookups.' },
            { title: 'Prop Type Validation', desc: 'Catch invalid size strings, missing colors, or unsupported SVG stroke values at build-time.' },
            { title: 'Safe System Refactoring', desc: 'Rename and migrate icon primitives across hundreds of files safely with automated TypeScript refactoring.' },
            { title: 'Inline JSDoc Documentation', desc: 'Hover over any icon component in your IDE to see its bounding box, stroke defaults, and tags.' },
          ].map((item) => (
            <div key={item.title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)', fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>
                ✓ {item.title}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Verified TypeScript Libraries */}
      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', color: 'var(--text)' }}>
          Verified TypeScript Icon Libraries ({tsIcons.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {tsIcons.map((icon, index) => (
            <div key={icon.slug} style={{ background: 'var(--bg-card)', padding: '28px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace', minWidth: '28px' }}>
                    #{index + 1}
                  </span>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{icon.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--cyan)', background: '#22d3ee15', border: '1px solid var(--cyan)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                    TypeScript ✓
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>⭐ {icon.stars.toLocaleString()}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>◆ {icon.iconCount.toLocaleString()} icons</span>
                  <span style={{ fontSize: '11px', color: 'var(--green)', background: '#4ade8015', border: '1px solid var(--green)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                    {icon.license}
                  </span>
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.7, marginBottom: '16px', maxWidth: '700px' }}>
                {icon.description}
              </p>

              <pre style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--green)', marginBottom: '16px', overflowX: 'auto' }}>
                {icon.installCommand}
              </pre>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href={`/icons/${icon.slug}`} style={{ background: 'var(--accent)', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
                  Full Guide & Catalog →
                </Link>
                {icon.treeshakable && <span style={{ fontSize: '12px', color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>✓ Tree-shakable</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Non-TS notice */}
      {nonTsIcons.length > 0 && (
        <section style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '16px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '1px', marginBottom: '16px' }}>
            LIBRARIES REQUIRING MANUAL TYPE DEFINITIONS ({nonTsIcons.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {nonTsIcons.map((icon) => (
              <div key={icon.slug} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '14px', marginRight: '12px' }}>{icon.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{icon.iconCount.toLocaleString()} icons · {icon.license}</span>
                </div>
                <Link href={`/icons/${icon.slug}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
                  View Catalog →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section style={{ marginBottom: '56px', borderTop: '1px solid var(--border)', paddingTop: '48px' }}>
        <div style={{ fontSize: '12px', color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '2px', marginBottom: '12px' }}>
          FREQUENTLY ASKED QUESTIONS
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', color: 'var(--text)' }}>
          TypeScript & SVG Icons FAQ
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {typescriptFaqs.map((faq, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px', color: 'var(--text)' }}>
                {faq.q}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.8, margin: 0 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation */}
      <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Explore Next.js & React Guides</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Learn how to render typed icons in Next.js Server Components and React.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/react-icons" style={{ background: 'var(--accent)', color: '#fff', padding: '10px 18px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            React Guide →
          </Link>
          <Link href="/nextjs-icons" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 18px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
            Next.js Guide →
          </Link>
        </div>
      </section>
    </main>
  )
}
