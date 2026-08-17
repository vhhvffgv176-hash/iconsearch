import type { Metadata } from 'next'

export const SITE_NAME = 'IconSearch'
export const SITE_URL = 'https://iconsearch.info'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`
export const DEFAULT_TWITTER_IMAGE = `${SITE_URL}/twitter-image`

export const DEFAULT_KEYWORDS = [
  'free svg icons',
  'svg icons',
  'free iconography',
  'app icons',
  'app icon maker',
  'google icons',
  'material icons',
  'react icons',
  'nextjs icons',
  'tailwind icons',
  'lucide icons',
  'tabler icons',
  'phosphor icons',
  'feather icons',
  'open source icons',
  'vector icons library',
  'svg maker free',
  'logo icons',
  'powerpoint icons',
  'google slides icons',
  'icon search engine',
  'download free svg',
]

export type PageMetadataOptions = {
  title: string
  description: string
  path: `/${string}` | '/'
  type?: 'website' | 'article'
  image?: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
  keywords?: string[]
  robots?: Metadata['robots']
}

export function createPageMetadata({
  title,
  description,
  path,
  type = 'website',
  image = DEFAULT_OG_IMAGE,
  imageAlt = 'IconSearch — search, customize, and download open-source SVG icons',
  imageWidth = 1200,
  imageHeight = 630,
  keywords = DEFAULT_KEYWORDS,
  robots,
}: PageMetadataOptions): Metadata {
  const canonical = new URL(path, SITE_URL).toString()

  return {
    title,
    description,
    keywords,
    ...(robots ? { robots } : {}),
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'en_US',
      type,
      images: [
        {
          url: image,
          width: imageWidth,
          height: imageHeight,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@IconSearchinfo',
      creator: '@IconSearchinfo',
      title,
      description,
      images: [image === DEFAULT_OG_IMAGE ? DEFAULT_TWITTER_IMAGE : image],
    },
  }
}

// ---------------------------------------------------------------------------
// Schema.org (JSON-LD) Generators
// ---------------------------------------------------------------------------

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: ['IconSearch', 'Icon Search', 'IconHub'],
    url: SITE_URL,
    description:
      'Search, customize, and download 355,000+ free vector SVG icons from 229 open-source icon libraries.',
    inLanguage: 'en',
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/icon-search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'An independent discovery platform and vector design suite for 229 open-source SVG icon libraries.',
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/iconsearch-logomark-900.png`,
      width: 900,
      height: 900,
    },
    sameAs: [
      'https://x.com/IconSearchinfo',
      'https://github.com/iconsearch',
    ],
  }
}

export function generateSoftwareAppSchema({
  name,
  description,
  applicationCategory = 'DesignApplication',
  operatingSystem = 'Web, macOS, Windows, Linux',
  path,
  screenshot,
  featureList = [],
}: {
  name: string
  description: string
  applicationCategory?: string
  operatingSystem?: string
  path: string
  screenshot?: string
  featureList?: string[]
}) {
  const url = `${SITE_URL}${path}`
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    applicationCategory,
    operatingSystem,
    url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    ...(screenshot ? { screenshot } : {}),
    ...(featureList.length > 0 ? { featureList } : {}),
    author: {
      '@id': `${SITE_URL}/#organization`,
    },
  }
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }
}

export function generateImageObjectSchema({
  name,
  description,
  contentUrl,
  license = 'MIT',
  creator = 'Open Source Community',
  tags = [],
}: {
  name: string
  description: string
  contentUrl: string
  license?: string
  creator?: string
  tags?: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name,
    caption: description,
    contentUrl,
    license: `https://spdx.org/licenses/${encodeURIComponent(license)}.html`,
    acquireLicensePage: `${SITE_URL}/licenses`,
    creator: {
      '@type': 'Organization',
      name: creator,
    },
    keywords: tags.join(', '),
  }
}

export function generateFAQSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }
}
