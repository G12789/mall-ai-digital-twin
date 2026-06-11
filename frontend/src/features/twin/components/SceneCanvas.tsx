import { Suspense, useRef, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import type { Floor, MallUnit } from '../../../shared/types/database'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import FloorMesh from './FloorMesh'
import UnitPolygon from './UnitPolygon'
import UnitEdgeLines from './UnitEdgeLines'
import PulseHighlight from './PulseHighlight'
import CameraController from './CameraController'
import { createFloorGridTexture } from '../utils/gridTexture'
import { geojsonCoordsToShape, extrudeShapeGeometry } from '../utils/geojsonToMesh'

const FLOOR_SPACING = 5

export type VisualMode = 'status' | 'heatmap' | 'occupancy'

interface SceneCanvasProps {
  floors: Floor[]
  units: MallUnit[]
  activeFloorIndex: number
  selectedUnitId: string | null
  visualMode: VisualMode
  is2DMode: boolean
  onUnitSelect: (id: string | null) => void
  searchTarget: THREE.Vector3 | null
  onControlsReady?: (controls: OrbitControlsImpl) => void
}

function SceneContent({
  floors, units, activeFloorIndex, selectedUnitId, visualMode, is2DMode,
  onUnitSelect, searchTarget, onControlsReady,
}: SceneCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const gridTexture = useMemo(() => createFloorGridTexture(), [])

  const activeFloor = floors[activeFloorIndex]
  const activeUnits = activeFloor
    ? units.filter((u) => u.floor_id === activeFloor.id)
    : []

  // Heatmap values
  const heatValues = useMemo(() => {
    if (visualMode !== 'heatmap') return new Map<string, number>()
    const map = new Map<string, number>()
    activeUnits.forEach((u) => {
      const status = u.status || 'vacant'
      if (status === 'vacant') map.set(u.id, 85)
      else if (status === 'reserved') map.set(u.id, 50)
      else if (status === 'renovation') map.set(u.id, 30)
      else map.set(u.id, 10)
    })
    return map
  }, [activeUnits, visualMode])

  const selectedUnit = activeUnits.find((u) => u.id === selectedUnitId)
  const selectedCentroid: [number, number, number] | null = selectedUnit?.centroid_geojson?.coordinates
    ? [selectedUnit.centroid_geojson.coordinates[0], 0.3, -selectedUnit.centroid_geojson.coordinates[1]]
    : null

  // Building exterior walls (connects floor edges into a "building")
  const buildingWalls = useMemo(() => {
    const wallMeshes: { pos: [number, number, number]; geo: THREE.BufferGeometry }[] = []
    if (floors.length === 0) return wallMeshes

    // Use the ground floor boundary for the building footprint
    const groundFloor = floors[0]
    if (!groundFloor?.geojson_boundary?.coordinates) return wallMeshes

    const shape = geojsonCoordsToShape(groundFloor.geojson_boundary.coordinates)
    if (!shape) return wallMeshes

    // Extrude a tall thin wall from ground to top floor
    const totalHeight = floors.length * FLOOR_SPACING + 2
    const wallGeo = extrudeShapeGeometry(shape, totalHeight)
    wallMeshes.push({ pos: [0, -0.5, 0], geo: wallGeo })

    return wallMeshes
  }, [floors])

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[30, 50, 25]}
        intensity={0.9}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.00005}
      />
      <hemisphereLight args={['#ffffff', '#b0b5c0', 0.3]} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color="#e8ecf1" roughness={0.9} map={gridTexture} />
      </mesh>

      {/* Building exterior walls (semi-transparent) */}
      {!is2DMode && buildingWalls.map((wall, i) => (
        <mesh key={`wall-${i}`} geometry={wall.geo} position={wall.pos} castShadow receiveShadow>
          <meshStandardMaterial
            color="#c8cdd5"
            roughness={0.8}
            metalness={0.05}
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Floor slabs: active ± 1 (all in 2D mode) */}
      {floors.map((floor, i) => {
        const distance = Math.abs(i - activeFloorIndex)
        if (!is2DMode && distance > 1) return null
        return (
          <group key={floor.id}>
            <FloorMesh
              floor={floor}
              yOffset={i * FLOOR_SPACING}
              opacity={is2DMode ? 0.9 : distance === 0 ? 1 : 0.25}
              gridTexture={gridTexture}
            />
          </group>
        )
      })}

      {/* Unit polygons */}
      {activeUnits.map((unit) => (
        <group key={unit.id}>
          <UnitPolygon
            unit={unit}
            yOffset={activeFloorIndex * FLOOR_SPACING + (activeFloor?.extrude_height_m || 0.5)}
            isSelected={unit.id === selectedUnitId}
            visualMode={visualMode}
            heatValue={heatValues.get(unit.id)}
            onSelect={() => onUnitSelect(unit.id === selectedUnitId ? null : unit.id)}
          />
          <UnitEdgeLines
            unit={unit}
            yOffset={activeFloorIndex * FLOOR_SPACING + (activeFloor?.extrude_height_m || 0.5) + 0.085}
            isSelected={unit.id === selectedUnitId}
          />
        </group>
      ))}

      {selectedCentroid && (
        <PulseHighlight
          active={!!selectedUnitId}
          position={[
            selectedCentroid[0],
            activeFloorIndex * FLOOR_SPACING + (activeFloor?.extrude_height_m || 0.5) + 0.12,
            selectedCentroid[2],
          ]}
          size={2.5}
        />
      )}

      <CameraController
        ref={controlsRef}
        defaultTarget={[0, activeFloorIndex * FLOOR_SPACING + 2, 0]}
        defaultPosition={is2DMode ? [0, activeFloorIndex * FLOOR_SPACING + 40, 0.1] : [25, activeFloorIndex * FLOOR_SPACING + 15, 25]}
        isOrthographic={is2DMode}
        searchTarget={searchTarget}
        onReady={onControlsReady}
      />
    </>
  )
}

export default function SceneCanvas(props: SceneCanvasProps) {
  const { is2DMode } = props

  return (
    <Canvas
      camera={{ position: [25, 15, 25], fov: 50, near: 0.5, far: 200 }}
      orthographic={is2DMode}
      shadows="soft"
      style={{ width: '100%', height: '100%', background: '#e8ecf1' }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
    >
      <Suspense fallback={null}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  )
}

export { FLOOR_SPACING }
