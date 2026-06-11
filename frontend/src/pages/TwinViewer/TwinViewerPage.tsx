import { useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Space, Spin, Result, Segmented, Tooltip } from 'antd'
import {
  EditOutlined, ArrowLeftOutlined, ExpandOutlined, ShrinkOutlined,
  HeatMapOutlined, AimOutlined, AppstoreOutlined,
} from '@ant-design/icons'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import SceneCanvas from '../../features/twin/components/SceneCanvas'
import type { VisualMode } from '../../features/twin/components/SceneCanvas'
import FloorSwitcher from '../../features/twin/components/FloorSwitcher'
import UnitInfoCard from '../../features/twin/components/UnitInfoCard'
import UnitSearchBar from '../../features/twin/components/UnitSearchBar'
import TwinLoadingScreen from '../../features/twin/components/TwinLoadingScreen'
import SceneErrorBoundary from '../../shared/components/ui/SceneErrorBoundary'
import { useFloorLoader } from '../../features/twin/hooks/useFloorLoader'
import { useTwinStore } from '../../features/twin/store/twinStore'
import type { MallUnit } from '../../shared/types/database'

export default function TwinViewerPage() {
  const { id: mallId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { floors, units, loading, error } = useFloorLoader(mallId)
  const {
    activeFloorIndex, selectedUnitId, is2DMode,
    setActiveFloor, selectUnit, toggle2DMode, loadingProgress,
  } = useTwinStore()

  const [visualMode, setVisualMode] = useState<VisualMode>('status')
  const [searchTarget, setSearchTarget] = useState<THREE.Vector3 | null>(null)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const [sceneReady, setSceneReady] = useState(false)

  const handleControlsReady = useCallback(() => {
    const t = setTimeout(() => setSceneReady(true), 500)
    // If loading is already done, show immediately
    if (!loading) {
      clearTimeout(t)
      setSceneReady(true)
    }
  }, [loading])

  const floorLabels = floors.map((f) => f.floor_label)
  const activeFloor = floors[activeFloorIndex]
  const activeUnits = activeFloor ? units.filter((u) => u.floor_id === activeFloor.id) : []
  const selectedUnit = activeUnits.find((u) => u.id === selectedUnitId) ?? null

  function handleSearchSelect(unit: MallUnit) {
    const floorIdx = floors.findIndex((f) => f.id === unit.floor_id)
    if (floorIdx >= 0 && floorIdx !== activeFloorIndex) {
      setActiveFloor(unit.floor_id, floorIdx)
    }
    selectUnit(unit.id)

    if (unit.centroid_geojson?.coordinates) {
      const [cx, cy] = unit.centroid_geojson.coordinates
      setSearchTarget(new THREE.Vector3(cx, floorIdx >= 0 ? floorIdx * 5 + 1 : 5, -cy))
    } else if (unit.polygon_geojson?.coordinates?.[0]) {
      const ring = unit.polygon_geojson.coordinates[0]
      let sx = 0, sz = 0
      const n = Math.min(ring.length - 1, ring.length)
      for (let i = 0; i < n; i++) { sx += ring[i][0]; sz += ring[i][1] }
      const y = floorIdx >= 0 ? floorIdx * 5 + 1 : 5
      setSearchTarget(new THREE.Vector3(sx / n, y, -sz / n))
    }
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle={error}
        extra={<Button onClick={() => window.location.reload()}>重试</Button>}
      />
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/malls')}>返回</Button>
          <h2 className="page-title" style={{ marginBottom: 0 }}>3D 数字沙盘</h2>
          {activeFloor && (
            <span style={{ fontSize: 13, color: '#9ca3af' }}>{activeFloor.floor_label}</span>
          )}
        </Space>

        <Space>
          <UnitSearchBar units={activeUnits} onSelect={handleSearchSelect} disabled={floors.length === 0} />

          <Segmented
            size="small"
            value={visualMode}
            onChange={(v) => setVisualMode(v as VisualMode)}
            options={[
              { value: 'status', label: '状态', icon: <AppstoreOutlined /> },
              { value: 'heatmap', label: '热力图', icon: <HeatMapOutlined /> },
            ]}
          />

          <Tooltip title="复位视角">
            <Button size="small" icon={<AimOutlined />}
              onClick={() => controlsRef.current?.reset()} />
          </Tooltip>

          <Button
            icon={is2DMode ? <ExpandOutlined /> : <ShrinkOutlined />}
            onClick={toggle2DMode}
            size="small"
          >
            {is2DMode ? '切换到3D' : '切换到2D'}
          </Button>

          <Button type="primary" icon={<EditOutlined />}
            onClick={() => navigate(`/malls/${mallId}/editor`)} size="small">
            编辑器
          </Button>
        </Space>
      </div>

      {/* 3D Viewer area */}
      <div style={{
        flex: 1,
        minHeight: 0,
        position: 'relative',
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        background: '#e8ecf1',
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Spin size="large" />
          </div>
        ) : floors.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Result
              status="info"
              title="暂无楼层数据"
              subTitle="请先在商场详情中添加楼层信息"
              extra={
                <Button type="primary" onClick={() => navigate(`/malls/${mallId}`)}>
                  前往商场管理
                </Button>
              }
            />
          </div>
        ) : (
          <SceneErrorBoundary>
            <SceneCanvas
              floors={floors}
              units={units}
              activeFloorIndex={activeFloorIndex}
              selectedUnitId={selectedUnitId}
              visualMode={visualMode}
              is2DMode={is2DMode}
              onUnitSelect={selectUnit}
              searchTarget={searchTarget}
              onControlsReady={(ctrl) => { controlsRef.current = ctrl; handleControlsReady() }}
            />

            <FloorSwitcher
              floorLabels={floorLabels}
              activeIndex={activeFloorIndex}
              onChange={(i) => {
                const floor = floors[i]
                if (floor) setActiveFloor(floor.id, i)
              }}
            />

            <UnitInfoCard unit={selectedUnit} onClose={() => selectUnit(null)} />

            {!sceneReady && (
              <TwinLoadingScreen progress={loadingProgress} message="加载3D场景..." />
            )}
          </SceneErrorBoundary>
        )}
      </div>
    </div>
  )
}
