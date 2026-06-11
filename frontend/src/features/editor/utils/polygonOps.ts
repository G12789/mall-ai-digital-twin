// Calculate polygon area using Shoelace formula
export function calcPolygonArea(points: [number, number][]): number {
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i][0] * points[j][1]
    area -= points[j][0] * points[i][1]
  }
  return Math.abs(area) / 2
}

// Calculate centroid of polygon
export function calcCentroid(points: [number, number][]): [number, number] {
  let cx = 0, cy = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const cross = points[i][0] * points[j][1] - points[j][0] * points[i][1]
    cx += (points[i][0] + points[j][0]) * cross
    cy += (points[i][1] + points[j][1]) * cross
  }
  const area = calcPolygonArea(points)
  const factor = 1 / (6 * area)
  return [cx * factor, cy * factor]
}

// Check if a point is inside a polygon (ray casting)
export function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  let inside = false
  const [x, y] = point
  const n = polygon.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}
