import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Upload, message, Modal, Input, Space } from 'antd'
import { UploadOutlined, SaveOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons'
import FloorPlanCanvas from '../../features/editor/components/FloorPlanCanvas'
import EditorSidebar from '../../features/editor/components/EditorSidebar'
import { useEditorStore } from '../../features/editor/store/editorStore'
import { exportToGeoJSON } from '../../features/editor/utils/exportGeoJSON'
import { unitsApi } from '../../shared/api/unitsApi'

export default function UnitEditorPage() {
  const { id: mallId } = useParams<{ id: string }>()
  const { polygons, setFloorPlan, setPolygons } = useEditorStore()
  const [saving, setSaving] = useState(false)
  const [drawingMode, setDrawingMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setFloorPlan(url, img.naturalWidth, img.naturalHeight)
      message.success('平面图已加载，点击画布开始绘制铺位')
    }
    img.src = url
  }

  async function handleSave() {
    if (!mallId) { message.error('缺少商场ID'); return }
    setSaving(true)
    try {
      const geojson = exportToGeoJSON(polygons)
      // Save each unit to database
      for (const feature of geojson.features) {
        await unitsApi.create({
          mall_id: mallId,
          unit_code: feature.properties.unit_code,
          category: feature.properties.category,
          area_gross_sqm: feature.properties.area_sqm,
          status: feature.properties.status,
          polygon_geojson: feature.geometry as unknown as Record<string, unknown>,
        } as never)
      }
      message.success(`保存成功: ${polygons.length} 个铺位`)
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  function handleExport() {
    const geojson = exportToGeoJSON(polygons)
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mall-${mallId || 'unknown'}-units.geojson`
    a.click()
    URL.revokeObjectURL(url)
    message.success('GeoJSON已导出')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">铺位编辑器</h2>
        <Space>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={handleImageUpload} />
          <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
            上传平面图
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={polygons.length === 0}>
            导出GeoJSON
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}
            loading={saving} disabled={polygons.length === 0}>
            保存到数据库
          </Button>
        </Space>
      </div>

      <div className="flex border border-gray-200 rounded-lg overflow-hidden" style={{ minHeight: '70vh' }}>
        <div className="flex-1">
          <FloorPlanCanvas />
        </div>
        <EditorSidebar />
      </div>

      <div className="mt-2 text-sm text-gray-400">
        提示：上传商场平面图后，在画布上点击绘制铺位多边形。连续点击添加顶点，靠近起点自动闭合。
      </div>
    </div>
  )
}
