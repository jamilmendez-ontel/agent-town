import type { RawEvent, TownAction, WorkerActivity } from '../shared/types'

const CRAFT = new Set(['Edit', 'Write'])
const RESEARCH = new Set(['Read', 'Grep', 'Glob'])

function toolActivity(tool: string): WorkerActivity {
  if (CRAFT.has(tool)) return 'craft'
  if (RESEARCH.has(tool)) return 'research'
  if (tool === 'Bash') return 'machinery'
  // 'Task' (subagent dispatch) and any other tool intentionally fall through to
  // 'bustle': subagents are surfaced via the separate 'subagent' event kind, not here.
  return 'bustle'
}

export function translate(e: RawEvent): TownAction[] {
  switch (e.kind) {
    case 'session_start':
      return [
        { type: 'building', project: e.project, state: 'active', ts: e.ts },
        { type: 'worker', project: e.project, actor: e.sessionId, activity: 'enter', ts: e.ts },
      ]
    case 'tool_use':
      return [{ type: 'worker', project: e.project, actor: e.sessionId, activity: toolActivity(e.tool), ts: e.ts }]
    case 'subagent':
      return [{ type: 'apprentice', project: e.project, parent: e.sessionId, ts: e.ts }]
    case 'session_end':
      return [
        { type: 'worker', project: e.project, actor: e.sessionId, activity: 'leave', ts: e.ts },
        { type: 'building', project: e.project, state: 'idle', ts: e.ts },
      ]
    case 'run_start':
      return [{ type: 'caravan', project: e.project, runId: e.runId, phase: 'depart', ts: e.ts }]
    case 'run_success':
      return [
        { type: 'caravan', project: e.project, runId: e.runId, phase: 'arrive', ts: e.ts },
        { type: 'effect', project: e.project, effect: 'banner_ok', ts: e.ts },
      ]
    case 'run_fail':
      return [{ type: 'building', project: e.project, state: 'fire', ts: e.ts }]
    case 'commit':
      return [{ type: 'building', project: e.project, state: 'construction', ts: e.ts }]
    case 'file_edit':
      return [{ type: 'effect', project: e.project, effect: 'sparkle', ts: e.ts }]
    case 'health':
      return [{ type: 'building', project: e.project, state: e.status === 'stale' ? 'stale' : 'idle', ts: e.ts }]
    default: {
      // Unknown event kind: never drop it silently.
      const anyE = e as { project?: string; ts?: number }
      return [{ type: 'worker', project: anyE.project ?? 'unknown', actor: 'unknown', activity: 'bustle', ts: anyE.ts ?? Date.now() }]
    }
  }
}
