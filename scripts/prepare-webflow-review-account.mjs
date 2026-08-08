import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

await loadLocalEnvironment()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const secretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY
const reviewEmail = process.env.WEBFLOW_REVIEW_EMAIL?.trim().toLowerCase()
const reviewPassword = process.env.WEBFLOW_REVIEW_PASSWORD

if (!supabaseUrl || !publicKey || !secretKey) {
  throw new Error('Set the Supabase URL, public key, and server-side secret key before preparing the Webflow review account.')
}
if (!reviewEmail || !reviewEmail.endsWith('@webflow.com')) {
  throw new Error('WEBFLOW_REVIEW_EMAIL must be the @webflow.com address supplied in the Marketplace submission.')
}
if (!reviewPassword || reviewPassword.length < 8) {
  throw new Error('WEBFLOW_REVIEW_PASSWORD must be the Marketplace review password and contain at least 8 characters.')
}

const admin = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let existingUser
for (let page = 1; page <= 20 && !existingUser; page += 1) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
  if (error) throw error
  existingUser = data.users.find((user) => user.email?.toLowerCase() === reviewEmail)
  if (data.users.length < 1000) break
}

if (existingUser) {
  const { error } = await admin.auth.admin.updateUserById(existingUser.id, {
    password: reviewPassword,
    email_confirm: true,
  })
  if (error) throw error
} else {
  const { error } = await admin.auth.admin.createUser({
    email: reviewEmail,
    password: reviewPassword,
    email_confirm: true,
  })
  if (error) throw error
}

const publicClient = createClient(supabaseUrl, publicKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const { data: verification, error: verificationError } = await publicClient.auth.signInWithPassword({
  email: reviewEmail,
  password: reviewPassword,
})

if (verificationError || !verification.user) {
  throw verificationError || new Error('The Webflow review account could not be verified.')
}

await publicClient.auth.signOut()
console.log('Webflow Marketplace review account is active and its supplied credentials were verified.')

async function loadLocalEnvironment() {
  try {
    const envText = await readFile(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of envText.split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
      if (!match || process.env[match[1]]) continue
      const value = match[2].trim().replace(/^(['"])(.*)\1$/, '$2')
      process.env[match[1]] = value
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}
