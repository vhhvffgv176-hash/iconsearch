import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ExternalLink, ShieldCheck, Terminal } from 'lucide-react'
import { createPageMetadata } from '../../../lib/seo'
import styles from './agents-docs.module.css'

const apiKeyInstallCommand = 'codex mcp add iconsearch --env ICONSEARCH_TOKEN=YOUR_API_KEY -- npx -y @iconsearch/mcp-server'
const codexCheckCommands = `codex --version
codex mcp list`
const windowsNpxLookupCommand = 'where.exe npx'
const windowsOpenConfigCommand = `New-Item -ItemType Directory -Force "$env:USERPROFILE\\.codex" | Out-Null
notepad "$env:USERPROFILE\\.codex\\config.toml"`
const windowsCodexConfig = `[mcp_servers.iconsearch]
command = "C:/Program Files/nodejs/npx.cmd"
args = ["-y", "@iconsearch/mcp-server"]

[mcp_servers.iconsearch.env]
ICONSEARCH_TOKEN = "PASTE_YOUR_NEW_KEY_HERE"`
const portableCodexConfig = `[mcp_servers.iconsearch]
command = "npx"
args = ["-y", "@iconsearch/mcp-server"]

[mcp_servers.iconsearch.env]
ICONSEARCH_TOKEN = "PASTE_YOUR_NEW_KEY_HERE"`
const readOnlyTestPrompt = 'Use IconSearch to find five icons for settings navigation. Do not change any files.'
const npmPackageUrl = 'https://www.npmjs.com/package/@iconsearch/mcp-server'
const packageVersion = '0.2.0'
const verificationCommands = 'npm view @iconsearch/mcp-server version license'
const genericConfig = `{
  "mcpServers": {
    "iconsearch": {
      "command": "npx",
      "args": ["-y", "@iconsearch/mcp-server"],
      "env": { "ICONSEARCH_TOKEN": "YOUR_API_KEY" }
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
        <a className={styles.releaseBanner} href={npmPackageUrl} target="_blank" rel="noopener noreferrer">
          <span><CheckCircle2 size={17} /> Version {packageVersion} is live on npm under the MIT License</span>
          View package <ExternalLink size={14} />
        </a>
      </header>

      <div className={styles.layout}>
        <nav className={styles.toc} aria-label="Guide sections">
          <strong>On this page</strong>
          <a href="#quickstart">Quickstart</a>
          <a href="#codex-setup">Codex setup options</a>
          <a href="#how-it-works">How it works</a>
          <a href="#other-clients">Other MCP clients</a>
          <a href="#workflow">Recommended workflow</a>
          <a href="#tools">Tools</a>
          <a href="#project-manifest">Project manifest</a>
          <a href="#security">Security</a>
          <a href="#verification">Verify setup</a>
          <a href="#troubleshooting">Troubleshooting</a>
        </nav>

        <article className={styles.content}>
          <GuideSection id="quickstart" number="01" title="Generate your private API key">
            <p>
              Requirements: Node.js 20 or newer, an MCP-capable Codex installation, and an IconSearch account.
              First <Link href="/account#api-keys">generate an API key from your account</Link>. IconSearch shows the complete key only once and gives you a ready-to-copy setup command.
            </p>
            <ol>
              <li>Sign in on the account page and press <strong>Generate API key</strong>.</li>
              <li>Copy the new key immediately. It begins with <code>ics_live_</code>.</li>
              <li>Choose one Codex setup option below. You do not need to use both.</li>
            </ol>
            <p className={styles.note}>
              Treat the key like a password. Never put it in a project, GitHub commit, screenshot, chat message, or support ticket.
            </p>
          </GuideSection>

          <GuideSection id="codex-setup" number="02" title="Connect Codex — choose one setup option">
            <p>
              Both options create the same global Codex connection. Set it up once on each computer, not once for every project.
              You only need to edit it later if you replace or revoke the API key.
            </p>

            <div className={styles.methodCard}>
              <span className={styles.methodLabel}>Option A · easiest when the Codex CLI works</span>
              <h3>Use one command in PowerShell or Terminal</h3>
              <p>
                Use this option only when your computer recognizes the <code>codex</code> command. Run these commands in the Windows
                PowerShell app, macOS Terminal, or your IDE terminal — not inside a Codex chat.
              </p>
              <ol>
                <li>Open PowerShell or Terminal.</li>
                <li>Run <code>codex --version</code>. If you see a version number, continue. If you see “not recognized,” use Option B.</li>
                <li>Copy the complete command from your IconSearch account. It already contains your real key. If you use the example below, replace <code>YOUR_API_KEY</code>.</li>
              </ol>
              <CodeBlock label="PowerShell or Terminal" value={apiKeyInstallCommand} />
              <ol start={4}>
                <li>Run <code>codex mcp list</code>. The list should contain <code>iconsearch</code>.</li>
                <li>Fully close Codex, including every open Codex window, then reopen it.</li>
                <li>Start a new task, type <code>/mcp</code>, and confirm IconSearch appears.</li>
              </ol>
              <CodeBlock label="Optional checks" value={codexCheckCommands} />
            </div>

            <div className={styles.methodCard}>
              <span className={styles.methodLabel}>Option B · use when “codex is not recognized”</span>
              <h3>Edit the global Codex config file</h3>
              <p>
                This is the reliable Windows setup for the Codex desktop app. The file belongs to Codex on your computer;
                it does not belong inside your website or another project.
              </p>
              <ol>
                <li>Open Windows PowerShell.</li>
                <li>Find the exact Node.js launcher path by running the command below. Use the result ending in <code>npx.cmd</code>.</li>
              </ol>
              <CodeBlock label="Windows PowerShell" value={windowsNpxLookupCommand} />
              <ol start={3}>
                <li>Open the global Codex configuration file with this command. If Notepad asks to create it, choose <strong>Yes</strong>.</li>
              </ol>
              <CodeBlock label="Windows PowerShell" value={windowsOpenConfigCommand} />
              <ol start={4}>
                <li>Keep any settings already in the file. Add the block below at the end.</li>
                <li>Replace <code>PASTE_YOUR_NEW_KEY_HERE</code> with the complete key from your IconSearch account.</li>
                <li>If <code>where.exe npx</code> showed a different location, replace the <code>command</code> path. Use forward slashes inside TOML.</li>
              </ol>
              <CodeBlock label="Windows · ~/.codex/config.toml" value={windowsCodexConfig} />
              <p className={styles.note}>
                This local config file now contains your private key. Do not upload, sync, share, or commit the file.
              </p>
              <ol start={7}>
                <li>Make sure the file contains only one <code>[mcp_servers.iconsearch]</code> block, then save it.</li>
                <li>Fully close every Codex window and reopen Codex. Configuration is loaded when Codex starts.</li>
                <li>Start a new task, type <code>/mcp</code>, and confirm IconSearch appears.</li>
              </ol>

              <h3>macOS or Linux manual config</h3>
              <p>
                Open <code>~/.codex/config.toml</code> in a text editor and append this version. On these systems the command is normally just <code>npx</code>.
              </p>
              <CodeBlock label="macOS or Linux · ~/.codex/config.toml" value={portableCodexConfig} />
            </div>

            <h3>Safe first test</h3>
            <p>In a new Codex task, paste this prompt. It searches only and explicitly prevents file changes:</p>
            <CodeBlock label="Codex task" value={readOnlyTestPrompt} />
            <p className={styles.note}>
              Codex desktop, Codex CLI, and the Codex IDE extension share the global <code>~/.codex/config.toml</code> on the same computer.
              Do not add this block to every repository. See the{' '}
              <a href="https://developers.openai.com/codex/mcp/" target="_blank" rel="noreferrer">
                official Codex MCP documentation <ExternalLink size={13} />
              </a>.
            </p>
          </GuideSection>

          <GuideSection id="how-it-works" number="03" title="How the system works">
            <div className={styles.flowGrid}>
              <FlowItem title="1. Codex starts IconSearch">The npm package runs locally and tells Codex which icon tools are available.</FlowItem>
              <FlowItem title="2. Your key proves access">The private API key identifies your account. It can be revoked from the account page at any time.</FlowItem>
              <FlowItem title="3. The website answers">Search and exact-icon requests go to the authenticated IconSearch API, where access and daily usage are checked.</FlowItem>
              <FlowItem title="4. Decisions stay with the code">Approved SVGs and their semantic names are saved locally so every teammate and agent can reuse them.</FlowItem>
            </div>
          </GuideSection>

          <GuideSection id="other-clients" number="04" title="Configure another MCP client">
            <p>Use this standard stdio configuration when your client accepts JSON MCP server settings:</p>
            <CodeBlock value={genericConfig} />
            <p>
              Replace <code>YOUR_API_KEY</code> with the key shown once on your IconSearch account page. Keep this configuration outside your repository.{' '}
              Set <code>ICONSEARCH_PROJECT_ROOT</code> only if the client starts the server outside your repository.
              For local development, <code>ICONSEARCH_API_BASE</code> may use a loopback HTTP URL; every non-local endpoint must use HTTPS.
            </p>
          </GuideSection>

          <GuideSection id="workflow" number="05" title="Use the project-aware workflow">
            <ol>
              <li>Read <code>iconsearch_get_project_icons</code> before choosing a new icon.</li>
              <li>Reuse an existing semantic assignment when it already represents the requested purpose.</li>
              <li>Search with product intent such as “billing history” instead of guessing a package export.</li>
              <li>Retrieve the exact candidate and review its source and licence requirements.</li>
              <li>Save only after the icon is approved; then audit before shipping.</li>
            </ol>
          </GuideSection>

          <GuideSection id="tools" number="06" title="All ten available tools">
            <div className={styles.toolList}>
              <Tool name="iconsearch_start_sign_in">Start the secure browser device sign-in flow.</Tool>
              <Tool name="iconsearch_finish_sign_in">Finish an approved sign-in and store the revocable local session.</Tool>
              <Tool name="iconsearch_status">Check the account connection without exposing the token.</Tool>
              <Tool name="iconsearch_sign_out">Remove the locally saved IconSearch session.</Tool>
              <Tool name="iconsearch_get_project_icons">Read visual defaults and approved semantic icon assignments.</Tool>
              <Tool name="iconsearch_search">Search by intent, collection, style, licence safety, and page.</Tool>
              <Tool name="iconsearch_get_icon">Retrieve exact sanitized SVG plus source, author, and licence metadata.</Tool>
              <Tool name="iconsearch_save_project_icon">Save an approved SVG and update project memory. This changes files.</Tool>
              <Tool name="iconsearch_audit_project_icons">Report missing or changed managed files, inline SVGs, unmanaged assets, and mixed packages.</Tool>
              <Tool name="iconsearch_snippet">Create React, SVG, Vue, Svelte, Tailwind, or URL output for compatible workflows.</Tool>
            </div>
          </GuideSection>

          <GuideSection id="project-manifest" number="07" title="Project manifest">
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

          <GuideSection id="security" number="08" title="Security model">
            <div className={styles.securityGrid}>
              <SecurityItem title="Bounded writes">The save tool writes only the manifest and managed SVG directory inside a validated project root.</SecurityItem>
              <SecurityItem title="Symlink protection">Reads, writes, and audits refuse symlink traversal and filesystem-root projects.</SecurityItem>
              <SecurityItem title="Sanitized SVG">Scripts, embedded documents, event handlers, unsafe protocols, and external resources are rejected.</SecurityItem>
              <SecurityItem title="Revocable access">API keys are stored as unreadable fingerprints on the server, expire after 90 days, and can be revoked from your account.</SecurityItem>
              <SecurityItem title="Server-side limits">Authentication, plan access, and daily usage are checked before search or SVG retrieval.</SecurityItem>
              <SecurityItem title="No committed secrets">The project manifest stores icon decisions and checksums, never your API key.</SecurityItem>
            </div>
            <p className={styles.warning}>
              <ShieldCheck size={18} /> Review changes produced by any coding agent before committing or deploying them.
            </p>
          </GuideSection>

          <GuideSection id="verification" number="09" title="Verify that everything is working">
            <CodeBlock value={verificationCommands} />
            <ol>
              <li>The npm command should report version <code>{packageVersion}</code> and licence <code>MIT</code>.</li>
              <li>If you used Option A, <code>codex mcp list</code> should include a server named <code>iconsearch</code>. If you used Option B, check with <code>/mcp</code> in a new Codex task.</li>
              <li>Ask Codex to call <code>iconsearch_status</code>; it should report <code>connected: true</code> without showing your key.</li>
              <li>Ask for “billing history.” Search should return relevant candidates such as a receipt or history icon.</li>
              <li>Return to your account page. The key should now say <strong>Last used</strong> with a recent date.</li>
              <li>In a test repository, approve one icon, save it, and confirm that only <code>iconsearch.json</code> and <code>.iconsearch/icons</code> changed.</li>
              <li>Run <code>iconsearch_audit_project_icons</code> and review the report before committing.</li>
            </ol>
          </GuideSection>

          <GuideSection id="troubleshooting" number="10" title="Troubleshooting">
            <dl className={styles.faq}>
              <dt>PowerShell says <code>codex</code> is not recognized.</dt>
              <dd>The Codex CLI is not available in that terminal. Use the manual global config in Option B; the desktop app can still load IconSearch from that file.</dd>
              <dt>The <code>npx</code> command is missing or fails to start.</dt>
              <dd>Install Node.js 20 or newer, reopen the terminal, and run the install command again.</dd>
              <dt>IconSearch does not appear after I changed <code>config.toml</code>.</dt>
              <dd>Check for duplicate IconSearch blocks or a wrong <code>npx.cmd</code> path, save the file, fully exit Codex, and start a new task after reopening it.</dd>
              <dt>The server says the Agent API is not configured.</dt>
              <dd>The production Supabase project is missing the latest agent-usage migration. Apply it, then redeploy the website.</dd>
              <dt>Search says authentication is required.</dt>
              <dd>Generate a new API key and copy the complete setup command again. If you revoked or replaced a key, restart Codex after updating the configuration.</dd>
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

function CodeBlock({ value, label }: { value: string; label?: string }) {
  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeBar}><Terminal size={14} /><span>{label ?? (value.startsWith('{') ? 'configuration' : 'terminal')}</span></div>
      <pre><code>{value}</code></pre>
    </div>
  )
}

function Tool({ name, children }: { name: string; children: ReactNode }) {
  return <div><code>{name}</code><p>{children}</p></div>
}

function SecurityItem({ title, children }: { title: string; children: ReactNode }) {
  return <div><CheckCircle2 size={18} /><strong>{title}</strong><p>{children}</p></div>
}

function FlowItem({ title, children }: { title: string; children: ReactNode }) {
  return <div><strong>{title}</strong><p>{children}</p></div>
}
