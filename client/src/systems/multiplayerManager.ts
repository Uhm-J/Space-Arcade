import { NetworkManager } from '../network/connection'
import { spaceships } from '../entities/spaceship'
import { createShipGeometry } from '../entities/shipTypes'
import * as THREE from 'three'
import { inputState } from '../controls/input'
import { scene } from '../core/engine'

export class MultiplayerManager {
  private networkManager: NetworkManager
  private otherPlayers: Map<number, THREE.Mesh> = new Map()
  private remoteAsteroids: Map<number, THREE.Mesh> = new Map()
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
      } else if (entity.type === 'asteroid') {
        this.updateAsteroid(entity)
      }
    }

    // Remove asteroids no longer present
    const idsInState = new Set(entities.filter((e) => e.type === 'asteroid').map((e) => e.id))
    for (const [id, mesh] of this.remoteAsteroids) {
      if (!idsInState.has(id)) {
        scene.remove(mesh)
        this.remoteAsteroids.delete(id)
      }
    }
  }

  private updateOtherPlayer(playerEntity: any) {
    const id = playerEntity.id
    let ship = this.otherPlayers.get(id) as THREE.Mesh | undefined
    if (!ship) {
      // Create ship mesh for remote player
      const role = playerEntity.role || 'shooter'
      ship = await new Promise<THREE.Object3D>((resolve) => {
        const loader = new (await import('three/examples/jsm/loaders/GLTFLoader')).GLTFLoader()
        loader.load('/models/spaceship/ship1.glb', (gltf: any) => {
          const obj = gltf.scene
          obj.scale.setScalar(role === 'shooter' ? 4 : 6)
          resolve(obj)
        }, undefined, () => {
          resolve(createShipGeometry(role))
        })
      }) as THREE.Mesh
      ship.visible = true
      // Slightly dim remote player ships
      ;(ship.material as any).opacity = 0.8
      ;(ship.material as any).transparent = true
      // Add to scene
      scene.add(ship)
      this.otherPlayers.set(id, ship)
    }

    // Update position and rotation
    ship.position.set(playerEntity.x, playerEntity.y, playerEntity.z)
    ship.rotation.set(playerEntity.pitch || 0, playerEntity.yaw || 0, 0)
  }

  private updateAsteroid(entity: any) {
    let mesh = this.remoteAsteroids.get(entity.id)
    if (!mesh) {
      const geometry = new THREE.IcosahedronGeometry(2, 1)
      const material = new THREE.MeshPhongMaterial({ color: 0x888888 })
      mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)
      this.remoteAsteroids.set(entity.id, mesh)
    }
    mesh.position.set(entity.x, entity.y, entity.z)
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
      tractor: inputState.tractor || false,
      x: ship.position.x,
      y: ship.position.y,
      z: ship.position.z
    })
  }

  private getThrottleInput(): number {
    let throttle = 0
    if (inputState.moveForward) throttle += 1
    if (inputState.moveBackward) throttle -= 1
    return throttle
  }
}