# Publishing `@iconsearch/mcp-server`

This checklist keeps database, website API, and package publication in the correct order.

## 1. Prepare npm ownership

1. Create or confirm the `iconsearch` organization on npm.
2. Confirm your npm user can publish packages in the `@iconsearch` scope.
3. Enable two-factor authentication on the maintainer account.
4. Decide whether the source remains `UNLICENSED` or add an approved software licence before publication.

The package name cannot be published unless the npm account owns or belongs to the `@iconsearch` scope.

## 2. Apply the production backend migration

In the Supabase SQL editor, run:

```text
supabase/migrations/202608150001_mcp_agent_workflow.sql
```

Then verify:

- `agent_usage_limits` contains rows for `free` and `founder` search/retrieve limits.
- `record_agent_usage` exists under **Database → Functions**.
- Anonymous and authenticated database roles cannot execute the function directly.
- The website's server-side Supabase secret remains configured only in server environment variables.

Do not publish the MCP package before the migrated website API is deployed. Search and retrieval intentionally return `503` if usage accounting is unavailable.

## 3. Deploy and smoke-test the website

Deploy the current commit to production, then verify:

1. `https://iconsearch.info/agents` renders.
2. `https://iconsearch.info/docs/agents` renders.
3. A fresh MCP device flow can connect.
4. Authenticated `/api/v1/icons/search?q=billing%20history` returns ranked results and rate-limit headers.
5. Authenticated `/api/v1/icons/lucide/receipt-text` returns SVG and a SHA-256 checksum.
6. Invalid or unauthenticated requests fail with the expected `400` or `401` status.

## 4. Verify the package locally

From `mcp-server`:

```bash
npm ci
npm test
npm run build
npm audit --omit=dev
npm pack --dry-run
```

Inspect the dry-run file list. It should contain only compiled `dist` files, `README.md`, and npm-generated package metadata. Never publish `.env` files, local sessions, source maps containing secrets, or test fixtures with credentials.

## 5. First publication

The direct first-release path is:

```bash
npm login
npm whoami
npm publish --access public
```

Scoped packages default to private visibility, so the first public publish needs `--access public`. The repository already sets `publishConfig.access` to `public`, but keeping the flag explicit on the first release makes intent clear.

After publication:

```bash
npm view @iconsearch/mcp-server version dist.integrity
npx -y @iconsearch/mcp-server@0.2.0
```

The second command starts a stdio server and waits for an MCP client; exit it after confirming it starts without diagnostics.

## 6. Recommended ongoing releases: npm trusted publishing

This repository contains `.github/workflows/publish-mcp.yml`, which publishes tags matching `mcp-v*` from a GitHub-hosted runner using OIDC.

After the first package exists on npm:

1. Open the package's npm **Settings → Trusted Publisher**.
2. Choose GitHub Actions.
3. Set organization/user to `vhhvffgv176-hash`.
4. Set repository to `iconsearch`.
5. Set workflow filename to `publish-mcp.yml`.
6. Allow `npm publish` (or change the workflow and permission to staged publishing if you want manual 2FA approval for every release).
7. After the first successful OIDC release, set publishing access to require 2FA and disallow traditional tokens.

To release:

```bash
cd mcp-server
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "release: @iconsearch/mcp-server 0.2.1"
git tag mcp-v0.2.1
git push origin main mcp-v0.2.1
```

Use the exact package version in the tag. The workflow stops if they differ.

Trusted publishing requires npm CLI 11.5.1 or newer and Node.js 22.14 or newer. The workflow uses Node.js 24 and does not require an `NPM_TOKEN` secret.

## Rollback

npm package versions are immutable. If a release is faulty:

1. Deprecate the affected version with a clear message.
2. Fix the issue and publish a new patch version.
3. Move the `latest` dist-tag only after the replacement passes smoke tests.

Avoid unpublishing unless required for an exposed secret or similarly exceptional incident.
