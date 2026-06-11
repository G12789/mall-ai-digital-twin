import { useMemo } from 'react'
import * as THREE from 'three'
import type { MallUnit } from '../../../shared/types/database'

interface UnitEdgeLinesProps {
  unit: MallUnit
  yOffset: number
  isSelected: boolean
}

export default function UnitEdgeLines({ unit, yOffset, isSelected }: UnitEdgeLinesProps) {
  const lineObj = useMemo(() => {
    if (!unit.polygon_geojson?.coordinates?.[0]) return null
    const ring = unit.polygon_geojson.coordinates[0]
    const pts = ring.length > 1
      && ring[0][0] === ring[ring.length - 1][0]
      && ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring

    if (pts.length < 3) return null

    const vertices: THREE.Vector3[] = pts.map((p) => new THREE.Vector3(p[0], 0, -p[1]))
    // Close loop
    vertices.push(new THREE.Vector3(pts[0][0], 0, -pts[0][1]))

    const geometry = new THREE.BufferGeometry().setFromPoints(vertices)
    const material = new THREE.LineBasicMaterial({
      color: isSelected ? '#00e5ff' : '#999999',
      transparent: true,
      opacity: isSelected ? 1 : 0.5,
      depthTest: true,
    })

    return new THREE.Line(geometry, material)
  }, [unit.polygon_geojson, isSelected])

  if (!lineObj) return null

  return <primitive object={lineObj} position={[0, yOffset, 0]} />
}
