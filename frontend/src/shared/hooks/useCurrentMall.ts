import { create } from 'zustand'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

interface CurrentMallState {
  mallId: string | null
  mallName: string | null
  setMall: (id: string, name: string) => void
  clear: () => void
}

export const useCurrentMall = create<CurrentMallState>((set) => ({
  mallId: DEV_MODE ? 'dev-mall-001' : null,
  mallName: DEV_MODE ? '星辰购物中心 (演示)' : null,
  setMall: (id, name) => set({ mallId: id, mallName: name }),
  clear: () => set({ mallId: null, mallName: null }),
}))
