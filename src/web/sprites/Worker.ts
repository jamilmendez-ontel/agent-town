import Phaser from 'phaser'
import type { WorkerActivity } from '../../shared/types'
import { ASSETS } from '../assets'

const ACTIVITY_COLOR: Record<WorkerActivity, number> = {
  enter: 0xffd34d,
  craft: 0xff944d,
  research: 0x4dd2ff,
  machinery: 0xb0b0b0,
  leave: 0x888888,
  bustle: 0xffffff,
}

// A worker is a small character (pixel sprite where art exists, else a colored
// circle) plus a floating label showing its current activity.
export class Worker {
  body: Phaser.GameObjects.Arc
  private sprite?: Phaser.GameObjects.Sprite
  private label: Phaser.GameObjects.Text
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene
    this.body = scene.add.circle(x, y, 8, ACTIVITY_COLOR.enter).setStrokeStyle(2, 0x000000)
    if (scene.textures.exists(ASSETS.character.key)) {
      this.sprite = scene.add.sprite(x, y, ASSETS.character.key, 0).setScale(2.5)
      this.body.setVisible(false) // keep for position fallback, hide the placeholder
    }
    this.label = scene.add.text(x, y - 18, '', { fontFamily: 'monospace', fontSize: '10px', color: '#e8f0f8' }).setOrigin(0.5)
  }

  private get visual(): Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject {
    return this.sprite ?? this.body
  }

  moveTo(x: number, y: number) {
    this.scene.tweens.add({ targets: [this.visual], x, y, duration: 700, ease: 'Sine.easeInOut' })
    this.scene.tweens.add({ targets: [this.label], x, y: y - 18, duration: 700, ease: 'Sine.easeInOut' })
  }

  setActivity(activity: WorkerActivity) {
    if (this.sprite) this.sprite.setTint(ACTIVITY_COLOR[activity])
    else this.body.setFillStyle(ACTIVITY_COLOR[activity])
    this.label.setText(activity)
    // brief pulse to signal "something happened"
    this.scene.tweens.add({ targets: this.visual, scale: this.sprite ? 3 : 1.4, duration: 120, yoyo: true })
  }

  destroy() { this.sprite?.destroy(); this.body.destroy(); this.label.destroy() }
}
