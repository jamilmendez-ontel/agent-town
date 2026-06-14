import Phaser from 'phaser'
import type { WorkerActivity } from '../../shared/types'

const ACTIVITY_COLOR: Record<WorkerActivity, number> = {
  enter: 0xffd34d,
  craft: 0xff944d,
  research: 0x4dd2ff,
  machinery: 0xb0b0b0,
  leave: 0x888888,
  bustle: 0xffffff,
}

// A worker is a small body + a floating label showing its current activity.
export class Worker {
  body: Phaser.GameObjects.Arc
  private label: Phaser.GameObjects.Text
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene
    this.body = scene.add.circle(x, y, 8, ACTIVITY_COLOR.enter).setStrokeStyle(2, 0x000000)
    this.label = scene.add.text(x, y - 16, '', { fontFamily: 'monospace', fontSize: '10px', color: '#e8f0f8' }).setOrigin(0.5)
  }

  moveTo(x: number, y: number) {
    this.scene.tweens.add({ targets: [this.body], x, y, duration: 700, ease: 'Sine.easeInOut' })
    this.scene.tweens.add({ targets: [this.label], x, y: y - 16, duration: 700, ease: 'Sine.easeInOut' })
  }

  setActivity(activity: WorkerActivity) {
    this.body.setFillStyle(ACTIVITY_COLOR[activity])
    this.label.setText(activity)
    // brief pulse to signal "something happened"
    this.scene.tweens.add({ targets: this.body, scale: 1.4, duration: 120, yoyo: true })
  }

  destroy() { this.body.destroy(); this.label.destroy() }
}
