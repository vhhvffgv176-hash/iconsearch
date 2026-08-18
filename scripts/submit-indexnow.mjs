import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'

const HOST = 'iconsearch.info'
const API_KEY = '36d0e61d6b724c24a54b40c7207b8e25'
const KEY_LOCATION = `https://${HOST}/${API_KEY}.txt`
const BATCH_SIZE = 10000

const STATIC_ROUTES = [
  '/',
  '/free-svg-icons',
  '/icon-search',
  '/logo-maker',
  '/react-icons',
  '/nextjs-icons',
  '/tailwind-icons',
  '/vue-icons',
  '/svelte-icons',
  '/typescript-icons',
  '/agents',
  '/docs/agents',
  '/directory',
  '/stats',
  '/licenses',
  '/figma-plugin',
  '/powerpoint-addin',
  '/google-slides-addon',
  '/wordpress-plugin',
  '/vscode-extension',
  '/chrome-extension',
  '/framer-plugin',
  '/webflow-extension',
  '/canva-app',
  '/adobe-plugin',
  '/obsidian-plugin',
  '/penpot-plugin',
  '/raycast-extension',
  '/jetbrains-plugin',
  '/tailwind-plugin',
  '/storybook-addon',
  '/shopify-extension',
  '/sketch-plugin',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms',
]

async function main() {
  console.log(`[IndexNow] Preparing URLs for ${HOST}...`)

  const urls = new Set()

  // 1. Static and integration landing pages
  for (const route of STATIC_ROUTES) {
    urls.add(`https://${HOST}${route}`)
  }

  // 2. Library URLs
  const allLibrariesPath = join(process.cwd(), 'data', 'all-libraries.json')
  if (existsSync(allLibrariesPath)) {
    const libraries = JSON.parse(readFileSync(allLibrariesPath, 'utf8'))
    for (const lib of libraries) {
      if (lib.slug) {
        urls.add(`https://${HOST}/icons/${encodeURIComponent(lib.slug)}`)
      }
    }
  }

  // 3. Top icons from canonical icon snapshot if available
  const gzPath = join(process.cwd(), 'data', 'canonical-icon-search.json.gz')
  if (existsSync(gzPath)) {
    try {
      const raw = gunzipSync(readFileSync(gzPath)).toString('utf8')
      const icons = JSON.parse(raw)
      if (Array.isArray(icons)) {
        // Add first 8,000 icons for immediate fast indexation
        const sample = icons.slice(0, 8000)
        for (const icon of sample) {
          if (icon.library && icon.name) {
            urls.add(`https://${HOST}/icons/${encodeURIComponent(icon.library)}/${encodeURIComponent(icon.name)}`)
          }
        }
      }
    } catch (err) {
      console.warn('[IndexNow] Warning reading icons:', err.message)
    }
  }

  const urlList = Array.from(urls)
  console.log(`[IndexNow] Total URLs gathered: ${urlList.length}`)

  // Submit in chunks of BATCH_SIZE
  for (let i = 0; i < urlList.length; i += BATCH_SIZE) {
    const batch = urlList.slice(i, i + BATCH_SIZE)
    console.log(`[IndexNow] Submitting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} URLs)...`)

    const payload = {
      host: HOST,
      key: API_KEY,
      keyLocation: KEY_LOCATION,
      urlList: batch,
    }

    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      })

      console.log(`[IndexNow] Response status: ${res.status} ${res.statusText}`)
      if (res.status === 200 || res.status === 202) {
        console.log(`[IndexNow] Batch ${Math.floor(i / BATCH_SIZE) + 1} successfully submitted!`)
      } else {
        const text = await res.text()
        console.warn(`[IndexNow] Response body:`, text)
      }
    } catch (err) {
      console.error(`[IndexNow] Submission error:`, err.message)
    }
  }

  console.log('[IndexNow] Finished URL submission.')
}

main()
