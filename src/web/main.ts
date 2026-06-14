import Phaser from 'phaser'
import { connectTown } from './ws-client'
import { OverworldScene } from './scenes/OverworldScene'

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0d1117',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  scene: [OverworldScene],
})

game.scene.start('Overworld')

const overworld = () => game.scene.getScene('Overworld') as OverworldScene

connectTown({
  onStatus: (c) => overworld()?.setStatus(c),
  onSnapshot: (snap) => {
    for (const [project, state] of Object.entries(snap.buildings)) overworld()?.setBuildingState(project, state)
  },
  onActions: (actions) => {
    for (const a of actions) {
      if (a.type === 'building') overworld()?.setBuildingState(a.project, a.state)
    }
  },
})
