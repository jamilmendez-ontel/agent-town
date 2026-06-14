import Phaser from 'phaser'
import { Worker } from '../sprites/Worker'
import type { WorkerActivity } from '../../shared/types'

const INTERIOR_PROJECT = 'local-pipeline'

// Stations a worker walks to based on activity.
const STATIONS: Record<WorkerActivity, { x: number; y: number; label: string }> = {
  research: { x: 220, y: 200, label: '📚 Research Desk' },
  craft:    { x: 460, y: 220, label: '🔥 Forge' },
  machinery:{ x: 660, y: 200, label: '⚙ Machinery' },
  enter:    { x: 120, y: 360, label: '🚪 Door' },
  bustle:   { x: 400, y: 360, label: '' },
  leave:    { x: 120, y: 360, label: '🚪 Door' },
}

export class InteriorScene extends Phaser.Scene {
  static PROJECT = INTERIOR_PROJECT
  private workers = new Map<string, Worker>()

  constructor() { super('Interior') }

  create() {
    this.add.rectangle(0, 0, 4000, 4000, 0x2a1f16).setOrigin(0)
    this.add.rectangle(40, 40, 820, 420, 0x3a2a1c).setStrokeStyle(4, 0x5a4530).setOrigin(0)
    this.add.text(56, 52, 'Pipeline Hall — interior', { fontFamily: 'monospace', fontSize: '16px', color: '#e8d8c0' })
    for (const key of ['research', 'craft', 'machinery'] as WorkerActivity[]) {
      const s = STATIONS[key]
      this.add.text(s.x, s.y - 30, s.label, { fontFamily: 'monospace', fontSize: '13px', color: '#cbb89a' }).setOrigin(0.5)
      this.add.rectangle(s.x, s.y, 44, 30, 0x5a4530).setStrokeStyle(2, 0x000000)
    }
    const back = this.add.text(56, 440, '← back to town', { fontFamily: 'monospace', fontSize: '14px', color: '#7cf9b0' }).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => { this.scene.stop('Interior'); this.scene.resume('Overworld') })
  }

  upsertWorker(actor: string, activity: WorkerActivity) {
    if (activity === 'leave') {
      this.workers.get(actor)?.destroy()
      this.workers.delete(actor)
      return
    }
    let w = this.workers.get(actor)
    if (!w) { w = new Worker(this, STATIONS.enter.x, STATIONS.enter.y); this.workers.set(actor, w) }
    const s = STATIONS[activity] ?? STATIONS.bustle
    w.moveTo(s.x, s.y)
    w.setActivity(activity)
  }
}
