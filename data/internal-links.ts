export type InternalLink = {
  label: string
  href: string
}

export type InternalLinkGroup = {
  title: string
  links: InternalLink[]
}

export const internalLinkGroups: InternalLinkGroup[] = [
  {
    title: 'LIBRARIES',
    links: [
      { label: 'Lucide Icons', href: '/icons/lucide-icons' },
      { label: 'Heroicons', href: '/icons/heroicons' },
      { label: 'Tabler Icons', href: '/icons/tabler-icons' },
      { label: 'Phosphor Icons', href: '/icons/phosphor-icons' },
      { label: 'All Libraries', href: '/free-svg-icons' },
    ],
  },
  {
    title: 'FRAMEWORKS',
    links: [
      { label: 'React Icons', href: '/react-icons' },
      { label: 'Next.js Icons', href: '/nextjs-icons' },
      { label: 'Vue Icons', href: '/vue-icons' },
      { label: 'Svelte Icons', href: '/svelte-icons' },
      { label: 'Tailwind Icons', href: '/tailwind-icons' },
      { label: 'TypeScript Icons', href: '/typescript-icons' },
    ],
  },
  {
    title: 'RESOURCES',
    links: [
      { label: 'Logo Maker', href: '/logo-maker' },
      { label: 'Icons for Agents', href: '/agents' },
      { label: 'Agent Setup Guide', href: '/docs/agents' },
      { label: 'Browse', href: '/free-svg-icons' },
      { label: 'Site Directory', href: '/directory' },
      { label: 'VS Code Extension', href: '/vscode-extension' },
      { label: 'Figma Plugin', href: '/figma-plugin' },
      { label: 'Chrome Extension', href: '/chrome-extension' },
      { label: 'Framer Plugin', href: '/framer-plugin' },
      { label: 'License Guide', href: '/licenses' },
      { label: 'Stats & Benchmarks', href: '/stats' },
    ],
  },
]

export const footerLegalLinks: InternalLink[] = [
  { label: 'Account', href: '/account' },
  { label: 'About', href: '/about' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
]
