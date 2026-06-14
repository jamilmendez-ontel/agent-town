import { describe, it, expect } from 'vitest'
import { translate } from '../src/collector/translator'
import type { RawEvent } from '../src/shared/types'

const P = 'local-pipeline'

describe('translate', () => {
  it('session_start -> building active + worker enter', () => {
    const out = translate({ kind: 'session_start', project: P, sessionId: 's1', ts: 1 })
    expect(out).toEqual([
      { type: 'building', project: P, state: 'active', ts: 1 },
      { type: 'worker', project: P, actor: 's1', activity: 'enter', ts: 1 },
    ])
  })

  it('Edit/Write -> craft', () => {
    for (const tool of ['Edit', 'Write']) {
      const out = translate({ kind: 'tool_use', project: P, sessionId: 's1', tool, ts: 2 })
      expect(out).toEqual([{ type: 'worker', project: P, actor: 's1', activity: 'craft', ts: 2 }])
    }
  })

  it('Read/Grep/Glob -> research', () => {
    for (const tool of ['Read', 'Grep', 'Glob']) {
      const out = translate({ kind: 'tool_use', project: P, sessionId: 's1', tool, ts: 3 })
      expect(out[0].type === 'worker' && out[0].activity).toBe('research')
    }
  })

  it('Bash -> machinery', () => {
    const out = translate({ kind: 'tool_use', project: P, sessionId: 's1', tool: 'Bash', ts: 4 })
    expect(out[0].type === 'worker' && out[0].activity).toBe('machinery')
  })

  it('unknown tool -> bustle (graceful)', () => {
    const out = translate({ kind: 'tool_use', project: P, sessionId: 's1', tool: 'Frobnicate', ts: 5 })
    expect(out[0].type === 'worker' && out[0].activity).toBe('bustle')
  })

  it('subagent -> apprentice', () => {
    const out = translate({ kind: 'subagent', project: P, sessionId: 's1', ts: 6 })
    expect(out).toEqual([{ type: 'apprentice', project: P, parent: 's1', ts: 6 }])
  })

  it('session_end -> worker leave + building idle', () => {
    const out = translate({ kind: 'session_end', project: P, sessionId: 's1', ts: 7 })
    expect(out).toEqual([
      { type: 'worker', project: P, actor: 's1', activity: 'leave', ts: 7 },
      { type: 'building', project: P, state: 'idle', ts: 7 },
    ])
  })

  it('run_start -> caravan depart', () => {
    const out = translate({ kind: 'run_start', project: P, runId: 'r1', source: 'gha', ts: 8 })
    expect(out).toEqual([{ type: 'caravan', project: P, runId: 'r1', phase: 'depart', ts: 8 }])
  })

  it('run_success -> caravan arrive + banner_ok', () => {
    const out = translate({ kind: 'run_success', project: P, runId: 'r1', source: 'gha', ts: 9 })
    expect(out).toEqual([
      { type: 'caravan', project: P, runId: 'r1', phase: 'arrive', ts: 9 },
      { type: 'effect', project: P, effect: 'banner_ok', ts: 9 },
    ])
  })

  it('run_fail -> building fire', () => {
    const out = translate({ kind: 'run_fail', project: P, runId: 'r1', source: 'pipeline', ts: 10 })
    expect(out).toEqual([{ type: 'building', project: P, state: 'fire', ts: 10 }])
  })

  it('commit -> building construction', () => {
    const out = translate({ kind: 'commit', project: P, sha: 'abc', ts: 11 })
    expect(out).toEqual([{ type: 'building', project: P, state: 'construction', ts: 11 }])
  })

  it('file_edit -> sparkle effect', () => {
    const out = translate({ kind: 'file_edit', project: P, path: 'a.ts', ts: 12 })
    expect(out).toEqual([{ type: 'effect', project: P, effect: 'sparkle', ts: 12 }])
  })

  it('health stale -> building stale; healthy -> building idle', () => {
    expect(translate({ kind: 'health', project: P, status: 'stale', ts: 13 }))
      .toEqual([{ type: 'building', project: P, state: 'stale', ts: 13 }])
    expect(translate({ kind: 'health', project: P, status: 'healthy', ts: 14 }))
      .toEqual([{ type: 'building', project: P, state: 'idle', ts: 14 }])
  })
})
