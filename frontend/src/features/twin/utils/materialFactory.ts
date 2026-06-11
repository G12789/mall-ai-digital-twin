import * as THREE from 'three'

export function createFloorMaterial(opts?: { opacity?: number }): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: '#e8e8e8',
    roughness: 0.75,
    metalness: 0.05,
    transparent: true,
    opacity: opts?.opacity ?? 1,
  })
}

export function createUnitMaterial(color: string, opts?: { opacity?: number }): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.15,
    transparent: true,
    opacity: opts?.opacity ?? 0.75,
  })
}

export function createHighlightMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: '#00e5ff',
    roughness: 0.3,
    metalness: 0.4,
    emissive: '#00e5ff',
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.85,
  })
}

export function createGroundMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: '#cccccc',
    roughness: 0.9,
    metalness: 0,
  })
}
