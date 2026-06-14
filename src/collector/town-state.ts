import type { TownAction, TownSnapshot, WorkerActivity } from '../shared/types'

// Source of truth for persistent world state. Transient actions
// (caravan, effect, apprentice) are pushed to clients but not stored.
export class TownState {
  private buildings: Record<string, TownSnapshot['buildings'][string]> = {}
  private workers: Record<string, { project: string; activity: WorkerActivity }> = {}

  apply(action: TownAction): void {
    switch (action.type) {
      case 'building':
        this.buildings[action.project] = action.state
        break
      case 'worker':
        if (action.activity === 'leave') {
          delete this.workers[action.actor]
        } else {
          this.workers[action.actor] = { project: action.project, activity: action.activity }
        }
        break
      // caravan / effect / apprentice are transient: not stored
    }
  }

  getSnapshot(): TownSnapshot {
    return {
      buildings: { ...this.buildings },
      workers: structuredClone(this.workers),
    }
  }
}
