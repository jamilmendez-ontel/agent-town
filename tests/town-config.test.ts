import { describe, it, expect } from 'vitest'
import { TOWN, buildingFor, GRID } from '../src/web/town.config'

describe('town.config', () => {
  it('places every project on a unique non-overlapping grid cell', () => {
    const seen = new Set<string>()
    for (const b of TOWN) {
      const key = `${b.gx},${b.gy}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
      expect(b.gx).toBeGreaterThanOrEqual(0)
      expect(b.gy).toBeGreaterThanOrEqual(0)
      expect(b.gx).toBeLessThan(GRID.cols)
      expect(b.gy).toBeLessThan(GRID.rows)
    }
  })

  it('resolves a known project to its building', () => {
    expect(buildingFor('local-pipeline')?.project).toBe('local-pipeline')
  })

  it('returns undefined for an unknown project', () => {
    expect(buildingFor('does-not-exist')).toBeUndefined()
  })
})
