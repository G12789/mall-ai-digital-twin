import { useMemo, useCallback } from 'react'
import * as THREE from 'three'
import type { MallUnit } from '../../../shared/types/database'
import type { VisualMode } from './SceneCanvas'
import { geojsonCoordsToShape, extrudeShapeGeometry } from '../utils/geojsonToMesh'
import { createUnitMaterial, createHighlightMaterial } from '../utils/materialFactory'
import { getUnitColor } from '../utils/unitColorMapping'

const HEATMAP_GRADIENT = [
  new THREE.Color('#52c41a'),  // green = healthy
  new THREE.Color('#a0d911'),
  new THREE.Color('#faad14'),  // yellow = warning
  new THREE.Color('#fa8c16'),
  new THREE.Color('#ff4d4f'),  // red = critical
]

function heatmapColor(value: number, min = 0, max = 100): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const idx = t * (HEATMAP_GRADIENT.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.min(lo + 1, HEATMAP_GRADIENT.length - 1)
  const frac = idx - lo
  const color = HEATMAP_GRADIENT[lo].clone().lerp(HEATMAP_GRADIENT[hi], frac)
  return '#' + color.getHexString()
}

interface UnitPolygonProps {
  unit: MallUnit
  yOffset: number
  isSelected: boolean
  visualMode: VisualMode
  heatValue?: number
  onSelect: () => void
}

export default function UnitPolygon({ unit, yOffset, isSelected, visualMode, heatValue, onSelect }: UnitPolygonProps) {
  const geometry = useMemo(() => {
    if (!unit.polygon_geojson?.coordinates) return null
    const shape = geojsonCoordsToShape(unit.polygon_geojson.coordinates)
    if (!shape) return null
    return extrudeShapeGeometry(shape, 0.08)
  }, [unit.polygon_geojson])

  const material = useMemo(() => {
    if (isSelected) return createHighlightMaterial()

    if (visualMode === 'heatmap' && heatValue !== undefined) {
      return new THREE.MeshStandardMaterial({
        color: heatmapColor(heatValue),
        roughness: 0.4,
        metalness: 0.1,
        transparent: true,
        opacity: 0.8,
        emissive: heatmapColor(heatValue),
        emissiveIntensity: 0.15,
      })
    }

    return createUnitMaterial(getUnitColor(unit.status))
  }, [isSelected, visualMode, heatValue, unit.status])

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    onSelect()
  }, [onSelect])

  if (!geometry) return null

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, yOffset, 0]}
      onClick={handleClick}
      castShadow
      receiveShadow
    />
  )
}
