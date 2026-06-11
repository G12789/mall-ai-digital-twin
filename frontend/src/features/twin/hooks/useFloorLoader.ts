import { useState, useEffect, useCallback } from 'react'
import type { Floor, MallUnit } from '../../../shared/types/database'
import { floorsApi } from '../../../shared/api/floorsApi'
import { unitsApi } from '../../../shared/api/unitsApi'

interface FloorLoaderState {
  floors: Floor[]
  units: MallUnit[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function useFloorLoader(mallId: string | undefined): FloorLoaderState {
  const [floors, setFloors] = useState<Floor[]>([])
  const [units, setUnits] = useState<MallUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mallId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const floorData = await floorsApi.listByMall(mallId)
      setFloors(floorData.sort((a, b) => a.floor_index - b.floor_index))

      const unitData = await unitsApi.listByMall(mallId)
      setUnits(unitData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载楼层数据失败')
    } finally {
      setLoading(false)
    }
  }, [mallId])

  useEffect(() => { load() }, [load])

  return { floors, units, loading, error, reload: load }
}
