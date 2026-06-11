import { create } from 'zustand'

export interface EditorPolygon {
  id: string
  points: [number, number][]
  unitCode: string
  category: string
  areaSqm: number
  status: string
}

interface EditorState {
  polygons: EditorPolygon[]
  selectedId: string | null
  drawingPoints: [number, number][]
  isDrawing: boolean
  floorPlanUrl: string | null
  floorPlanWidth: number
  floorPlanHeight: number

  setFloorPlan: (url: string, w: number, h: number) => void
  addDrawingPoint: (x: number, y: number) => void
  finishDrawing: () => string | null
  cancelDrawing: () => void
  selectPolygon: (id: string | null) => void
  updatePolygon: (id: string, updates: Partial<EditorPolygon>) => void
  removePolygon: (id: string) => void
  setPolygons: (polygons: EditorPolygon[]) => void
}

let nextId = 1
function genId() { return `poly_${nextId++}_${Date.now()}` }

export const useEditorStore = create<EditorState>((set, get) => ({
  polygons: [],
  selectedId: null,
  drawingPoints: [],
  isDrawing: false,
  floorPlanUrl: null,
  floorPlanWidth: 800,
  floorPlanHeight: 600,

  setFloorPlan: (url, w, h) => set({ floorPlanUrl: url, floorPlanWidth: w, floorPlanHeight: h }),

  addDrawingPoint: (x, y) => {
    set((s) => ({ drawingPoints: [...s.drawingPoints, [x, y]], isDrawing: true }))
  },

  finishDrawing: () => {
    const { drawingPoints } = get()
    if (drawingPoints.length < 3) {
      set({ drawingPoints: [], isDrawing: false })
      return null
    }
    const id = genId()
    const polygon: EditorPolygon = {
      id,
      points: [...drawingPoints],
      unitCode: `F?-${String(get().polygons.length + 1).padStart(3, '0')}`,
      category: '',
      areaSqm: 0,
      status: 'vacant',
    }
    set((s) => ({
      polygons: [...s.polygons, polygon],
      drawingPoints: [],
      isDrawing: false,
      selectedId: id,
    }))
    return id
  },

  cancelDrawing: () => set({ drawingPoints: [], isDrawing: false }),

  selectPolygon: (id) => set({ selectedId: id }),

  updatePolygon: (id, updates) => {
    set((s) => ({
      polygons: s.polygons.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
  },

  removePolygon: (id) => {
    set((s) => ({
      polygons: s.polygons.filter((p) => p.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
  },

  setPolygons: (polygons) => set({ polygons }),
}))
