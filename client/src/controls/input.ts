import { renderer } from '../core/engine'
import { mouseSensitivity } from '../config/constants'

export interface InputState {
  moveForward: boolean
  moveBackward: boolean
  moveLeft: boolean
  moveRight: boolean
  moveUp: boolean
  moveDown: boolean
  shipRotationX: number
  shipRotationY: number
  fire: boolean
  tractor: boolean
}

export const inputState: InputState = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  moveUp: false,
  moveDown: false,
  shipRotationX: 0,
  shipRotationY: 0,
  fire: false,
  tractor: false,
}

export let isPointerLocked = false

export function setupInput(shootCallback: () => void, networkManager?: any) {
  window.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
      // Try to lock pointer on first click
      if (!isPointerLocked) {
        renderer.domElement.requestPointerLock()
        return
      }
      inputState.fire = true
      shootCallback()
    }
  })

  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) {
      inputState.fire = false
    }
  })

  window.addEventListener('mousemove', (event) => {
    if (!isPointerLocked) return
    const dx = event.movementX || 0
    const dy = event.movementY || 0
    inputState.shipRotationY -= dx * mouseSensitivity
    inputState.shipRotationX -= dy * mouseSensitivity
  })

  window.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'KeyW':
        inputState.moveForward = true
        break
      case 'KeyS':
        inputState.moveBackward = true
        break
      case 'KeyA':
        inputState.moveLeft = true
        break
      case 'KeyD':
        inputState.moveRight = true
        break
      case 'Space':
        inputState.moveUp = true
        break
      case 'ControlLeft':
      case 'ControlRight':
        inputState.moveDown = true
        break
      case 'KeyF':
        inputState.tractor = true // Tractor beam for hauler ships
        break
      case 'Escape':
        if (isPointerLocked) document.exitPointerLock()
        break
    }
  })

  window.addEventListener('keyup', (event) => {
    switch (event.code) {
      case 'KeyW':
        inputState.moveForward = false
        break
      case 'KeyS':
        inputState.moveBackward = false
        break
      case 'KeyA':
        inputState.moveLeft = false
        break
      case 'KeyD':
        inputState.moveRight = false
        break
      case 'Space':
        inputState.moveUp = false
        break
      case 'ControlLeft':
      case 'ControlRight':
        inputState.moveDown = false
        break
      case 'KeyF':
        inputState.tractor = false
        break
    }
  })

  document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === renderer.domElement
  })

  document.addEventListener('pointerlockerror', () => {
    console.error('Pointer lock failed')
  })
}