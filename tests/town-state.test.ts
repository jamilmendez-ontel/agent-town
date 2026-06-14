import { describe, it, expect } from 'vitest'
import { TownState } from '../src/collector/town-state'

describe('TownState', () => {
  it('tracks building state from building actions', () => {
    const s = new TownState()
    s.apply({ type: 'building', project: 'p', state: 'fire', ts: 1 })
    expect(s.getSnapshot().buildings.p).toBe('fire')
  })

  it('adds a worker on enter and removes on leave', () => {
    const s = new TownState()
    s.apply({ type: 'worker', project: 'p', actor: 's1', activity: 'enter', ts: 1 })
    expect(s.getSnapshot().workers.s1).toEqual({ project: 'p', activity: 'enter' })
    s.apply({ type: 'worker', project: 'p', actor: 's1', activity: 'leave', ts: 2 })
    expect(s.getSnapshot().workers.s1).toBeUndefined()
  })

  it('updates a worker activity in place', () => {
    const s = new TownState()
    s.apply({ type: 'worker', project: 'p', actor: 's1', activity: 'enter', ts: 1 })
    s.apply({ type: 'worker', project: 'p', actor: 's1', activity: 'craft', ts: 2 })
    expect(s.getSnapshot().workers.s1.activity).toBe('craft')
  })

  it('ignores caravan/effect/apprentice actions in the persistent snapshot', () => {
    const s = new TownState()
    s.apply({ type: 'caravan', project: 'p', runId: 'r', phase: 'depart', ts: 1 })
    s.apply({ type: 'effect', project: 'p', effect: 'sparkle', ts: 2 })
    expect(s.getSnapshot()).toEqual({ buildings: {}, workers: {} })
  })
})
