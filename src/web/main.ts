import Phaser from 'phaser'
import { connectTown } from './ws-client'
import { OverworldScene } from './scenes/OverworldScene'
import { InteriorScene } from './scenes/InteriorScene'

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0d1117',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  scene: [OverworldScene, InteriorScene],
})

game.scene.start('Overworld')

const overworld = () => game.scene.getScene('Overworld') as OverworldScene
const interior = () => game.scene.getScene('Interior') as InteriorScene | null

connectTown({
  onStatus: (c) => overworld()?.setStatus(c),
  onSnapshot: (snap) => {
    for (const [project, state] of Object.entries(snap.buildings)) overworld()?.setBuildingState(project, state)
    for (const [actor, w] of Object.entries(snap.workers)) overworld()?.upsertWorker(actor, w.project, w.activity)
  },
  onActions: (actions) => {
    for (const a of actions) {
      if (a.type === 'building') overworld()?.setBuildingState(a.project, a.state)
      else if (a.type === 'worker') {
        overworld()?.upsertWorker(a.actor, a.project, a.activity)
        if (a.project === InteriorScene.PROJECT && game.scene.isActive('Interior')) {
          interior()?.upsertWorker(a.actor, a.activity)
        }
      }
      else if (a.type === 'apprentice') overworld()?.spawnApprentice(a.project)
      else if (a.type === 'caravan') overworld()?.sendCaravan(a.project, a.phase)
      else if (a.type === 'effect') overworld()?.playEffect(a.project, a.effect)
    }
  },
})
