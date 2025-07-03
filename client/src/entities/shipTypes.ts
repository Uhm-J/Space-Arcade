import * as THREE from 'three'

export interface ShipConfig {
  role: 'shooter' | 'hauler'
  acceleration: number
  maxSpeed: number
  damping: number
  color: number
  scale: number
  weapons: string[]
  specialAbilities: string[]
}

export const SHIP_CONFIGS: Record<'shooter' | 'hauler', ShipConfig> = {
  shooter: {
    role: 'shooter',
    acceleration: 80,      // Fast and agile
    maxSpeed: 25,
    damping: 0.98,
    color: 0xff4444,       // Red-ish
    scale: 4,              // Smaller
    weapons: ['laser', 'railgun'],
    specialAbilities: ['rapid_fire', 'precision_targeting']
  },
  
  hauler: {
    role: 'hauler',
    acceleration: 40,      // Slower but steady
    maxSpeed: 15,
    damping: 0.95,
    color: 0x4444ff,       // Blue-ish
    scale: 6,              // Larger
    weapons: ['mining_beam'],
    specialAbilities: ['tractor_beam', 'cargo_expansion']
  }
}

export function createShipGeometry(role: 'shooter' | 'hauler'): THREE.Mesh {
  const config = SHIP_CONFIGS[role]
  
  let geometry: THREE.BufferGeometry
  
  if (role === 'shooter') {
    // Sharp, angular fighter design
    geometry = new THREE.ConeGeometry(0.5, 2, 8)
  } else {
    // Bulky hauler design
    geometry = new THREE.BoxGeometry(2, 1, 3)
  }
  
  const material = new THREE.MeshPhongMaterial({ 
    color: config.color,
    shininess: 100
  })
  
  const mesh = new THREE.Mesh(geometry, material)
  mesh.scale.setScalar(config.scale)
  mesh.castShadow = true
  mesh.receiveShadow = true
  
  // Add role indicator
  const indicatorGeometry = new THREE.SphereGeometry(0.2, 8, 8)
  const indicatorMaterial = new THREE.MeshStandardMaterial({ 
    color: role === 'shooter' ? 0xffff00 : 0x00ffff,
    emissive: role === 'shooter' ? 0xffff00 : 0x00ffff,
    emissiveIntensity: 0.3
  })
  const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
  indicator.position.set(0, 2, 0)
  mesh.add(indicator)
  
  return mesh
}

export function getShipConfig(role: 'shooter' | 'hauler'): ShipConfig {
  return SHIP_CONFIGS[role]
}