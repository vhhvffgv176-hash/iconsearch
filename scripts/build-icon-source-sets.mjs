import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'

const root = process.cwd()
const collectionsPath = resolve(
  process.argv[2] ||
    process.env.ICONSEARCH_COLLECTIONS_PATH ||
    resolve(process.env.TEMP || '.', 'iconsearch-source-collections.json'),
)

if (!existsSync(collectionsPath)) {
  throw new Error(
    `Collection metadata was not found at ${collectionsPath}. Download https://api.iconify.design/collections and pass its path as the first argument.`,
  )
}

const canonical = JSON.parse(
  gunzipSync(readFileSync(resolve(root, 'data/canonical-icon-search.json.gz'))).toString('utf8'),
)
const collections = JSON.parse(readFileSync(collectionsPath, 'utf8'))

const duplicateSourceSets = {
  'bootstrap-icons': 'bi',
  'circum-icons': 'circum',
  devicons: 'devicon',
  'elusive-icons': 'el',
  'feather-icons': 'feather',
  heroicons: 'heroicons',
  iconoir: 'iconoir',
  'lucide-icons': 'lucide',
  'phosphor-icons': 'ph',
  'radix-icons': 'radix-icons',
  'remix-icon': 'ri',
  'tabler-icons': 'tabler',
  teenyicons: 'teenyicons',
}

const sourceUrlOverrides = {
  hugeicons: 'https://github.com/hugeicons/hugeicons',
}

function sourceSetId(library) {
  if (library.startsWith('iconify-')) return library.slice('iconify-'.length)
  return duplicateSourceSets[library] || library
}

function usageRequirements(license) {
  const id = String(license).toUpperCase()
  if (id === 'CC0-1.0' || id === 'UNLICENSE') return 'No attribution required.'
  if (id.includes('CC-BY-NC')) return 'Attribution required. Non-commercial use only.'
  if (id.includes('CC-BY-SA')) return 'Attribution and ShareAlike terms apply.'
  if (id.includes('CC-BY')) return 'Attribution required.'
  if (id.includes('GPL')) return 'GPL redistribution terms apply.'
  if (id.includes('MPL')) return 'MPL notice and file-level copyleft terms apply.'
  if (id.includes('OFL')) return 'SIL Open Font License terms apply.'
  return 'Keep the upstream copyright and license notice with redistributed copies.'
}

function canonicalLicenseUrl(license) {
  const id = String(license).toUpperCase()
  if (id === 'MIT') return 'https://opensource.org/license/mit'
  if (id === 'APACHE-2.0') return 'https://www.apache.org/licenses/LICENSE-2.0'
  if (id === 'OFL-1.1') return 'https://openfontlicense.org/'
  if (id === 'ISC') return 'https://opensource.org/license/isc-license-txt'
  return ''
}

const counts = new Map()
const rawLibraries = new Set()
for (const icon of canonical) {
  rawLibraries.add(icon.library)
  const id = sourceSetId(icon.library)
  counts.set(id, (counts.get(id) || 0) + 1)
}

const prefixedIds = [...rawLibraries]
  .filter((library) => library.startsWith('iconify-'))
  .map((library) => sourceSetId(library))
  .sort()

const sets = prefixedIds.map((id) => {
  const collection = collections[id]
  if (!collection) throw new Error(`Missing official metadata for ${id}`)

  const license = collection.license?.spdx || collection.license?.title || 'Unknown'
  const sourceUrl = sourceUrlOverrides[id] || collection.author?.url || ''
  return {
    id,
    name: collection.name || id,
    iconCount: counts.get(id) || 0,
    authorName: collection.author?.name || 'Upstream contributors',
    authorUrl: sourceUrl,
    sourceUrl,
    license,
    licenseUrl: collection.license?.url || canonicalLicenseUrl(license),
    usageRequirements: usageRequirements(license),
    commercialUseAllowed: !String(license).toUpperCase().includes('-NC-'),
    exportAllowed: true,
  }
})

sets.push(
  {
    id: 'patternfly-icons',
    name: 'PatternFly Icons',
    iconCount: counts.get('patternfly-icons') || 0,
    authorName: 'Red Hat, Inc.',
    authorUrl: 'https://github.com/patternfly/patternfly-react',
    sourceUrl: 'https://github.com/patternfly/patternfly-react/tree/main/packages/react-icons',
    license: 'MIT',
    licenseUrl: 'https://github.com/patternfly/patternfly-react/blob/main/LICENSE',
    usageRequirements: usageRequirements('MIT'),
    commercialUseAllowed: true,
    exportAllowed: true,
  },
  {
    id: 'untitled-ui-icons',
    name: 'Untitled UI Icons',
    iconCount: counts.get('untitled-ui-icons') || 0,
    authorName: 'Untitled UI',
    authorUrl: 'https://www.untitledui.com/',
    sourceUrl: 'https://www.untitledui.com/icons',
    license: 'Untitled UI License',
    licenseUrl: 'https://www.untitledui.com/license',
    usageRequirements: 'Use in projects is allowed, but redistribution of original or modified icons is prohibited.',
    commercialUseAllowed: true,
    exportAllowed: false,
  },
)

sets.sort((left, right) => left.name.localeCompare(right.name))

if (sets.length !== 229) {
  throw new Error(`Expected 229 distinct source sets, found ${sets.length}`)
}

const totalIcons = sets.reduce((total, set) => total + set.iconCount, 0)
if (totalIcons !== canonical.length) {
  throw new Error(`Expected ${canonical.length} mapped icons, found ${totalIcons}`)
}

writeFileSync(
  resolve(root, 'data/icon-source-sets.json'),
  `${JSON.stringify({ version: 1, sourceSetCount: sets.length, totalIcons, sets }, null, 2)}\n`,
)

console.log(`Wrote ${sets.length} source sets covering ${totalIcons} icons.`)
