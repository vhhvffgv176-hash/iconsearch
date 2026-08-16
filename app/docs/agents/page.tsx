import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ExternalLink, ShieldCheck, Terminal } from 'lucide-react'
import { createPageMetadata } from '../../../lib/seo'
import CopyInstallCommand from '../../agents/CopyInstallCommand'
import styles from './agents-docs.module.css'

const installCommand = 'codex mcp add iconsearch -- npx -y @iconsearch/mcp-server'
const genericConfig = `{
  "mcpServers": {
    "iconsearch": {
      "command": "npx",
      "args": ["-y", "@iconsearch/mcp-server"]
    }
  }
}`
const manifestExample = `{
  "version": 1,
  "style": {
    "preferredLibraries": ["lucide"],
    "defaultSize": 20,
    "color": "currentColor",
    "strokeWidth": 2
  },
  "icons": {}
}`

export const metadata: Metadata = createPageMetadata({
  title: 'IconSearch MCP Setup Guide for Coding Agents',
  description: 'Install IconSearch for Codex or another MCP client, connect a revocable account, save approved SVGs, and audit a repository icon system.',
  path: '/docs/agents',
})

export default function AgentGuidePage() {
  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/agents"><ArrowLeft size={15} /> Icons for agents</Link>
      <header className={styles.header}>
        <span className={styles.eyebrow}>IconSearch MCP guide</span>
        <h1>Give your coding agent a consistent icon workflow.</h1>
        <p>
          Connect once, search by interface intent, retrieve the exact SVG with licence metadata,
          and keep approved decisions in the repository.
        </p>
      </header>

      <div className={styles.layout}>
        <nav className={styles.toc} aria-label="Guide sections">
          <strong>On this page</strong>
          <a href="#quickstart">Quickstart</a>
          <a href="#other-clients">Other MCP clients</a>
          <a href="#workflow">Recommended workflow</a>
          <a href="#tools">Tools</a>
          <a href="#project-manifest">Project manifest</a>
          <a href="#security">Security</a>
          <a href="#troubleshooting">Troubleshooting</a>
        </nav>

        <article className={styles.content}>
          <GuideSection id="quickstart" number="01" title="Install in Codex">
            <p>Requirements: Node.js 20 or newer, an MCP-capable Codex installation, and an IconSearch account.</p>
            <CodeBlock value={installCommand} copy />
            <ol>
              <li>Restart Codex, then ask it to call <code>iconsearch_status</code>.</li>
              <li>If disconnected, call <code>iconsearch_start_sign_in</code> and open the returned browser link.</li>
              <li>Approve access, then call <code>iconsearch_finish_sign_in</code> with the device code.</li>
              <li>Run <code>codex mcp list</code> in a terminal if you need to confirm the server configuration.</li>
            </ol>
            <p className={styles.note}>
              Codex stores MCP configuration in <code>~/.codex/config.toml</code>. See the{' '}
              <a href="https://developers.openai.com/codex/mcp/" target="_blank" rel="noreferrer">
                official Codex MCP documentation <ExternalLink size={13} />
              </a>.
            </p>
          </GuideSection>

          <GuideSection id="other-clients" number="02" title="Configure another MCP client">
            <p>Use this standard stdio configuration when your client accepts JSON MCP server settings:</p>
            <CodeBlock value={genericConfig} />
            <p>
              Set <code>ICONSEARCH_PROJECT_ROOT</code> only if the client starts the server outside your repository.
              For local development, <code>ICONSEARCH_API_BASE</code> may use a loopback HTTP URL; every non-local endpoint must use HTTPS.
            </p>
          </GuideSection>

          <GuideSection id="workflow" number="03" title="Use the project-aware workflow">
            <ol>
              <li>Read <code>iconsearch_get_project_icons</code> before choosing a new icon.</li>
              <li>Reuse an existing semantic assignment when it already represents the requested purpose.</li>
              <li>Search with product intent such as “billing history” instead of guessing a package export.</li>
              <li>Retrieve the exact candidate and review its source and licence requirements.</li>
              <li>Save only after the icon is approved; then audit before shipping.</li>
            </ol>
          </GuideSection>

          <GuideSection id="tools" number="04" title="Available tools">
            <div className={styles.toolList}>
              <Tool name="iconsearch_get_project_icons">Read visual defaults and approved semantic icon assignments.</Tool>
              <Tool name="iconsearch_search">Search by intent, collection, style, licence safety, and page.</Tool>
              <Tool name="iconsearch_get_icon">Retrieve exact sanitized SVG plus source, author, and licence metadata.</Tool>
              <Tool name="iconsearch_save_project_icon">Save an approved SVG and update project memory. This changes files.</Tool>
              <Tool name="iconsearch_audit_project_icons">Report missing or changed managed files, inline SVGs, unmanaged assets, and mixed packages.</Tool>
              <Tool name="iconsearch_status">Check the account connection without exposing the token.</Tool>
            </div>
          </GuideSection>

          <GuideSection id="project-manifest" number="05" title="Project manifest">
            <p>
              The first save creates <code>iconsearch.json</code> and stores sanitized files under{' '}
              <code>.iconsearch/icons</code>. Commit both so teammates and agents share the same decisions.
            </p>
            <CodeBlock value={manifestExample} />
            <p>
              Each saved icon records a SHA-256 checksum, original library and name, source attribution,
              licence metadata, and the time it was approved.
            </p>
          </GuideSection>

          <GuideSection id="security" number="06" title="Security model">
            <div className={styles.securityGrid}>
              <SecurityItem title="Bounded writes">The save tool writes only the manifest and managed SVG directory inside a validated project root.</SecurityItem>
              <SecurityItem title="Symlink protection">Reads, writes, and audits refuse symlink traversal and filesystem-root projects.</SecurityItem>
              <SecurityItem title="Sanitized SVG">Scripts, embedded documents, event handlers, unsafe protocols, and external resources are rejected.</SecurityItem>
              <SecurityItem title="Revocable access">Browser device sign-in stores a local product token; sign out removes that saved session.</SecurityItem>
            </div>
            <p className={styles.warning}>
              <ShieldCheck size={18} /> Review changes produced by any coding agent before committing or deploying them.
            </p>
          </GuideSection>

          <GuideSection id="troubleshooting" number="07" title="Troubleshooting">
            <dl className={styles.faq}>
              <dt>The server says the Agent API is not configured.</dt>
              <dd>The production Supabase project is missing the latest agent-usage migration. Apply it, then redeploy the website.</dd>
              <dt>Search says authentication is required.</dt>
              <dd>Run the start and finish sign-in tools, or provide <code>ICONSEARCH_TOKEN</code> through the MCP client environment.</dd>
              <dt>The server cannot find my project.</dt>
              <dd>Start the MCP client from the repository or set <code>ICONSEARCH_PROJECT_ROOT</code> to an existing project directory.</dd>
              <dt>An SVG could not be saved.</dt>
              <dd>The icon may contain active or external content, the semantic name may not be kebab-case, or the destination may already exist.</dd>
            </dl>
          </GuideSection>
        </article>
      </div>
    </main>
  )
}

function GuideSection({ id, number, title, children }: { id: string; number: string; title: string; children: ReactNode }) {
  return <section className={styles.section} id={id}><span>{number}</span><h2>{title}</h2>{children}</section>
}

function CodeBlock({ value, copy = false }: { value: string; copy?: boolean }) {
  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeBar}><Terminal size={14} /><span>{value.startsWith('{') ? 'configuration' : 'terminal'}</span></div>
      <pre><code>{value}</code></pre>
      {copy ? <CopyInstallCommand command={value} /> : null}
    </div>
  )
}

function Tool({ name, children }: { name: string; children: ReactNode }) {
  return <div><code>{name}</code><p>{children}</p></div>
}

function SecurityItem({ title, children }: { title: string; children: ReactNode }) {
  return <div><CheckCircle2 size={18} /><strong>{title}</strong><p>{children}</p></div>
}
