import { createPageMetadata } from '../../lib/seo'

export const metadata = createPageMetadata({
  title: 'Privacy Policy — IconSearch',
  description: 'Privacy policy for IconSearch. Learn how we collect, use, and protect your data when you use iconsearch.info.',
  path: '/privacy-policy',
})

export default function PrivacyPolicyPage() {
  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 48px' }}>

      <section style={{ marginBottom: '48px', paddingBottom: '48px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '12px', color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '2px', marginBottom: '12px' }}>
          LEGAL
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px' }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
          Last updated: July 24, 2026
        </p>
      </section>

      <article style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {[
          {
            title: '1. Introduction',
            content: 'Welcome to IconSearch ("we", "our", or "us"). IconSearch is an open-source icon discovery engine and developer productivity platform. This Privacy Policy explains how we collect, use, store, and protect information when you visit iconsearch.info or connect using any of our 18 developer extensions and plugins. By using the Platform, you agree to the practices described in this policy.'
          },
          {
            title: '2. Information We Collect',
            content: 'We adhere to strict data minimization principles. The types of data we collect include:\n\n• Account Data: When you sign up or log in via Supabase Authentication (Email/Password or Google OAuth), we store your email address, unique user ID, avatar URL, and authentication timestamps.\n\n• Entitlement & Founder Access Claims: When you claim Founder access or product entitlements, we store your user ID, product key (e.g. vscode-extension, figma-plugin), claim status, and timestamp.\n\n• Device Authorization Data (RFC 8628): When you approve an extension or plugin connection, we generate an 8-character user code and store ONLY a cryptographic SHA-256 hash of the session token combined with a server-side pepper (DEVICE_TOKEN_PEPPER). We never store raw session tokens on our servers.\n\n• Cloud Sync Data: If you choose to save custom icon packs or style presets to your account, we store your custom pack names, icon lists, and styling parameters (size, stroke weight, color) in our Supabase database.\n\n• Rate Limiting & Security Logs: To prevent abuse, API flooding, and automated scraping, we temporarily retain client IP addresses in sliding-window memory caches (120 requests/min rate limit).\n\n• Usage Analytics: We use Google Analytics 4 to collect aggregated, anonymized metrics (pageviews, session durations, broad geographical country/city data) to optimize platform performance. All IP addresses are anonymized.'
          },
          {
            title: '3. Authentication & Security Architecture',
            content: 'Authentication is managed securely through Supabase Auth. Device Authorization for IDE extensions, browser extensions, and design tools follows the RFC 8628 protocol. Session tokens issued to extensions can be individually revoked by users at any time via /api/device/revoke or by signing out. Database access is protected with strict Row Level Security (RLS) policies ensuring users can only access and modify their own packs, presets, and entitlements.'
          },
          {
            title: '4. Cookies & Local Browser Storage',
            content: 'We use first-party HTTP cookies and LocalStorage to:\n\n• Maintain your active Supabase user session.\n• Persist local UI settings (such as dark mode preferences, active customizer settings, and local cart items).\n\nThird-party cookies may be set by Google Analytics for traffic analysis and Google AdSense for displaying contextual advertisements. You can disable third-party cookies in your browser settings or opt out of Google Analytics via tools.google.com/dlpage/gaoptout.'
          },
          {
            title: '5. Google AdSense & Advertising',
            content: 'IconSearch partners with Google AdSense to display contextual advertisements across the platform to help fund server bandwidth and maintenance of our free open-source database. Google AdSense may use cookies, web beacons, and unique advertising identifiers to serve ads based on prior visits to our website or other sites on the internet. Users may opt out of personalized advertising by visiting Google Ad Settings (adssettings.google.com) or the Network Advertising Initiative (optout.networkadvertising.org).'
          },
          {
            title: '6. How We Use Your Information',
            content: 'Collected data is used strictly for:\n\n• Providing fast in-memory icon search and SVG customizer services.\n• Authenticating accounts and synchronizing icon packs and presets across devices.\n• Fulfilling Founder Access entitlements for official developer extensions.\n• Protecting the Platform from malicious DDoS traffic, automated scraping, and bot attacks.\n• Understanding aggregated site performance and popular icon search terms.'
          },
          {
            title: '7. Data Sharing and Third Parties',
            content: 'We do not sell, rent, or trade your personal information. We share minimal necessary data only with trusted infrastructure providers:\n\n• Supabase Inc.: Database storage and authentication.\n• Google Analytics & Google AdSense: Aggregated traffic measurement and contextual ad serving.\n• Cloudflare / Vercel: Edge routing, caching, and DDoS mitigation.'
          },
          {
            title: '8. Data Retention and Deletion Rights',
            content: 'We retain account and sync data for as long as your account remains active. You have the full right to:\n\n• Request a complete export of your account data.\n• Revoke authorized device sessions at any time via /api/device/revoke.\n• Request permanent account and data deletion by emailing iconsearchinfo@gmail.com. Account deletion will be processed within 14 business days.'
          },
          {
            title: '9. GDPR & CCPA/CPRA Privacy Rights',
            content: 'If you reside in the European Economic Area (EEA), United Kingdom, or California, you have statutory rights under GDPR and CCPA, including rights to access, rectify, port, or erase your data, and to restrict or object to certain processing. To exercise these rights, contact us at iconsearchinfo@gmail.com.'
          },
          {
            title: '10. Children\'s Privacy',
            content: 'IconSearch is a professional technical platform intended for developers and designers. We do not knowingly collect or solicit personal information from children under 13. If we discover personal data from a child under 13, we will delete it immediately.'
          },
          {
            title: '11. Policy Updates',
            content: 'We may update this Privacy Policy periodically to reflect infrastructure or legal updates. Material updates will be indicated by revising the "Last updated" date at the top of this page.'
          },
          {
            title: '12. Contact Us',
            content: 'For privacy inquiries, data deletion requests, or security reports:\n\n📧 Email: iconsearchinfo@gmail.com\n🌐 Contact Form: https://iconsearch.info/contact\n📍 Operating from: India (Solo Founder / Independent Builder)'
          },
        ].map(section => (
          <div key={section.title}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>
              {section.title}
            </h2>
            {section.content.split('\n\n').map((para, i) => (
              <p key={i} style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.8, marginBottom: '12px' }}>
                {para}
              </p>
            ))}
          </div>
        ))}
      </article>

    </main>
  )
}
