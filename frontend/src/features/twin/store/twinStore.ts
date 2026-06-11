import { create } from 'zustand'

interface TwinState {
  activeFloorId: string | null
  activeFloorIndex: number
  selectedUnitId: string | null
  cameraTarget: [number, number, number]
  cameraPosition: [number, number, number]
  visibleFloors: string[]
  is2DMode: boolean
  loadingProgress: number
  isLoading: boolean

  setActiveFloor: (id: string, index: number) => void
  selectUnit: (id: string | null) => void
  setCameraTarget: (target: [number, number, number]) => void
  setCameraPosition: (pos: [number, number, number]) => void
  toggleFloorVisibility: (floorId: string) => void
  toggle2DMode: () => void
  setLoadingProgress: (progress: number) => void
  setLoading: (loading: boolean) => void
  resetView: () => void
}

export const useTwinStore = create<TwinState>((set) => ({
  activeFloorId: null,
  activeFloorIndex: 0,
  selectedUnitId: null,
  cameraTarget: [0, 5, 0],
  cameraPosition: [30, 20, 30],
  visibleFloors: [],
  is2DMode: false,
  loadingProgress: 0,
  isLoading: true,

  setActiveFloor: (id, index) =>
    set({ activeFloorId: id, activeFloorIndex: index, selectedUnitId: null }),

  selectUnit: (id) => set({ selectedUnitId: id }),

  setCameraTarget: (target) => set({ cameraTarget: target }),
  setCameraPosition: (pos) => set({ cameraPosition: pos }),

  toggleFloorVisibility: (floorId) =>
    set((s) => ({
      visibleFloors: s.visibleFloors.includes(floorId)
        ? s.visibleFloors.filter((id) => id !== floorId)
        : [...s.visibleFloors, floorId],
    })),

  toggle2DMode: () => set((s) => ({ is2DMode: !s.is2DMode })),

  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  setLoading: (loading) => set({ isLoading: loading }),

  resetView: () =>
    set({
      cameraTarget: [0, 5, 0],
      cameraPosition: [30, 20, 30],
      selectedUnitId: null,
    }),
}))
