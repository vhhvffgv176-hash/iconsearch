import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createIconSearchServer } from './index.js'

test('advertises the complete project-aware workflow with safe annotations', async (t) => {
  const server = createIconSearchServer()
  const client = new Client({ name: 'iconsearch-test', version: '1.0.0' })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

  await server.connect(serverTransport)
  await client.connect(clientTransport)
  t.after(async () => {
    await client.close()
    await server.close()
  })

  assert.equal(client.getServerVersion()?.name, 'iconsearch')
  assert.match(client.getInstructions() || '', /iconsearch_get_project_icons/)

  const listed = await client.listTools()
  const tools = new Map(listed.tools.map((tool) => [tool.name, tool]))
  const expected = [
    'iconsearch_start_sign_in',
    'iconsearch_finish_sign_in',
    'iconsearch_status',
    'iconsearch_sign_out',
    'iconsearch_get_project_icons',
    'iconsearch_search',
    'iconsearch_get_icon',
    'iconsearch_save_project_icon',
    'iconsearch_audit_project_icons',
    'iconsearch_snippet',
  ]
  assert.deepEqual(Array.from(tools.keys()).sort(), expected.sort())
  assert.equal(tools.get('iconsearch_save_project_icon')?.annotations?.destructiveHint, true)
  assert.equal(tools.get('iconsearch_audit_project_icons')?.annotations?.readOnlyHint, true)
  assert.equal(tools.get('iconsearch_search')?.annotations?.openWorldHint, true)
  assert.equal(tools.get('iconsearch_get_project_icons')?.annotations?.openWorldHint, false)
})

test('reads an empty project through the MCP protocol', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'iconsearch-mcp-protocol-'))
  const server = createIconSearchServer()
  const client = new Client({ name: 'iconsearch-test', version: '1.0.0' })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

  await server.connect(serverTransport)
  await client.connect(clientTransport)
  t.after(async () => {
    await client.close()
    await server.close()
    await rm(root, { recursive: true, force: true })
  })

  const result = await client.callTool({
    name: 'iconsearch_get_project_icons',
    arguments: { projectRoot: root },
  })
  assert.equal('isError' in result ? result.isError : false, false)
  assert.ok('content' in result)
  const first = 'content' in result ? result.content[0] : undefined
  assert.equal(first?.type, 'text')
  const payload = JSON.parse(first?.type === 'text' ? first.text : '{}') as Record<string, unknown>
  assert.equal(payload.exists, false)
  assert.deepEqual(payload.icons, {})
})
