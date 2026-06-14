// ---- Inputs: real events emitted by adapters ----
export type ToolName =
  | 'Edit' | 'Write' | 'Read' | 'Grep' | 'Glob' | 'Bash' | 'Task' | string

export type RunSource = 'pipeline' | 'gha'

export type RawEvent =
  | { kind: 'session_start'; project: string; sessionId: string; ts: number }
  | { kind: 'tool_use'; project: string; sessionId: string; tool: ToolName; ts: number }
  | { kind: 'subagent'; project: string; sessionId: string; ts: number }
  | { kind: 'session_end'; project: string; sessionId: string; ts: number }
  | { kind: 'run_start'; project: string; runId: string; source: RunSource; ts: number }
  | { kind: 'run_success'; project: string; runId: string; source: RunSource; ts: number }
  | { kind: 'run_fail'; project: string; runId: string; source: RunSource; ts: number }
  | { kind: 'commit'; project: string; sha: string; ts: number }
  | { kind: 'file_edit'; project: string; path: string; ts: number }
  | { kind: 'health'; project: string; status: 'healthy' | 'stale'; ts: number }

// ---- Outputs: what the town renders ----
export type WorkerActivity = 'enter' | 'craft' | 'research' | 'machinery' | 'leave' | 'bustle'
export type BuildingState = 'active' | 'idle' | 'fire' | 'stale' | 'construction'

export type TownAction =
  | { type: 'worker'; project: string; actor: string; activity: WorkerActivity; ts: number }
  | { type: 'apprentice'; project: string; parent: string; ts: number }
  | { type: 'caravan'; project: string; runId: string; phase: 'depart' | 'arrive'; ts: number }
  | { type: 'building'; project: string; state: BuildingState; ts: number }
  | { type: 'effect'; project: string; effect: 'sparkle' | 'banner_ok'; ts: number }

// ---- Snapshot pushed to late-joining clients ----
export interface TownSnapshot {
  buildings: Record<string, BuildingState>
  workers: Record<string, { project: string; activity: WorkerActivity }>
}

const RAW_KINDS = new Set([
  'session_start', 'tool_use', 'subagent', 'session_end',
  'run_start', 'run_success', 'run_fail', 'commit', 'file_edit', 'health',
])

export function isRawEvent(x: unknown): x is RawEvent {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.kind === 'string' && RAW_KINDS.has(o.kind)
    && typeof o.project === 'string' && typeof o.ts === 'number'
}

export function eventProject(e: RawEvent): string {
  return e.project
}
