import { icons } from '../../lib/icons'
import Link from 'next/link'
import { createPageMetadata } from '../../lib/seo'

export const metadata = createPageMetadata({
  title: 'Vue 3 Icons Guide (2026) — Composition API, Nuxt 3 & Vite Optimization',
  description: 'In-depth guide to using SVG icons in Vue 3 and Nuxt 3. Compare Lucide Vue Next, Tabler Icons Vue, and Remix Icon with dynamic component rendering and Vite tree-shaking.',
  path: '/vue-icons',
  type: 'article',
})

const vueFaqs = [
  {
    q: 'How do I use Lucide icons in Vue 3 with script setup?',
    a: 'Install `lucide-vue-next` and import icons directly inside your `<script setup>` block: `import { Home, Settings } from "lucide-vue-next"`. You can render `<Home :size="20" class="text-emerald-500" />` with full TypeScript prop validation.',
  },
  {
    q: 'How do dynamic icon components work in Vue 3 without bundling unused icons?',
    a: 'In Vue 3, avoid dynamic global registrations. Instead, use dynamic component syntax `<component :is="resolvedIcon" />` with shallowRef or explicit lookup maps containing only the icons used in your application.',
  },
  {
    q: 'Are Vue 3 icon packages compatible with Nuxt 3 SSR?',
    a: 'Yes. Packages like `lucide-vue-next` and `@tabler/icons-vue` render static SVG markup that compiles on the server during Nuxt 3 SSR without hydration mismatch errors or client-side layout shifts.',
  },
  {
    q: 'How do I customize stroke width and default icon props globally in Vue 3?',
    a: 'You can create a custom Vue 3 plugin using `app.provide` or wrap the icon library in a custom `AppIcon.vue` base component that passes default `:stroke-width="1.75"` and `:size="20"` to child icon components.',
  },
]

export default function VueIconsPage() {
  const vueIcons = icons.filter((i) => i.frameworks.includes('vue'))

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: vueFaqs.map((faq) => ({
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
          VUE 3 ARCHITECTURE
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.15, marginBottom: '20px' }}>
          Vue 3 Icons: <span style={{ color: 'var(--accent)' }}>Composition API & Nuxt 3 Guide</span> (2026)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '17px', maxWidth: '780px', lineHeight: 1.8, marginBottom: '20px' }}>
          Integrate high-performance SVG icon libraries into Vue 3 and Nuxt 3 applications. 
          Master <code>&lt;script setup&gt;</code> syntax, Vite tree-shaking, and SSR-safe dynamic components.
        </p>
        <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: '8px', padding: '14px 18px', display: 'inline-block' }}>
          <span style={{ fontSize: '13px', color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
            Top Recommendation: lucide-vue-next for general Vue 3 / Nuxt 3 apps.
          </span>
        </div>
      </section>

      {/* Vue 3 Code Patterns */}
      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: 'var(--text)' }}>
          1. Vue 3 Composition API & Dynamic Component Patterns
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.8, marginBottom: '20px' }}>
          In modern Vue 3, icons are imported as functional SFC components that accept reactive props:
        </p>

        <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', marginBottom: '24px', overflowX: 'auto' }}>
          <pre style={{ margin: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--green)', lineHeight: 1.6 }}>
{`<!-- components/UserCard.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { User, Mail, CheckCircle2 } from 'lucide-vue-next'

const isVerified = ref(true)
</script>

<template>
  <div class="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900">
    <User :size="24" class="text-zinc-400" />
    <div class="flex-1">
      <div class="flex items-center gap-1.5 font-medium">
        <span>Alex Morgan</span>
        <CheckCircle2 v-if="isVerified" :size="16" class="text-emerald-400" />
      </div>
      <p class="text-xs text-zinc-500">Engineering Lead</p>
    </div>
  </div>
</template>`}
          </pre>
        </div>
      </section>

      {/* Verified Vue 3 Libraries */}
      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', color: 'var(--text)' }}>
          Verified Vue 3 Icon Libraries ({vueIcons.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {vueIcons.map((icon, index) => (
            <div key={icon.slug} style={{ background: 'var(--bg-card)', padding: '28px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace', minWidth: '28px' }}>
                    #{index + 1}
                  </span>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{icon.name}</h3>
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
                {icon.typescript && <span style={{ fontSize: '12px', color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>✓ TypeScript</span>}
                {icon.treeshakable && <span style={{ fontSize: '12px', color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>✓ Tree-shakable</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ marginBottom: '56px', borderTop: '1px solid var(--border)', paddingTop: '48px' }}>
        <div style={{ fontSize: '12px', color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '2px', marginBottom: '12px' }}>
          FREQUENTLY ASKED QUESTIONS
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', color: 'var(--text)' }}>
          Vue 3 & Nuxt 3 Icon FAQ
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {vueFaqs.map((faq, i) => (
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
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Explore Svelte & Framework Guides</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Discover Svelte 5, React, and TypeScript icon integrations.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/svelte-icons" style={{ background: 'var(--accent)', color: '#fff', padding: '10px 18px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            Svelte Guide →
          </Link>
          <Link href="/react-icons" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 18px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
            React Guide →
          </Link>
        </div>
      </section>
    </main>
  )
}
