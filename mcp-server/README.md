# IconSearch MCP Server

Give coding agents semantic icon search, exact SVG retrieval, project-native icon memory, and repository audits across the IconSearch catalog.

## Requirements

- Node.js 20 or newer
- An MCP-compatible client
- A free IconSearch account for search and retrieval

## Install in Codex

```bash
codex mcp add iconsearch -- npx -y @iconsearch/mcp-server
```

Restart Codex and call `iconsearch_status`. If the server is disconnected:

1. Call `iconsearch_start_sign_in`.
2. Open the returned verification URL and approve access.
3. Call `iconsearch_finish_sign_in` with the returned device code.

The official Codex MCP guide is available at <https://developers.openai.com/codex/mcp/>.

## Other MCP clients

Use the package as a standard stdio server:

```json
{
  "mcpServers": {
    "iconsearch": {
      "command": "npx",
      "args": ["-y", "@iconsearch/mcp-server"]
    }
  }
}
```

Set `ICONSEARCH_PROJECT_ROOT` when the client does not start the server inside your repository. `ICONSEARCH_API_BASE` is available for self-hosted development; it must use HTTPS unless it points to a loopback address.

## Recommended workflow

1. Call `iconsearch_get_project_icons` before choosing a new icon.
2. Reuse an approved semantic assignment when one matches the requested UI purpose.
3. Call `iconsearch_search` with intent such as `billing history` or `quiet empty state`.
4. Call `iconsearch_get_icon` to retrieve exact SVG and source/licence metadata.
5. Call `iconsearch_save_project_icon` only after the choice is approved.
6. Call `iconsearch_audit_project_icons` before shipping.

## Tools

| Tool | Purpose | Changes files |
| --- | --- | --- |
| `iconsearch_start_sign_in` | Start browser device sign-in | No |
| `iconsearch_finish_sign_in` | Complete sign-in and store a revocable local session | Local session only |
| `iconsearch_status` | Inspect connection status without exposing a token | No |
| `iconsearch_sign_out` | Remove the locally stored session | Local session only |
| `iconsearch_get_project_icons` | Read style defaults and approved semantic assignments | No |
| `iconsearch_search` | Search by UI intent, collection, style, and licence safety | No |
| `iconsearch_get_icon` | Retrieve exact sanitized SVG and attribution | No |
| `iconsearch_save_project_icon` | Save an approved SVG and update project memory | Yes |
| `iconsearch_audit_project_icons` | Audit missing assets, drift, inline SVGs, and mixed packages | No |
| `iconsearch_snippet` | Compatibility helper for earlier integrations | No |

## Project memory

Saving an approved icon creates:

```text
iconsearch.json
.iconsearch/
  icons/
    billing-history.svg
```

`iconsearch.json` records visual defaults, semantic names, source/licence metadata, and a SHA-256 checksum for every managed SVG. Commit the manifest and managed SVGs so teammates, CI, and coding agents use the same decisions.

## Security

- The save tool is bounded to `iconsearch.json` and `.iconsearch/icons` beneath a validated project root.
- Filesystem roots and the user home directory are rejected as project roots.
- Reads and writes refuse symbolic-link traversal.
- SVG scripts, embedded documents, event handlers, unsafe protocols, and external resources are rejected.
- Network responses have timeouts and size limits.
- Session tokens are never returned by status tools or written to project files.
- Protocol messages use stdout; fatal diagnostics use stderr.

Review every agent-authored repository change before committing or deploying it.

## Local development

```bash
cd mcp-server
npm ci
npm test
npm run build
npm run check:pack
```

Run the local server with:

```bash
npm run dev
```

For website API development, set `ICONSEARCH_API_BASE=http://localhost:3000` in the MCP client environment.

## Publishing

Version `0.2.0` is public on [npm](https://www.npmjs.com/package/@iconsearch/mcp-server). Maintainers should follow [`docs/mcp-publishing.md`](../docs/mcp-publishing.md), inspect `npm pack --dry-run`, and publish future immutable versions only after the production API and package checks pass.

## Licence

This package is distributed under the [MIT License](./LICENSE). Icon data returned by the service remains subject to each source collection's own licence and attribution requirements.
