import { useRef, useEffect, useCallback } from 'react'
import { useEditorStore, type EditorPolygon } from '../store/editorStore'
import { pointInPolygon, calcPolygonArea } from '../utils/polygonOps'

const COLORS: Record<string, string> = {
  vacant: 'rgba(255, 77, 79, 0.35)',
  occupied: 'rgba(82, 196, 26, 0.25)',
  reserved: 'rgba(250, 173, 20, 0.35)',
  'off-market': 'rgba(200, 200, 200, 0.3)',
  renovation: 'rgba(22, 119, 255, 0.3)',
  selected: 'rgba(0, 229, 255, 0.5)',
  drawing: 'rgba(24, 144, 255, 0.4)',
}

const STROKE_COLORS: Record<string, string> = {
  vacant: '#ff4d4f',
  occupied: '#52c41a',
  reserved: '#faad14',
  'off-market': '#999',
  renovation: '#1677ff',
  selected: '#00e5ff',
  drawing: '#1890ff',
}

export default function FloorPlanCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const animFrameRef = useRef<number>(0)

  const {
    polygons, selectedId, drawingPoints, isDrawing,
    floorPlanUrl, floorPlanWidth, floorPlanHeight,
    addDrawingPoint, finishDrawing, selectPolygon,
  } = useEditorStore()

  // Load floor plan image
  useEffect(() => {
    if (!floorPlanUrl) return
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      draw()
    }
    img.src = floorPlanUrl
  }, [floorPlanUrl])

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY]
  }, [])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e)
    if (isDrawing) {
      // Check if clicking near first point to close
      if (drawingPoints.length >= 3) {
        const first = drawingPoints[0]
        const dist = Math.hypot(pos[0] - first[0], pos[1] - first[1])
        if (dist < 12) {
          finishDrawing()
          return
        }
      }
      addDrawingPoint(pos[0], pos[1])
    } else {
      // Check if clicking on a polygon
      for (let i = polygons.length - 1; i >= 0; i--) {
        if (pointInPolygon(pos, polygons[i].points)) {
          selectPolygon(polygons[i].id)
          return
        }
      }
      selectPolygon(null)
    }
  }, [isDrawing, drawingPoints, polygons, getCanvasCoords, addDrawingPoint, finishDrawing, selectPolygon])

  function drawPolygon(poly: EditorPolygon, isSelected: boolean) {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || poly.points.length < 3) return

    const fillKey = isSelected ? 'selected' : (poly.status || 'vacant')
    const strokeKey = isSelected ? 'selected' : (poly.status || 'vacant')

    ctx.beginPath()
    ctx.moveTo(poly.points[0][0], poly.points[0][1])
    for (let i = 1; i < poly.points.length; i++) {
      ctx.lineTo(poly.points[i][0], poly.points[i][1])
    }
    ctx.closePath()

    ctx.fillStyle = COLORS[fillKey] || COLORS.vacant
    ctx.fill()

    ctx.strokeStyle = STROKE_COLORS[strokeKey] || STROKE_COLORS.vacant
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.stroke()

    // Draw unit code label at centroid
    if (poly.unitCode) {
      const cx = poly.points.reduce((s, p) => s + p[0], 0) / poly.points.length
      const cy = poly.points.reduce((s, p) => s + p[1], 0) / poly.points.length
      ctx.fillStyle = '#000'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(poly.unitCode, cx, cy)

      // Area label
      const area = calcPolygonArea(poly.points)
      ctx.fillStyle = '#666'
      ctx.font = '10px sans-serif'
      ctx.fillText(`${area.toFixed(1)}㎡`, cx, cy + 14)
    }
  }

  function draw() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw floor plan image
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
    } else {
      ctx.fillStyle = '#f5f5f5'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ccc'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('请上传平面图', canvas.width / 2, canvas.height / 2)
    }

    // Draw existing polygons
    polygons.forEach((p) => drawPolygon(p, p.id === selectedId))

    // Draw in-progress polygon
    if (isDrawing && drawingPoints.length > 0) {
      ctx.beginPath()
      ctx.moveTo(drawingPoints[0][0], drawingPoints[0][1])
      for (let i = 1; i < drawingPoints.length; i++) {
        ctx.lineTo(drawingPoints[i][0], drawingPoints[i][1])
      }
      ctx.strokeStyle = STROKE_COLORS.drawing
      ctx.lineWidth = 2
      ctx.setLineDash([6, 3])
      ctx.stroke()
      ctx.setLineDash([])

      // Draw vertices
      drawingPoints.forEach((p, i) => {
        ctx.beginPath()
        ctx.arc(p[0], p[1], 4, 0, Math.PI * 2)
        ctx.fillStyle = i === 0 ? '#52c41a' : '#1890ff'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1
        ctx.stroke()
      })
    }
  }

  // Redraw on state change
  useEffect(() => {
    draw()
  }, [polygons, selectedId, drawingPoints, isDrawing])

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px] bg-gray-100 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={floorPlanWidth}
        height={floorPlanHeight}
        onClick={handleClick}
        className="w-full cursor-crosshair"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}
