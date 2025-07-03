import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { scene } from '../core/engine'
import { shipAcceleration, shipMaxSpeed, shipDamping } from '../config/constants'
import { inputState } from '../controls/input'

export const spaceships: THREE.Object3D[] = []
export let shipVelocity = new THREE.Vector3()

export function createSpaceship() {
  const loader = new GLTFLoader()
  loader.load(
    '/models/spaceship/ship1.glb',
    (gltf) => {
      const ship = gltf.scene
      ship.position.set(0, 0, 0)
      ship.scale.set(5, 5, 5)
      ship.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      scene.add(ship)
      spaceships.push(ship)
    },
    undefined,
    (error) => {
      console.error('Error loading ship model:', error)
      const geometry = new THREE.BoxGeometry(2, 1, 4)
      const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 })
      const fallback = new THREE.Mesh(geometry, material)
      fallback.position.set(0, 0, 0)
      fallback.castShadow = true
      scene.add(fallback)
      spaceships.push(fallback)
    }
  )
}

export function updateSpaceship(dt: number) {
  if (spaceships.length === 0) return
  const ship = spaceships[0]

  // Rotation
  const rotationQuat = new THREE.Quaternion()
  rotationQuat.setFromEuler(
    new THREE.Euler(inputState.shipRotationX, inputState.shipRotationY, 0, 'YXZ')
  )
  ship.quaternion.copy(rotationQuat)

  // Translation
  const accel = new THREE.Vector3()
  if (inputState.moveForward) accel.z -= 1
  if (inputState.moveBackward) accel.z += 1
  if (inputState.moveLeft) accel.x -= 1
  if (inputState.moveRight) accel.x += 1
  if (inputState.moveUp) accel.y += 1
  if (inputState.moveDown) accel.y -= 1

  if (accel.lengthSq() > 0) {
    accel.normalize()
    accel.applyQuaternion(ship.quaternion)
    accel.multiplyScalar(shipAcceleration * dt)
    shipVelocity.add(accel)
  }

  if (shipVelocity.length() > shipMaxSpeed) shipVelocity.setLength(shipMaxSpeed)
  shipVelocity.multiplyScalar(shipDamping)
  ship.position.add(shipVelocity.clone().multiplyScalar(dt))
}