import type { TownAction, TownSnapshot } from '../shared/types'

type Handlers = {
  onActions: (actions: TownAction[]) => void
  onSnapshot: (snap: TownSnapshot) => void
  onStatus: (connected: boolean) => void
}

const PORT = 7373

export function connectTown(handlers: Handlers): void {
  let ws: WebSocket | null = null

  const open = () => {
    ws = new WebSocket(`ws://localhost:${PORT}`)
    ws.onopen = () => handlers.onStatus(true)
    ws.onclose = () => { handlers.onStatus(false); setTimeout(open, 1500) }
    ws.onerror = () => ws?.close()
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data as string)
      if (msg.type === 'actions') handlers.onActions(msg.actions as TownAction[])
      else if (msg.type === 'snapshot') handlers.onSnapshot(msg.snapshot as TownSnapshot)
    }
  }
  open()
}
