import Phaser from 'phaser'
import { TOWN, GRID, buildingFor, type Building } from '../town.config'
import type { BuildingState } from '../../shared/types'
import { Worker } from '../sprites/Worker'
import { ASSETS, houseStyle } from '../assets'

const STATE_TINT: Record<BuildingState, number> = {
  active: 0xffffff,
  idle: 0x9aa6b2,
  fire: 0xff5533,
  stale: 0x6a7a55,
  construction: 0xffd34d,
}

export class OverworldScene extends Phaser.Scene {
  private rects = new Map<string, Phaser.GameObjects.Rectangle>()
  private buildingParts = new Map<string, Phaser.GameObjects.Image[]>()
  private status!: Phaser.GameObjects.Text
  private workers = new Map<string, Worker>()

  constructor() { super('Overworld') }

  preload() {
    this.load.spritesheet(ASSETS.tiles.key, ASSETS.tiles.url, { frameWidth: ASSETS.tiles.frameWidth, frameHeight: ASSETS.tiles.frameHeight })
    this.load.spritesheet(ASSETS.character.key, ASSETS.character.url, { frameWidth: ASSETS.character.frameWidth, frameHeight: ASSETS.character.frameHeight })
    this.load.image(ASSETS.grass.key, ASSETS.grass.url)
  }

  cellCenter(b: Building) {
    const pad = 40
    return {
      x: pad + b.gx * GRID.cell + GRID.cell / 2,
      y: pad + b.gy * GRID.cell + GRID.cell / 2,
    }
  }

  create() {
    const hasTiles = this.textures.exists(ASSETS.tiles.key)
    const pad = 40
    const townW = pad * 2 + GRID.cols * GRID.cell
    const townH = pad * 2 + GRID.rows * GRID.cell

    // ground: tiled grass where art exists, else a flat green field
    if (this.textures.exists(ASSETS.grass.key)) {
      this.add.tileSprite(0, 0, Math.max(townW, 2000), Math.max(townH, 1600), ASSETS.grass.key).setOrigin(0)
    } else {
      this.add.rectangle(0, 0, 4000, 4000, 0x14210f).setOrigin(0)
      // roads only in the primitive fallback (grass reads better without them)
      const g = this.add.graphics()
      g.lineStyle(10, 0x9a8b6e, 1)
      for (let c = 0; c <= GRID.cols; c++) g.lineBetween(pad + c * GRID.cell, pad, pad + c * GRID.cell, pad + GRID.rows * GRID.cell)
      for (let r = 0; r <= GRID.rows; r++) g.lineBetween(pad, pad + r * GRID.cell, pad + GRID.cols * GRID.cell, pad + r * GRID.cell)
    }

    // buildings
    TOWN.forEach((b, i) => {
      const { x, y } = this.cellCenter(b)
      let clickTarget: Phaser.GameObjects.GameObject & { setInteractive: Function }

      if (hasTiles) {
        const [roofIdx, bodyIdx] = houseStyle(i)
        const body = this.add.image(x, y + 12, ASSETS.tiles.key, bodyIdx).setScale(4)
        const roof = this.add.image(x, y + 12 - 64, ASSETS.tiles.key, roofIdx).setScale(4)
        this.buildingParts.set(b.project, [roof, body])
        clickTarget = body
      } else {
        const rect = this.add.rectangle(x, y, 110, 80, b.color).setStrokeStyle(3, 0xffffff)
        this.rects.set(b.project, rect)
        clickTarget = rect
      }

      clickTarget.setData('project', b.project)
      clickTarget.setInteractive({ useHandCursor: true })
      if (b.project === 'local-pipeline') {
        clickTarget.on('pointerdown', () => {
          this.scene.pause('Overworld')
          this.scene.launch('Interior')
        })
      }

      // label plate for readability over the art
      const label = this.add.text(x, y + 62, b.label, { fontFamily: 'monospace', fontSize: '12px', color: '#f3ead5' }).setOrigin(0.5)
      if (hasTiles) label.setBackgroundColor('#00000088').setPadding(3, 1, 3, 1)
    })

    this.status = this.add.text(40, 12, 'connecting...', { fontFamily: 'monospace', fontSize: '14px', color: '#ffcc66' })
      .setBackgroundColor('#00000088').setPadding(4, 2, 4, 2).setDepth(100)
  }

  setStatus(connected: boolean) {
    this.status.setText(connected ? 'connected ●' : 'disconnected ○ (reconnecting)')
      .setColor(connected ? '#7cf9b0' : '#ff6b6b')
  }

  setBuildingState(project: string, state: BuildingState) {
    const parts = this.buildingParts.get(project)
    if (parts) {
      for (const p of parts) {
        if (state === 'active') p.clearTint()
        else p.setTint(STATE_TINT[state])
        p.setAlpha(state === 'idle' ? 0.7 : 1)
      }
      return
    }
    const rect = this.rects.get(project)
    if (!rect) return
    const base = buildingFor(project)!.color
    rect.setFillStyle(state === 'fire' || state === 'construction' || state === 'stale' ? STATE_TINT[state] : base)
    rect.setAlpha(state === 'idle' ? 0.6 : 1)
  }

  private gateFor(project: string) {
    const b = buildingFor(project)
    if (!b) return { x: 60, y: 60 }
    const c = this.cellCenter(b)
    return { x: c.x, y: c.y + 40 }
  }

  upsertWorker(actor: string, project: string, activity: import('../../shared/types').WorkerActivity) {
    if (activity === 'leave') {
      const w = this.workers.get(actor)
      if (w) { w.moveTo(40, this.scale.height - 40); this.time.delayedCall(750, () => w.destroy()) }
      this.workers.delete(actor)
      return
    }
    let w = this.workers.get(actor)
    const gate = this.gateFor(project)
    if (!w) { w = new Worker(this, 40, this.scale.height - 40); this.workers.set(actor, w) }
    w.moveTo(gate.x, gate.y)
    w.setActivity(activity)
  }

  spawnApprentice(project: string) {
    const gate = this.gateFor(project)
    const a = new Worker(this, gate.x - 20, gate.y + 16)
    a.setActivity('bustle')
    this.time.delayedCall(2500, () => { a.moveTo(40, this.scale.height - 40); this.time.delayedCall(750, () => a.destroy()) })
  }

  sendCaravan(project: string, phase: 'depart' | 'arrive') {
    const gate = this.gateFor(project)
    const depot = { x: this.scale.width - 60, y: 60 } // central market/warehouse
    const from = phase === 'depart' ? gate : depot
    const to = phase === 'depart' ? depot : gate
    const crate = this.add.rectangle(from.x, from.y, 16, 12, 0xc9a06a).setStrokeStyle(2, 0x000000)
    this.tweens.add({
      targets: crate, x: to.x, y: to.y, duration: 1400, ease: 'Sine.easeInOut',
      onComplete: () => crate.destroy(),
    })
  }

  playEffect(project: string, effect: 'sparkle' | 'banner_ok') {
    const b = buildingFor(project)
    if (!b) return
    const c = this.cellCenter(b)
    const fx = this.add.text(c.x, c.y - 60, effect === 'banner_ok' ? '✓' : '✦', {
      fontSize: '22px',
      color: effect === 'banner_ok' ? '#7cf9b0' : '#ffe066',
    }).setOrigin(0.5).setDepth(50)
    this.tweens.add({ targets: fx, y: c.y - 90, alpha: 0, duration: 900, onComplete: () => fx.destroy() })
  }
}
