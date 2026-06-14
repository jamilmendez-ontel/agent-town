import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'node:http'
import { isRawEvent, type RawEvent, type TownAction } from '../shared/types'
import { translate } from './translator'
import { TownState } from './town-state'

const PORT = Number(process.env.AGENT_TOWN_PORT ?? 7373)

const app = express()
app.use(express.json())

const state = new TownState()
const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer })

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

httpServer.listen(PORT, () => {
  console.log(`[agent-town] collector listening on http://localhost:${PORT}`)
})
