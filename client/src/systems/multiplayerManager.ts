import { NetworkManager } from '../network/connection'
import { spaceships } from '../entities/spaceship'
import { inputState } from '../controls/input'

export class MultiplayerManager {
  private networkManager: NetworkManager
  private otherPlayers: Map<number, any> = new Map()
  private lastInputSent: number = 0
  private inputSendRate: number = 60 // Send input 60 times per second

  constructor(networkManager: NetworkManager) {
    this.networkManager = networkManager
    this.setupNetworkHandlers()
  }

  private setupNetworkHandlers() {
    this.networkManager.setOnStateUpdate((entities) => {
      this.handleStateUpdate(entities)
    })
  }

  private handleStateUpdate(entities: any[]) {
    // Handle other players' positions and game entities
    for (const entity of entities) {
      if (entity.type === 'player' && entity.id !== this.networkManager.playerId) {
        // Update other player's position
        this.updateOtherPlayer(entity)
      }
    }
  }

  private updateOtherPlayer(playerEntity: any) {
    // TODO: Implement other player ship rendering and position updates
    console.log('Other player update:', playerEntity)
  }

  startGame() {
    console.log('🎮 Multiplayer game started!')
  }

  update(deltaTime: number) {
    // Send input to server at regular intervals
    const now = Date.now()
    if (now - this.lastInputSent > 1000 / this.inputSendRate) {
      this.sendInputToServer()
      this.lastInputSent = now
    }
  }

  private sendInputToServer() {
    if (!this.networkManager.isConnected) return

    // Get current ship (assuming first ship is player's)
    const ship = spaceships[0]
    if (!ship) return

    this.networkManager.sendInput({
      throttle: this.getThrottleInput(),
      pitch: inputState.shipRotationX,
      yaw: inputState.shipRotationY,
      fire: inputState.fire,
      tractor: inputState.tractor || false
    })
  }

  private getThrottleInput(): number {
    let throttle = 0
    if (inputState.moveForward) throttle += 1
    if (inputState.moveBackward) throttle -= 1
    return throttle
  }
}