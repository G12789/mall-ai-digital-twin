import * as THREE from 'three'

const DEFAULT_SCALE = 0.01

export function geojsonCoordsToShape(coordinates: number[][][]): THREE.Shape | null {
  const outerRing = coordinates[0]
  if (!outerRing || outerRing.length < 4) return null

  const shape = new THREE.Shape()
  shape.moveTo(outerRing[0][0], -outerRing[0][1])
  for (let i = 1; i < outerRing.length - 1; i++) {
    shape.lineTo(outerRing[i][0], -outerRing[i][1])
  }
  shape.closePath()

  for (let h = 1; h < coordinates.length; h++) {
    const holeRing = coordinates[h]
    if (!holeRing || holeRing.length < 4) continue
    const hole = new THREE.Path()
    hole.moveTo(holeRing[0][0], -holeRing[0][1])
    for (let j = 1; j < holeRing.length - 1; j++) {
      hole.lineTo(holeRing[j][0], -holeRing[j][1])
    }
    shape.holes.push(hole)
  }

  return shape
}

export function extrudeShapeGeometry(shape: THREE.Shape, height: number): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  })
}

export function getShapeCentroid(shape: THREE.Shape): [number, number] {
  const points = shape.getPoints()
  let cx = 0, cy = 0
  points.forEach(p => { cx += p.x; cy += p.y })
  return [cx / points.length, cy / points.length]
}

export function scaleAndCenterGroup(
  group: THREE.Group,
  shape: THREE.Shape,
  targetWidth: number,
): void {
  const bbox = new THREE.Box3().setFromObject(group)
  const size = new THREE.Vector3()
  bbox.getSize(size)
  const scale = targetWidth / Math.max(size.x, size.z, 1)
  group.scale.setScalar(scale)
}

export { DEFAULT_SCALE }
