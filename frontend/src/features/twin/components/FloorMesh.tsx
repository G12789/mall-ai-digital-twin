import { useMemo } from 'react'
import * as THREE from 'three'
import type { Floor } from '../../../shared/types/database'
import { geojsonCoordsToShape, extrudeShapeGeometry } from '../utils/geojsonToMesh'
import { createFloorMaterial } from '../utils/materialFactory'

interface FloorMeshProps {
  floor: Floor
  yOffset: number
  opacity?: number
  gridTexture?: THREE.Texture
}

export default function FloorMesh({ floor, yOffset, opacity = 1, gridTexture }: FloorMeshProps) {
  const geometry = useMemo(() => {
    if (floor.geojson_boundary?.coordinates) {
      const shape = geojsonCoordsToShape(floor.geojson_boundary.coordinates)
      if (shape) return extrudeShapeGeometry(shape, floor.extrude_height_m || 0.5)
    }
    return new THREE.BoxGeometry(30, floor.extrude_height_m || 0.5, 20)
  }, [floor.geojson_boundary, floor.extrude_height_m])

  const material = useMemo(() => createFloorMaterial({ opacity }), [opacity])

  // Create a thin grid overlay plane on top of the floor
  const overlayGeo = useMemo(() => {
    // Clone top face of the extruded geometry or create a simple plane
    return new THREE.PlaneGeometry(30, 20)
  }, [])

  const overlayMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: gridTexture,
      roughness: 0.6,
      metalness: 0.05,
      transparent: true,
      opacity: 0.15 * (opacity),
      depthWrite: false,
    })
    return mat
  }, [gridTexture, opacity])

  return (
    <group>
      {/* Floor slab */}
      <mesh
        geometry={geometry}
        material={material}
        position={[0, yOffset, 0]}
        receiveShadow
        castShadow
      />
      {/* Grid overlay on top surface */}
      {gridTexture && (
        <mesh
          geometry={overlayGeo}
          material={overlayMaterial}
          position={[0, yOffset + (floor.extrude_height_m || 0.5) + 0.005, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      )}
    </group>
  )
}
