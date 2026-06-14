import Phaser from 'phaser'
import { TOWN, GRID, buildingFor, type Building } from '../town.config'
import type { BuildingState } from '../../shared/types'

const STATE_TINT: Record<BuildingState, number> = {
  active: 0xffffff,
  idle: 0x9aa6b2,
  fire: 0xff5533,
  stale: 0x556644,
  construction: 0xffd34d,
}

export class OverworldScene extends Phaser.Scene {
  private rects = new Map<string, Phaser.GameObjects.Rectangle>()
  private status!: Phaser.GameObjects.Text

  constructor() { super('Overworld') }

  cellCenter(b: Building) {
    const pad = 40
    return {
      x: pad + b.gx * GRID.cell + GRID.cell / 2,
      y: pad + b.gy * GRID.cell + GRID.cell / 2,
    }
  }

  create() {
    // ground
    this.add.rectangle(0, 0, 4000, 4000, 0x14210f).setOrigin(0)
    // roads (grid lines between cells)
    const g = this.add.graphics()
    g.lineStyle(10, 0x9a8b6e, 1)
    const pad = 40
    for (let c = 0; c <= GRID.cols; c++) g.lineBetween(pad + c * GRID.cell, pad, pad + c * GRID.cell, pad + GRID.rows * GRID.cell)
    for (let r = 0; r <= GRID.rows; r++) g.lineBetween(pad, pad + r * GRID.cell, pad + GRID.cols * GRID.cell, pad + r * GRID.cell)

    // buildings
    for (const b of TOWN) {
      const { x, y } = this.cellCenter(b)
      const rect = this.add.rectangle(x, y, 110, 80, b.color).setStrokeStyle(3, 0xffffff)
      rect.setData('project', b.project)
      rect.setInteractive({ useHandCursor: true })
      this.rects.set(b.project, rect)
      this.add.text(x, y + 50, b.label, { fontFamily: 'monospace', fontSize: '12px', color: '#cdd9e5' }).setOrigin(0.5)
    }

    this.status = this.add.text(40, 12, 'connecting...', { fontFamily: 'monospace', fontSize: '14px', color: '#ffcc66' })
  }

  setStatus(connected: boolean) {
    this.status.setText(connected ? 'connected ●' : 'disconnected ○ (reconnecting)')
      .setColor(connected ? '#7cf9b0' : '#ff6b6b')
  }

  setBuildingState(project: string, state: BuildingState) {
    const rect = this.rects.get(project)
    if (!rect) return
    const base = buildingFor(project)!.color
    rect.setFillStyle(state === 'fire' || state === 'construction' || state === 'stale' ? STATE_TINT[state] : base)
    rect.setAlpha(state === 'idle' ? 0.6 : 1)
  }
}
