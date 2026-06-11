import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Table, Tag, Button, Result, Descriptions, Row, Col } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { floorsApi } from '../../shared/api/floorsApi'
import { unitsApi } from '../../shared/api/unitsApi'
import type { Floor, MallUnit } from '../../shared/types/database'
import { UNIT_STATUSES } from '../../shared/constants/businessTypes'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const DEV_FLOOR: Floor = {
  id: 'dev-f2', mall_id: 'dev-mall-001', floor_index: 1, floor_label: 'F1',
  floor_name: '一层', plan_image_url: null, extrude_height_m: 5.0, ceiling_height_m: 5.0,
  glb_asset_url: null, glb_lowres_url: null, geojson_boundary: null, sort_order: 1,
  created_at: '', updated_at: '',
}

const DEV_FLOOR_UNITS: MallUnit[] = [
  { id: 'dev-u1', floor_id: 'dev-f2', mall_id: 'dev-mall-001', unit_code: 'F1-001', unit_name: null, area_gross_sqm: 120, area_net_sqm: 100, area_leased_sqm: 120, polygon_geojson: null, centroid_geojson: null, category: '餐饮', sub_category: '咖啡茶饮', unit_type: 'standard', frontage_m: 8, floor_position: '东北角', status: 'occupied', features: [], notes: null, created_at: '', updated_at: '' },
  { id: 'dev-u2', floor_id: 'dev-f2', mall_id: 'dev-mall-001', unit_code: 'F1-002', unit_name: null, area_gross_sqm: 200, area_net_sqm: 180, area_leased_sqm: 200, polygon_geojson: null, centroid_geojson: null, category: '零售', sub_category: '服装', unit_type: 'standard', frontage_m: 12, floor_position: '主通道', status: 'occupied', features: [], notes: null, created_at: '', updated_at: '' },
  { id: 'dev-u3', floor_id: 'dev-f2', mall_id: 'dev-mall-001', unit_code: 'F1-003', unit_name: null, area_gross_sqm: 80, area_net_sqm: 65, area_leased_sqm: null, polygon_geojson: null, centroid_geojson: null, category: '零售', sub_category: '化妆品', unit_type: 'standard', frontage_m: 6, floor_position: '西南角', status: 'vacant', features: [], notes: null, created_at: '', updated_at: '' },
  { id: 'dev-u4', floor_id: 'dev-f2', mall_id: 'dev-mall-001', unit_code: 'F1-004', unit_name: null, area_gross_sqm: 150, area_net_sqm: 130, area_leased_sqm: 150, polygon_geojson: null, centroid_geojson: null, category: '餐饮', sub_category: '火锅', unit_type: 'standard', frontage_m: 10, floor_position: '中庭', status: 'occupied', features: [], notes: null, created_at: '', updated_at: '' },
]

export default function FloorDetailPage() {
  const { id, floorId } = useParams<{ id: string; floorId: string }>()
  const navigate = useNavigate()
  const [floor, setFloor] = useState<Floor | null>(null)
  const [units, setUnits] = useState<MallUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!floorId) return
    if (DEV_MODE) {
      setFloor(DEV_FLOOR)
      setUnits(DEV_FLOOR_UNITS)
      setLoading(false)
      return
    }
    Promise.all([
      floorsApi.getById(floorId),
      unitsApi.listByFloor(floorId),
    ])
      .then(([f, u]) => { setFloor(f); setUnits(u) })
      .catch((err) => setError(err?.message || '加载失败'))
      .finally(() => setLoading(false))
  }, [floorId])

  if (error && !loading) {
    return (
      <Card bordered={false}>
        <Result status="error" title="加载失败" subTitle={error}
          extra={<Button type="primary" onClick={() => navigate(`/malls/${id}`)}>返回商场</Button>}
        />
      </Card>
    )
  }

  const unitColumns: ColumnsType<MallUnit> = [
    { title: '铺位编号', dataIndex: 'unit_code', key: 'unit_code', width: 120 },
    { title: '业态', dataIndex: 'category', key: 'category', width: 100, render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '-' },
    { title: '面积(㎡)', dataIndex: 'area_gross_sqm', key: 'area_gross_sqm', width: 100, render: (v: number) => v?.toLocaleString() || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (v: string) => { const s = UNIT_STATUSES.find(x => x.value === v); return <Tag color={s?.color}>{s?.label ?? v}</Tag> } },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/malls/${id}`)} style={{ marginBottom: 8 }}>
          返回商场
        </Button>
        <h2 className="page-title">{floor?.floor_label} {floor?.floor_name}</h2>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Card bordered={false} loading={loading} style={{ marginBottom: 16 }}>
          <Descriptions column={3} size="small">
            <Descriptions.Item label="楼层">{floor?.floor_label}</Descriptions.Item>
            <Descriptions.Item label="层高">{floor?.ceiling_height_m}m</Descriptions.Item>
            <Descriptions.Item label="铺位数">{units.length} 个</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card bordered={false}>
          <Table
            rowKey="id"
            columns={unitColumns}
            dataSource={units}
            loading={loading}
            pagination={false}
            size="small"
          />
        </Card>
      </div>
    </div>
  )
}
