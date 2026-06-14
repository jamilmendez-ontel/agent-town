#!/usr/bin/env node
// Usage examples:
//   node tools/event-injector.mjs session local-pipeline
//   node tools/event-injector.mjs tool local-pipeline Edit
//   node tools/event-injector.mjs fail quote-automation
//   node tools/event-injector.mjs caravan local-pipeline
//   node tools/event-injector.mjs demo            (a scripted sequence)
const PORT = process.env.AGENT_TOWN_PORT ?? 7373
const URL = `http://localhost:${PORT}/events`

async function post(event) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  })
  console.log(JSON.stringify(event), '->', await res.text())
}

const now = () => Date.now()
const [cmd, project = 'local-pipeline', arg] = process.argv.slice(2)

const sid = 'inj-' + Math.floor(now() / 1000)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  switch (cmd) {
    case 'session': await post({ kind: 'session_start', project, sessionId: sid, ts: now() }); break
    case 'tool':    await post({ kind: 'tool_use', project, sessionId: sid, tool: arg ?? 'Edit', ts: now() }); break
    case 'subagent':await post({ kind: 'subagent', project, sessionId: sid, ts: now() }); break
    case 'end':     await post({ kind: 'session_end', project, sessionId: sid, ts: now() }); break
    case 'caravan': {
      const runId = 'r' + now()
      await post({ kind: 'run_start', project, runId, source: 'gha', ts: now() })
      await sleep(2000)
      await post({ kind: 'run_success', project, runId, source: 'gha', ts: now() })
      break
    }
    case 'fail':    await post({ kind: 'run_fail', project, runId: 'r' + now(), source: 'gha', ts: now() }); break
    case 'commit':  await post({ kind: 'commit', project, sha: 'deadbee', ts: now() }); break
    case 'edit':    await post({ kind: 'file_edit', project, path: 'x.ts', ts: now() }); break
    case 'demo': {
      const s = 'demo-' + now()
      await post({ kind: 'session_start', project, sessionId: s, ts: now() }); await sleep(800)
      await post({ kind: 'tool_use', project, sessionId: s, tool: 'Read', ts: now() }); await sleep(800)
      await post({ kind: 'tool_use', project, sessionId: s, tool: 'Edit', ts: now() }); await sleep(800)
      await post({ kind: 'subagent', project, sessionId: s, ts: now() }); await sleep(800)
      const runId = 'rd' + now()
      await post({ kind: 'run_start', project, runId, source: 'pipeline', ts: now() }); await sleep(1500)
      await post({ kind: 'run_success', project, runId, source: 'pipeline', ts: now() }); await sleep(800)
      await post({ kind: 'session_end', project, sessionId: s, ts: now() })
      break
    }
    default:
      console.log('commands: session|tool|subagent|end|caravan|fail|commit|edit|demo [project] [toolName]')
  }
}
main()
