import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Row, Col, Statistic, Button, Descriptions, Tag, message, Result } from 'antd'
import { ShopOutlined, EnvironmentOutlined, TeamOutlined, ReloadOutlined } from '@ant-design/icons'
import { mallsApi } from '../../shared/api/mallsApi'
import { floorsApi } from '../../shared/api/floorsApi'
import { unitsApi } from '../../shared/api/unitsApi'
import type { Mall, Floor, MallUnit } from '../../shared/types/database'

const LOAD_TIMEOUT = 15000
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const DEV_MALL: Mall = { id: 'dev-mall-001', tenant_id: 'dev-tenant-001', name: '星辰购物中心', name_en: 'Star Mall', address: '中山路888号', city: '深圳', district: '南山区', total_area_sqm: 42000, leasable_area_sqm: 32000, logo_url: null, cover_image_url: null, contact_name: '王总', contact_phone: '13800138000', contact_email: 'wang@starmall.com', status: 'active', config: {}, created_at: '', updated_at: '' }

const DEV_FLOORS: Floor[] = [
  { id: 'dev-f1', mall_id: 'dev-mall-001', floor_index: 0, floor_label: 'B1', floor_name: '地下一层', plan_image_url: null, extrude_height_m: 4.5, ceiling_height_m: 4.5, glb_asset_url: null, glb_lowres_url: null, geojson_boundary: null, sort_order: 0, created_at: '', updated_at: '' },
  { id: 'dev-f2', mall_id: 'dev-mall-001', floor_index: 1, floor_label: 'F1', floor_name: '一层', plan_image_url: null, extrude_height_m: 5.0, ceiling_height_m: 5.0, glb_asset_url: null, glb_lowres_url: null, geojson_boundary: null, sort_order: 1, created_at: '', updated_at: '' },
  { id: 'dev-f3', mall_id: 'dev-mall-001', floor_index: 2, floor_label: 'F2', floor_name: '二层', plan_image_url: null, extrude_height_m: 4.5, ceiling_height_m: 4.5, glb_asset_url: null, glb_lowres_url: null, geojson_boundary: null, sort_order: 2, created_at: '', updated_at: '' },
  { id: 'dev-f4', mall_id: 'dev-mall-001', floor_index: 3, floor_label: 'F3', floor_name: '三层', plan_image_url: null, extrude_height_m: 4.5, ceiling_height_m: 4.5, glb_asset_url: null, glb_lowres_url: null, geojson_boundary: null, sort_order: 3, created_at: '', updated_at: '' },
]

const DEV_UNITS: MallUnit[] = [
  { id: 'dev-du1', floor_id: 'dev-f2', mall_id: 'dev-mall-001', unit_code: 'F1-001', unit_name: null, area_gross_sqm: 120, area_net_sqm: 100, area_leased_sqm: 120, polygon_geojson: null, centroid_geojson: null, category: '餐饮', sub_category: '咖啡茶饮', unit_type: 'standard', frontage_m: 8, floor_position: '东北角', status: 'occupied', features: [], notes: null, created_at: '', updated_at: '' },
  { id: 'dev-du2', floor_id: 'dev-f2', mall_id: 'dev-mall-001', unit_code: 'F1-002', unit_name: null, area_gross_sqm: 200, area_net_sqm: 180, area_leased_sqm: 200, polygon_geojson: null, centroid_geojson: null, category: '零售', sub_category: '服装', unit_type: 'standard', frontage_m: 12, floor_position: '主通道', status: 'occupied', features: [], notes: null, created_at: '', updated_at: '' },
  { id: 'dev-du3', floor_id: 'dev-f2', mall_id: 'dev-mall-001', unit_code: 'F1-003', unit_name: null, area_gross_sqm: 80, area_net_sqm: 65, area_leased_sqm: null, polygon_geojson: null, centroid_geojson: null, category: '零售', sub_category: '化妆品', unit_type: 'standard', frontage_m: 6, floor_position: '西南角', status: 'vacant', features: [], notes: null, created_at: '', updated_at: '' },
  { id: 'dev-du4', floor_id: 'dev-f2', mall_id: 'dev-mall-001', unit_code: 'F1-004', unit_name: null, area_gross_sqm: 150, area_net_sqm: 130, area_leased_sqm: 150, polygon_geojson: null, centroid_geojson: null, category: '餐饮', sub_category: '火锅', unit_type: 'standard', frontage_m: 10, floor_position: '中庭', status: 'occupied', features: [], notes: null, created_at: '', updated_at: '' },
  { id: 'dev-du5', floor_id: 'dev-f3', mall_id: 'dev-mall-001', unit_code: 'F2-001', unit_name: null, area_gross_sqm: 300, area_net_sqm: 260, area_leased_sqm: 300, polygon_geojson: null, centroid_geojson: null, category: '娱乐', sub_category: '影院', unit_type: 'standard', frontage_m: 20, floor_position: '整层', status: 'occupied', features: [], notes: null, created_at: '', updated_at: '' },
  { id: 'dev-du6', floor_id: 'dev-f3', mall_id: 'dev-mall-001', unit_code: 'F2-002', unit_name: null, area_gross_sqm: 90, area_net_sqm: 75, area_leased_sqm: null, polygon_geojson: null, centroid_geojson: null, category: '教育', sub_category: 'K12', unit_type: 'standard', frontage_m: 6, floor_position: '东区', status: 'vacant', features: [], notes: null, created_at: '', updated_at: '' },
  { id: 'dev-du7', floor_id: 'dev-f3', mall_id: 'dev-mall-001', unit_code: 'F2-003', unit_name: null, area_gross_sqm: 110, area_net_sqm: 95, area_leased_sqm: null, polygon_geojson: null, centroid_geojson: null, category: '零售', sub_category: '数码电子', unit_type: 'standard', frontage_m: 8, floor_position: '中庭', status: 'reserved', features: [], notes: null, created_at: '', updated_at: '' },
]

async function fetchWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('请求超时，请检查网络或后端服务')), ms)),
  ])
}

export default function MallDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [mall, setMall] = useState<Mall | null>(null)
  const [floors, setFloors] = useState<Floor[]>([])
  const [units, setUnits] = useState<MallUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = () => {
    if (!id) return

    if (DEV_MODE) {
      setMall(DEV_MALL)
      setFloors(DEV_FLOORS)
      setUnits(DEV_UNITS)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    Promise.all([
      fetchWithTimeout(mallsApi.getById(id), LOAD_TIMEOUT),
      fetchWithTimeout(floorsApi.listByMall(id), LOAD_TIMEOUT),
      fetchWithTimeout(unitsApi.listByMall(id), LOAD_TIMEOUT),
    ])
      .then(([m, f, u]) => { setMall(m); setFloors(f); setUnits(u) })
      .catch((err) => {
        console.error('[MallDetailPage] 加载失败:', err)
        setError(err?.message || '加载商场数据失败')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [id])

  if (error && !loading && !mall) {
    return (
      <Card bordered={false}>
        <Result
          status="error"
          title="加载失败"
          subTitle={error}
          extra={
            <Button type="primary" icon={<ReloadOutlined />} onClick={loadData}>
              重试
            </Button>
          }
        />
      </Card>
    )
  }

  if (!loading && !mall) {
    return (
      <Card bordered={false}>
        <Result
          status="404"
          title="商场不存在"
          subTitle="请检查链接是否正确"
          extra={
            <Button type="primary" onClick={() => navigate('/malls')}>
              返回商场列表
            </Button>
          }
        />
      </Card>
    )
  }

  const occupiedUnits = units.filter((u) => u.status === 'occupied').length
  const vacantUnits = units.filter((u) => u.status === 'vacant').length
  const occupancyRate = units.length > 0 ? (occupiedUnits / units.length * 100).toFixed(1) : '0'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1a1a2e' }}>
              {mall?.name || '加载中...'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#999' }}>
              {mall?.city} {mall?.district} · 总面积 {mall?.total_area_sqm?.toLocaleString()} ㎡
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => navigate(`/malls/${id}/edit`)}>编辑信息</Button>
            <Button type="primary" onClick={() => navigate(`/malls/${id}/twin`)}>进入3D沙盘</Button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card loading={loading}>
              <Statistic title="楼层数" value={floors.length} prefix={<ShopOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card loading={loading}>
              <Statistic title="总铺位数" value={units.length} prefix={<EnvironmentOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card loading={loading}>
              <Statistic title="已租铺位" value={occupiedUnits} suffix={`/ ${units.length}`} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card loading={loading}>
              <Statistic title="出租率" value={occupancyRate} suffix="%" valueStyle={{ color: Number(occupancyRate) > 85 ? '#52c41a' : '#faad14' }} />
            </Card>
          </Col>
        </Row>

        <Card title="基本信息" bordered={false} style={{ marginBottom: 16 }}>
          <Descriptions column={2}>
            <Descriptions.Item label="地址">{mall?.city} {mall?.district} {mall?.address}</Descriptions.Item>
            <Descriptions.Item label="运营状态">
              {mall && <Tag color={mall.status === 'active' ? 'green' : 'default'}>{mall.status === 'active' ? '运营中' : mall.status}</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="总面积">{mall?.total_area_sqm?.toLocaleString() ?? '-'} ㎡</Descriptions.Item>
            <Descriptions.Item label="可租赁面积">{mall?.leasable_area_sqm?.toLocaleString() ?? '-'} ㎡</Descriptions.Item>
            <Descriptions.Item label="联系人">{mall?.contact_name ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{mall?.contact_phone ?? '-'}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="楼层概览" bordered={false} style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            {!loading && floors.map((floor) => {
              const floorUnits = units.filter((u) => u.floor_id === floor.id)
              return (
                <Col key={floor.id} xs={12} sm={8} lg={6}>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => navigate(`/malls/${id}/floors/${floor.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{floor.floor_label}</div>
                    <div style={{ color: '#888', fontSize: 13 }}>{floor.floor_name || `${floor.floor_label}层`}</div>
                    <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>
                      {floorUnits.length} 个铺位 · 层高 {floor.ceiling_height_m}m
                    </div>
                  </Card>
                </Col>
              )
            })}
          </Row>
        </Card>
      </div>
    </div>
  )
}
