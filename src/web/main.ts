import Phaser from 'phaser'
import { connectTown } from './ws-client'

class BootScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text
  private log: string[] = []
  private logText!: Phaser.GameObjects.Text

  constructor() { super('Boot') }

  create() {
    this.add.text(16, 16, 'agent-town', { fontFamily: 'monospace', fontSize: '24px', color: '#7cf9b0' })
    this.statusText = this.add.text(16, 48, 'connecting...', { fontFamily: 'monospace', fontSize: '14px', color: '#ffcc66' })
    this.logText = this.add.text(16, 80, '', { fontFamily: 'monospace', fontSize: '13px', color: '#cdd9e5' })

    connectTown({
      onStatus: (c) => this.statusText.setText(c ? 'connected ●' : 'disconnected ○ (reconnecting)').setColor(c ? '#7cf9b0' : '#ff6b6b'),
      onSnapshot: (snap) => this.pushLog(`snapshot: ${Object.keys(snap.buildings).length} buildings, ${Object.keys(snap.workers).length} workers`),
      onActions: (actions) => actions.forEach((a) => this.pushLog(JSON.stringify(a))),
    })
  }

  private pushLog(line: string) {
    this.log.push(line)
    if (this.log.length > 24) this.log.shift()
    this.logText.setText(this.log.join('\n'))
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0d1117',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  scene: [BootScene],
})
