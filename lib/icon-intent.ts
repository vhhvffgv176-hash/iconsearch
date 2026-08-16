export type SearchableIconIntent = {
  name: string
  tags?: string[]
  library?: string
  libraryName?: string
}

export type IconIntentGroup = {
  concept: string
  terms: string[]
}

export type IconSearchIntent = {
  normalizedQuery: string
  groups: IconIntentGroup[]
  matchPattern: RegExp | null
}

export type IconIntentEvaluation = {
  matches: boolean
  score: number
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'for',
  'icon',
  'icons',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'ui',
  'with',
])

// Keep this vocabulary deterministic and reviewable. It improves agent intent
// searches without sending user queries to a third-party embedding service.
const INTENT_CONCEPTS: Record<string, string[]> = {
  'empty state': ['empty', 'inbox', 'box', 'archive', 'file-question', 'search-x', 'folder-open'],
  'no results': ['search-x', 'search-off', 'file-question', 'inbox', 'empty'],
  automation: ['automation', 'workflow', 'sparkles', 'wand', 'bot', 'repeat', 'refresh', 'zap'],
  billing: ['billing', 'receipt', 'invoice', 'credit-card', 'wallet', 'banknote', 'coins'],
  history: ['history', 'clock', 'rotate-ccw', 'undo', 'receipt-text', 'list-restart'],
  team: ['team', 'users', 'user-group', 'people', 'contact', 'account-group'],
  settings: ['settings', 'cog', 'gear', 'sliders', 'wrench', 'preferences'],
  security: ['security', 'shield', 'lock', 'key', 'fingerprint', 'verified'],
  account: ['account', 'user', 'profile', 'person', 'avatar', 'contact'],
  navigation: ['navigation', 'menu', 'compass', 'route', 'map', 'signpost'],
  analytics: ['analytics', 'chart', 'graph', 'trend', 'activity', 'gauge'],
  notification: ['notification', 'bell', 'alert', 'alarm', 'badge'],
  upload: ['upload', 'cloud-upload', 'arrow-up', 'file-up', 'import'],
  download: ['download', 'cloud-download', 'arrow-down', 'file-down', 'export'],
  edit: ['edit', 'pencil', 'pen', 'compose', 'write'],
  delete: ['delete', 'trash', 'remove', 'x', 'bin'],
  add: ['add', 'plus', 'create', 'new'],
  close: ['close', 'x', 'dismiss', 'cancel'],
  success: ['success', 'check', 'circle-check', 'verified', 'badge-check'],
  warning: ['warning', 'alert', 'triangle', 'octagon', 'danger'],
  help: ['help', 'question', 'circle-help', 'info', 'support'],
  search: ['search', 'magnify', 'find', 'scan'],
  filter: ['filter', 'funnel', 'sliders', 'tune'],
  calendar: ['calendar', 'date', 'schedule', 'event'],
  time: ['time', 'clock', 'timer', 'watch', 'hourglass'],
  location: ['location', 'map-pin', 'pin', 'marker', 'navigation'],
  message: ['message', 'chat', 'comment', 'mail', 'inbox', 'send'],
  attachment: ['attachment', 'paperclip', 'link', 'file'],
  dashboard: ['dashboard', 'layout-dashboard', 'grid', 'panel', 'gauge'],
  quiet: ['minimal', 'subtle', 'circle', 'minus', 'inbox'],
}

const PHRASE_CONCEPTS = Object.keys(INTENT_CONCEPTS)
  .filter((concept) => concept.includes(' '))
  .sort((left, right) => right.length - left.length)

export function buildIconSearchIntent(query: string): IconSearchIntent {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) return { normalizedQuery: '', groups: [], matchPattern: null }

  const consumedTokens = new Set<string>()
  const groups: IconIntentGroup[] = []

  for (const phrase of PHRASE_CONCEPTS) {
    if (!normalizedQuery.includes(phrase)) continue
    groups.push(createGroup(phrase))
    phrase.split(' ').forEach((token) => consumedTokens.add(token))
  }

  for (const token of normalizedQuery.split(' ')) {
    if (!token || STOP_WORDS.has(token) || consumedTokens.has(token)) continue
    groups.push(createGroup(token))
  }

  const uniqueGroups = new Map<string, IconIntentGroup>()
  for (const group of groups) uniqueGroups.set(group.concept, group)

  const intentGroups = Array.from(uniqueGroups.values())
  return {
    normalizedQuery,
    groups: intentGroups,
    matchPattern: createIntentPattern(intentGroups, normalizedQuery),
  }
}

export function iconMatchesIntent(icon: SearchableIconIntent, intent: IconSearchIntent) {
  if (!intent.normalizedQuery) return true
  return intent.matchPattern?.test(`${icon.name} ${(icon.tags || []).join(' ')}`) || false
}

export function scoreIconIntent(icon: SearchableIconIntent, intent: IconSearchIntent) {
  return evaluateIconIntent(icon, intent).score
}

export function evaluateIconIntent(icon: SearchableIconIntent, intent: IconSearchIntent): IconIntentEvaluation {
  if (!intent.normalizedQuery) return { matches: true, score: 0 }

  const name = normalizeText(icon.name)
  const tags = (icon.tags || []).map(normalizeText)
  if (!intent.groups.length) {
    const matches = [name, ...tags].some((value) => value.includes(intent.normalizedQuery))
    return { matches, score: matches ? 1 : 0 }
  }

  const libraryName = normalizeText(icon.libraryName || '')
  let score = 0

  if (name === intent.normalizedQuery) score += 1_000
  else if (name.startsWith(intent.normalizedQuery)) score += 650
  else if (name.includes(intent.normalizedQuery)) score += 420

  let matchedGroups = 0
  for (const group of intent.groups) {
    const groupScore = matchGroup(name, tags, group)
    if (groupScore > 0) matchedGroups += 1
    score += groupScore
  }

  if (matchedGroups === intent.groups.length && matchedGroups > 1) score += 180
  if (libraryName.includes(intent.normalizedQuery)) score += 30
  score -= Math.min(name.length, 80) / 100

  return { matches: matchedGroups > 0, score }
}

export function describeIconSearchIntent(intent: IconSearchIntent) {
  return intent.groups.map(({ concept, terms }) => ({
    concept,
    alternatives: terms.filter((term) => term !== concept).slice(0, 8),
  }))
}

function createGroup(concept: string): IconIntentGroup {
  const terms = new Set([concept, ...(INTENT_CONCEPTS[concept] || [])])
  return { concept, terms: Array.from(terms, normalizeText).filter(Boolean) }
}

function createIntentPattern(groups: IconIntentGroup[], normalizedQuery: string) {
  const terms = groups.length
    ? Array.from(new Set(groups.flatMap((group) => group.terms)))
    : [normalizedQuery]
  if (!terms.length) return null
  const alternatives = terms
    .sort((left, right) => right.length - left.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`(?:^|[^a-z0-9])(?:${alternatives.join('|')})(?:$|[^a-z0-9])`, 'i')
}

function matchGroup(name: string, tags: string[], group: IconIntentGroup) {
  let best = 0

  for (const term of group.terms) {
    if (name === term) best = Math.max(best, 180)
    else if (term.length >= 3 && name.startsWith(term)) best = Math.max(best, 135)
    else if (term.length >= 3 && name.includes(term)) best = Math.max(best, 105)
    if (tags.some((tag) => tag === term)) best = Math.max(best, 85)
    else if (term.length >= 3 && tags.some((tag) => tag.includes(term))) best = Math.max(best, 55)
  }

  return best
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[_/]+/g, '-')
    .replace(/[^a-z0-9-]+/g, ' ')
    .replace(/-+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}
