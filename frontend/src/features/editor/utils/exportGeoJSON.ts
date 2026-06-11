import type { EditorPolygon } from '../store/editorStore'
import { calcPolygonArea, calcCentroid } from './polygonOps'

export interface GeoJSONExport {
  type: 'FeatureCollection'
  features: {
    type: 'Feature'
    geometry: {
      type: 'Polygon'
      coordinates: number[][][]
    }
    properties: {
      id: string
      unit_code: string
      category: string
      area_sqm: number
      status: string
      centroid: [number, number]
    }
  }[]
}

export function exportToGeoJSON(polygons: EditorPolygon[]): GeoJSONExport {
  return {
    type: 'FeatureCollection',
    features: polygons.map((p) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[...p.points.map(([x, y]) => [x, y]), p.points[0] ? [p.points[0][0], p.points[0][1]] : [0, 0]]],
      },
      properties: {
        id: p.id,
        unit_code: p.unitCode,
        category: p.category,
        area_sqm: calcPolygonArea(p.points),
        status: p.status,
        centroid: calcCentroid(p.points),
      },
    })),
  }
}

// Convert single editor polygon to GeoJSON Polygon for database
export function polygonToGeoJSON(points: [number, number][]): {
  type: 'Polygon'
  coordinates: number[][][]
} {
  const closed = points.length > 0
    ? [...points, points[0]]
    : points
  return {
    type: 'Polygon',
    coordinates: [closed.map(([x, y]) => [x, y])],
  }
}

export function loadFromGeoJSON(geojson: GeoJSONExport): EditorPolygon[] {
  return geojson.features.map((f) => ({
    id: f.properties.id || crypto.randomUUID(),
    points: f.geometry.coordinates[0].slice(0, -1).map(([x, y]) => [x, y] as [number, number]),
    unitCode: f.properties.unit_code,
    category: f.properties.category,
    areaSqm: f.properties.area_sqm,
    status: f.properties.status,
  }))
}
