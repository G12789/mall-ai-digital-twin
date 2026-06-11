import { Button, Input, Select, InputNumber, Divider, Empty, Space, message } from 'antd'
import { DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useEditorStore } from '../store/editorStore'
import { calcPolygonArea } from '../utils/polygonOps'
import { BUSINESS_CATEGORIES, UNIT_STATUSES } from '../../../shared/constants/businessTypes'

export default function EditorSidebar() {
  const {
    polygons, selectedId, isDrawing, drawingPoints,
    selectPolygon, updatePolygon, removePolygon,
    finishDrawing, cancelDrawing,
  } = useEditorStore()

  const selected = polygons.find((p) => p.id === selectedId)

  return (
    <div className="w-72 border-l border-gray-200 bg-white p-4 overflow-auto">
      <h3 className="text-lg font-bold mb-4">铺位编辑器</h3>

      {isDrawing && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 mb-2">
            正在绘制: {drawingPoints.length} 个顶点
          </p>
          <p className="text-xs text-blue-500 mb-2">
            点击画布添加顶点，靠近起点可闭合
          </p>
          <Space>
            <Button size="small" type="primary" icon={<CheckOutlined />}
              disabled={drawingPoints.length < 3}
              onClick={finishDrawing}>
              闭合完成
            </Button>
            <Button size="small" icon={<CloseOutlined />} onClick={cancelDrawing}>
              取消
            </Button>
          </Space>
        </div>
      )}

      {!isDrawing && !selected && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            点击画布空白处开始绘制多边形，或点击已有铺位查看详情。
          </p>
          <div className="text-xs text-gray-400">
            <div><span className="inline-block w-3 h-3 rounded bg-red-400 mr-1" /> 空置</div>
            <div><span className="inline-block w-3 h-3 rounded bg-green-400 mr-1" /> 已租</div>
            <div><span className="inline-block w-3 h-3 rounded bg-yellow-400 mr-1" /> 已预定</div>
          </div>
        </div>
      )}

      {selected && (
        <div>
          <div className="mb-3">
            <label className="text-xs text-gray-500">铺位编号</label>
            <Input size="small" value={selected.unitCode}
              onChange={(e) => updatePolygon(selected.id, { unitCode: e.target.value })} />
          </div>

          <div className="mb-3">
            <label className="text-xs text-gray-500">业态类别</label>
            <Select size="small" className="w-full" value={selected.category || undefined}
              placeholder="选择业态"
              onChange={(v) => updatePolygon(selected.id, { category: v })}
              options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </div>

          <div className="mb-3">
            <label className="text-xs text-gray-500">状态</label>
            <Select size="small" className="w-full" value={selected.status}
              onChange={(v) => updatePolygon(selected.id, { status: v })}
              options={UNIT_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
          </div>

          <div className="mb-3">
            <label className="text-xs text-gray-500">面积 (㎡)</label>
            <InputNumber size="small" className="w-full"
              value={calcPolygonArea(selected.points)}
              readOnly
              formatter={(v) => v ? Number(v).toFixed(2) : ''} />
          </div>

          <Divider className="my-3" />

          <div className="text-xs text-gray-400 mb-3">
            顶点数: {selected.points.length} |
            面积: {calcPolygonArea(selected.points).toFixed(2)} ㎡
          </div>

          <Button danger size="small" icon={<DeleteOutlined />} block
            onClick={() => {
              removePolygon(selected.id)
              message.success('铺位已删除')
            }}>
            删除此铺位
          </Button>
        </div>
      )}

      <Divider />

      <div className="text-xs text-gray-400">
        已绘制: {polygons.length} 个铺位
      </div>
    </div>
  )
}
