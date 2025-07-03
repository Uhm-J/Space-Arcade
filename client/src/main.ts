import { initEngine, renderer, world, scene, camera } from './core/engine'
import { createSpaceship, updateSpaceship } from './entities/spaceship'
import { createAsteroidField, syncAsteroids } from './entities/asteroid'
import { createSpaceStation } from './entities/spaceStation'
import { syncMineralChunks } from './entities/mineralChunk'
import { createCrosshair, updateCamera } from './systems/cameraSystem'
import { shootBullet, updateBullets } from './systems/bulletSystem'
import { setupInput } from './controls/input'
import { updateUI } from './ui/hud'
import { fixedTimeStep } from './config/constants'
import { NetworkManager } from './network/connection'
import { LobbyMenu } from './ui/lobbyMenu'
import { MultiplayerManager } from './systems/multiplayerManager'

console.log('🎮 Space Arcade loading...')

// Initialize multiplayer system
const networkManager = new NetworkManager()
const lobbyMenu = new LobbyMenu(networkManager)
const multiplayerManager = new MultiplayerManager(networkManager)

// Initialize engine but don't start game yet
initEngine()
createSpaceStation()
createCrosshair()
updateUI()

let gameStarted = false

// Show lobby menu first
lobbyMenu.setOnGameStart(() => {
  console.log('🚀 Starting multiplayer game...')
  gameStarted = true
  
  // Create ship based on player role
  const playerRole = networkManager.playerRole
  if (playerRole) {
    createSpaceship(playerRole)
    setupInput(shootBullet, networkManager)
    multiplayerManager.startGame()
  }
})

function animate() {
  requestAnimationFrame(animate)
  
  if (gameStarted) {
    world.step(fixedTimeStep)
    syncAsteroids()
    syncMineralChunks()
    updateSpaceship(fixedTimeStep)
    updateBullets(fixedTimeStep)
    updateCamera()
    multiplayerManager.update(fixedTimeStep)
  }
  
  renderer.render(scene, camera)
}

animate()