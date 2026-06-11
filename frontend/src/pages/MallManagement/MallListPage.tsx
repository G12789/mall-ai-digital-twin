import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Row, Col, Tag, message, Result } from 'antd'
import { PlusOutlined, ShopOutlined, EnvironmentOutlined, ReloadOutlined } from '@ant-design/icons'
import { mallsApi } from '../../shared/api/mallsApi'
import { useCurrentMall } from '../../shared/hooks/useCurrentMall'
import type { Mall } from '../../shared/types/database'

const LOAD_TIMEOUT = 15000
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const DEV_MALLS: Mall[] = [
  { id: 'dev-mall-001', tenant_id: 'dev-tenant-001', name: '星辰购物中心', name_en: 'Star Mall', address: '中山路888号', city: '深圳', district: '南山区', total_area_sqm: 42000, leasable_area_sqm: 32000, logo_url: null, cover_image_url: null, contact_name: '王总', contact_phone: '13800138000', contact_email: 'wang@starmall.com', status: 'active', config: {}, created_at: '', updated_at: '' },
  { id: 'dev-mall-002', tenant_id: 'dev-tenant-001', name: '翠微百货', name_en: 'Cuiwei Plaza', address: '长安街168号', city: '北京', district: '海淀区', total_area_sqm: 58000, leasable_area_sqm: 45000, logo_url: null, cover_image_url: null, contact_name: '李总', contact_phone: '13900139000', contact_email: null, status: 'active', config: {}, created_at: '', updated_at: '' },
  { id: 'dev-mall-003', tenant_id: 'dev-tenant-001', name: '锦江生活广场', name_en: 'Jinjiang Lifestyle', address: '天府大道66号', city: '成都', district: '高新区', total_area_sqm: 35000, leasable_area_sqm: 26000, logo_url: null, cover_image_url: null, contact_name: '张经理', contact_phone: '13600136000', contact_email: null, status: 'inactive', config: {}, created_at: '', updated_at: '' },
]

async function fetchWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('请求超时，请检查网络或后端服务')), ms)),
  ])
}

export default function MallListPage() {
  const [malls, setMalls] = useState<Mall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { setMall } = useCurrentMall()

  const loadMalls = () => {
    if (DEV_MODE) {
      setMalls(DEV_MALLS)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    fetchWithTimeout(mallsApi.list(), LOAD_TIMEOUT)
      .then((data) => {
        setMalls(data)
        setError(null)
      })
      .catch((err) => {
        console.error('[MallListPage] 加载失败:', err)
        setError(err?.message || '加载商场列表失败')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadMalls()
  }, [])

  function handleEnter(id: string, name: string) {
    setMall(id, name)
    navigate(`/malls/${id}`)
  }

  if (error && !loading && malls.length === 0) {
    return (
      <Card bordered={false}>
        <Result
          status="error"
          title="加载失败"
          subTitle={error}
          extra={
            <Button type="primary" icon={<ReloadOutlined />} onClick={loadMalls}>
              重试
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1a1a2e' }}>商场管理</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#999' }}>
              管理旗下商场资产，每个商场拥有独立的楼层、铺位和商户数据
            </p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="middle" onClick={() => navigate('/malls/new')}>
            创建商场
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Row gutter={[16, 16]}>
          {malls.map((mall) => (
            <Col key={mall.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                loading={loading}
                onClick={() => handleEnter(mall.id, mall.name)}
                cover={
                  mall.cover_image_url ? (
                    <img alt={mall.name} src={mall.cover_image_url} style={{ height: 160, objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      height: 160,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <ShopOutlined style={{ fontSize: 48, color: 'rgba(255,255,255,0.5)' }} />
                    </div>
                  )
                }
                style={!loading ? { cursor: 'pointer' } : {}}
              >
                <Card.Meta
                  title={<span style={{ fontSize: 16, fontWeight: 600 }}>{mall.name}</span>}
                  description={
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#888', marginBottom: 4 }}>
                        <EnvironmentOutlined />
                        <span>{mall.city} {mall.district}</span>
                      </div>
                      {mall.total_area_sqm && (
                        <div style={{ color: '#999', fontSize: 12, marginBottom: 6 }}>
                          总面积: {mall.total_area_sqm.toLocaleString()} ㎡
                        </div>
                      )}
                      <Tag color={mall.status === 'active' ? 'green' : 'default'}>
                        {mall.status === 'active' ? '运营中' : '已停用'}
                      </Tag>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}
