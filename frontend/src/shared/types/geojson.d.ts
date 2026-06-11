declare namespace GeoJSON {
  type Position = [number, number] | [number, number, number]
  type Point = { type: 'Point'; coordinates: Position }
  type MultiPoint = { type: 'MultiPoint'; coordinates: Position[] }
  type LineString = { type: 'LineString'; coordinates: Position[] }
  type MultiLineString = { type: 'MultiLineString'; coordinates: Position[][] }
  type Polygon = { type: 'Polygon'; coordinates: Position[][] }
  type MultiPolygon = { type: 'MultiPolygon'; coordinates: Position[][][] }
  type Geometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon
  type GeometryCollection = { type: 'GeometryCollection'; geometries: Geometry[] }
}
