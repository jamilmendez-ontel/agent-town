import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'node:http'
import { isRawEvent, type RawEvent, type TownAction } from '../shared/types'
import { translate } from './translator'
import { TownState } from './town-state'
import { startPipelineGha } from './adapters/pipeline-gha'

const PORT = Number(process.env.AGENT_TOWN_PORT ?? 7373)

const app = express()
app.use(express.json())

const state = new TownState()
const httpServer = createServer(app)
// Reject cross-site websocket hijacking: browsers always send an Origin header,
// so a malicious page is blocked; non-browser clients (tests/tools) send none and are allowed.
function originAllowed(origin: string | undefined): boolean {
  if (!origin) return true
  try {
    const host = new URL(origin).hostname
    return host === 'localhost' || host === '127.0.0.1'
  } catch {
    return false
  }
}
const wss = new WebSocketServer({
  server: httpServer,
  verifyClient: (info: { origin: string }) => originAllowed(info.origin),
})

function broadcast(actions: TownAction[]): void {
  const payload = JSON.stringify({ type: 'actions', actions })
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload)
  }
}

function ingest(event: RawEvent): void {
  const actions = translate(event)
  for (const a of actions) state.apply(a)
  broadcast(actions)
}

// New clients get the current snapshot so a late join sees the live town.
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'snapshot', snapshot: state.getSnapshot() }))
})

app.get('/health', (_req, res) => res.json({ ok: true }))

app.post('/events', (req, res) => {
  const body = req.body
  const events: unknown[] = Array.isArray(body) ? body : [body]
  let accepted = 0
  for (const e of events) {
    if (isRawEvent(e)) { ingest(e); accepted++ }
  }
  res.json({ accepted, rejected: events.length - accepted })
})

// Live-data adapters: each polls its own source and feeds ingest(). Adapter
// failures are isolated and never crash the collector.
startPipelineGha(ingest)

// Bind to loopback only: this is a single-user local dev tool, never exposed to the network.
httpServer.listen(PORT, '127.0.0.1', () => {
  console.log(`[agent-town] collector listening on http://127.0.0.1:${PORT}`)
})
