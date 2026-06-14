import { describe, it, expect } from 'vitest'
import { eventProject, isRawEvent } from '../src/shared/types'

describe('shared helpers', () => {
  it('extracts project from any RawEvent', () => {
    expect(eventProject({ kind: 'commit', project: 'date-validator', sha: 'abc', ts: 1 })).toBe('date-validator')
  })

  it('accepts a well-formed RawEvent', () => {
    expect(isRawEvent({ kind: 'session_start', project: 'x', sessionId: 's1', ts: 1 })).toBe(true)
  })

  it('rejects non-events', () => {
    expect(isRawEvent({ foo: 'bar' })).toBe(false)
    expect(isRawEvent(null)).toBe(false)
  })
})
