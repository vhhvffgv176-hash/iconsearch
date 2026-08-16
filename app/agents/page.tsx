import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  Braces,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  FolderHeart,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { ICONIFY_COLLECTION_COUNT, SEARCHABLE_ICON_COUNT } from '../../data/library-catalog'
import { createPageMetadata, SITE_URL } from '../../lib/seo'
import CopyInstallCommand from './CopyInstallCommand'
import styles from './agents.module.css'

const installCommand = 'codex mcp add iconsearch -- npx -y @iconsearch/mcp-server'
const npmPackageUrl = 'https://www.npmjs.com/package/@iconsearch/mcp-server'
const packageVersion = '0.2.0'

export const metadata: Metadata = createPageMetadata({
  title: 'IconSearch MCP for Coding Agents — Available on npm',
  description: `Install the MIT-licensed IconSearch MCP server for semantic search, exact SVG retrieval, project-native icon memory, and repository audits across ${SEARCHABLE_ICON_COUNT.toLocaleString('en-US')} open-source icons.`,
  path: '/agents',
})

const manifestExample = `{
  "version": 1,
  "style": {
    "preferredLibraries": ["lucide"],
    "defaultSize": 20,
    "color": "currentColor",
    "strokeWidth": 2
  },
  "icons": {
    "billing-history": {
      "library": "lucide",
      "name": "receipt-text",
      "path": ".iconsearch/icons/billing-history.svg",
      "checksum": "sha256:…"
    }
  }
}`

export default function AgentsPage() {
  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'IconSearch MCP Server',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Windows, macOS, Linux',
            url: `${SITE_URL}/agents`,
            downloadUrl: npmPackageUrl,
            softwareVersion: packageVersion,
            license: 'https://opensource.org/license/mit',
            description: 'An MCP icon design system for coding agents.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <section className={styles.hero}>
        <div className={styles.heroMeta}>
          <div className={styles.eyebrow}><Sparkles size={16} /> Icon systems for coding agents</div>
          <a className={styles.releaseBadge} href={npmPackageUrl} target="_blank" rel="noopener noreferrer">
            <span /> Available on npm · v{packageVersion} <ExternalLink size={13} />
          </a>
        </div>
        <h1>Give your agent an icon system—not another guess.</h1>
        <p className={styles.heroLead}>
          Search {SEARCHABLE_ICON_COUNT.toLocaleString('en-US')} production-ready icons across {ICONIFY_COLLECTION_COUNT} collections,
          save approved SVGs with your code, and keep every screen visually consistent.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="#install">Install the MCP server <ArrowRight size={17} /></Link>
          <Link className={styles.secondaryAction} href="/docs/agents">Read the setup guide</Link>
          <a className={styles.secondaryAction} href={npmPackageUrl} target="_blank" rel="noopener noreferrer">
            View npm package <ExternalLink size={15} />
          </a>
        </div>

        <div className={styles.agentPreview} aria-label="IconSearch agent workflow preview">
          <div className={styles.promptPanel}>
            <span className={styles.avatar}><Bot size={20} /></span>
            <div>
              <small>You</small>
              <p>Build the billing settings screen using our approved icon system.</p>
            </div>
          </div>
          <div className={styles.memoryPanel}>
            <div className={styles.memoryStatus}><span /> IconSearch project memory loaded</div>
            <Assignment icon={<FileSearch size={21} />} name="billing-history" value="Lucide / receipt-text" />
            <Assignment icon={<Sparkles size={21} />} name="automations" value="Lucide / sparkles" />
            <Assignment icon={<Bot size={21} />} name="agent-access" value="Lucide / bot" />
          </div>
        </div>
      </section>

      <section className={styles.valueGrid} aria-label="IconSearch agent capabilities">
        <ValueCard icon={<Search />} title="Search by intent">
          Ask for “quiet empty state” or “billing history.” Deterministic concept ranking translates UI intent into useful candidates.
        </ValueCard>
        <ValueCard icon={<FolderHeart />} title="Remember every choice">
          Version-controlled semantic assignments prevent agents from choosing a different icon on every screen.
        </ValueCard>
        <ValueCard icon={<ShieldCheck />} title="Audit before shipping">
          Detect missing managed files, checksum drift, inline SVGs, unmanaged assets, and mixed icon packages.
        </ValueCard>
      </section>

      <section className={styles.workflow} id="install">
        <div>
          <div className={styles.sectionLabel}>One command, ten MCP tools</div>
          <h2>Your agent gets an icon workflow—not another search box.</h2>
          <ol className={styles.workflowList}>
            <li><strong>Read</strong> approved project icons and visual rules.</li>
            <li><strong>Search</strong> IconSearch using semantic UI intent.</li>
            <li><strong>Retrieve</strong> exact sanitized SVG and attribution.</li>
            <li><strong>Save</strong> it under a stable semantic name.</li>
            <li><strong>Audit</strong> the repository before the UI ships.</li>
          </ol>
        </div>
        <div className={styles.terminal}>
          <div className={styles.terminalBar}><span /><span /><span /></div>
          <code>{installCommand}</code>
          <CopyInstallCommand command={installCommand} />
          <p>
            Published on npm as <a href={npmPackageUrl} target="_blank" rel="noopener noreferrer">@iconsearch/mcp-server</a> under the MIT License.
            Requires Node.js 20 or newer. Account connection uses a revocable browser device flow—no API key needs to be committed.
          </p>
        </div>
      </section>

      <section className={styles.manifestSection}>
        <div className={styles.manifestCopy}>
          <div className={styles.sectionLabel}>Project-native memory</div>
          <h2>Your design decisions live with your code.</h2>
          <p>
            <code>iconsearch.json</code> is readable, reviewable, and portable. Humans approve it, agents follow it,
            and CI can audit it. Managed SVGs live beneath <code>.iconsearch/icons</code>.
          </p>
          <Link href="/docs/agents#project-manifest">See the manifest format <ArrowRight size={16} /></Link>
        </div>
        <pre className={styles.manifestCode}><code>{manifestExample}</code></pre>
      </section>

      <section className={styles.securityStrip}>
        <CheckCircle2 size={24} />
        <div><strong>Local-first and bounded by design.</strong><span>Audits are read-only. Saves stay inside the validated project root and refuse symlink escapes.</span></div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <div className={styles.sectionLabel}>Make generated UI feel designed</div>
          <h2>Give your coding agent better visual judgment.</h2>
        </div>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="#install"><Terminal size={17} /> Install now</Link>
          <Link className={styles.darkSecondaryAction} href="/docs/agents"><Braces size={17} /> Open guide</Link>
        </div>
      </section>
    </main>
  )
}

function Assignment({ icon, name, value }: { icon: ReactNode; name: string; value: string }) {
  return <div className={styles.assignment}><span>{icon}</span><code>{name}</code><small>{value}</small></div>
}

function ValueCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <article><span className={styles.valueIcon}>{icon}</span><h2>{title}</h2><p>{children}</p></article>
}
