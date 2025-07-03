import { initEngine, renderer, world, scene, camera } from './core/engine'
import { createSpaceship, updateSpaceship } from './entities/spaceship'
import { createAsteroidField, syncAsteroids } from './entities/asteroid'
import { createCrosshair, updateCamera } from './systems/cameraSystem'
import { shootBullet, updateBullets } from './systems/bulletSystem'
import { setupInput } from './controls/input'
import { updateUI } from './ui/hud'
import { fixedTimeStep } from './config/constants'

console.log('🎮 Space Arcade loading...')

initEngine()
createSpaceship()
createAsteroidField()
createCrosshair()
setupInput(shootBullet)
updateUI()

function animate() {
  requestAnimationFrame(animate)
  world.step(fixedTimeStep)
  syncAsteroids()
  updateSpaceship(fixedTimeStep)
  updateBullets(fixedTimeStep)
  updateCamera()
  renderer.render(scene, camera)
}

animate()