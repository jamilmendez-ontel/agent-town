#!/usr/bin/env node
// Claude Code hook bridge. Reads the hook JSON from stdin, derives a RawEvent,
// and POSTs it to the agent-town collector. Fails silently/fast so it never
// blocks or breaks a Claude Code session.
import { basename } from 'node:path'

const PORT = process.env.AGENT_TOWN_PORT ?? 7373
const URL = `http://localhost:${PORT}/events`

function readStdin() {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c) => (data += c))
    process.stdin.on('end', () => resolve(data))
    setTimeout(() => resolve(data), 500) // never hang
  })
}

// The monorepo root; a session's project is the first path segment under it.
const ROOT = 'C:\\Users\\admin\\Desktop\\Projects\\ai-projects'
function projectFromCwd(cwd) {
  if (!cwd) return 'ai-projects'
  const norm = cwd.replaceAll('/', '\\')
  if (!norm.startsWith(ROOT)) return basename(norm) || 'ai-projects'
  const rest = norm.slice(ROOT.length).replace(/^\\+/, '')
  return rest.split('\\')[0] || 'ai-projects'
}

function toEvent(hook) {
  const ts = Date.now()
  const project = projectFromCwd(hook.cwd)
  const sessionId = hook.session_id ?? 'claude'
  switch (hook.hook_event_name) {
    case 'SessionStart': return { kind: 'session_start', project, sessionId, ts }
    case 'Stop':         return { kind: 'session_end', project, sessionId, ts }
    case 'SubagentStop': return { kind: 'subagent', project, sessionId, ts }
    case 'PreToolUse':   return { kind: 'tool_use', project, sessionId, tool: hook.tool_name ?? 'unknown', ts }
    default: return null
  }
}

async function main() {
  let hook
  try { hook = JSON.parse(await readStdin()) } catch { process.exit(0) }
  const event = toEvent(hook)
  if (!event) process.exit(0)
  try {
    await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) })
  } catch { /* collector not running: ignore */ }
  process.exit(0)
}
main()
