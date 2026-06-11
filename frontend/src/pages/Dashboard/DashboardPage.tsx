import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Table, Tag, Button, Space } from 'antd'
import {
  ShopOutlined,
  EnvironmentOutlined,
  UserOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  RiseOutlined,
  FallOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { useCurrentMall } from '../../shared/hooks/useCurrentMall'

interface AlertItem {
  key: string
  type: 'warning' | 'danger' | 'info'
  message: string
  detail: string
  link: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { mallName } = useCurrentMall()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // simulate brief data loading
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const MOCK_STATS = {
    totalMalls: 3,
    totalUnits: 148,
    totalTenants: 126,
    activeLeases: 112,
    occupancyRate: 84.5,
    occupancyTrend: 'up' as const,
    expiringLeases: 8,
    vacantUnits: 22,
    monthlyRevenue: 4863200,
    revenueTrend: 'up' as const,
  }

  const alerts: AlertItem[] = [
    { key: '1', type: 'danger', message: '万达影城租约即将到期', detail: '合同 LS-2024-001，到期日 2026-05-31，剩余 14 天', link: '/leases' },
    { key: '2', type: 'warning', message: '锦江生活广场出租率低于 70%', detail: '当前 64.2%，建议启动招商推广计划', link: '/malls/dev-mall-003' },
    { key: '3', type: 'warning', message: 'F1-003 铺位空置超过 90 天', detail: '面积 80㎡，建议调整租金或拆分出租', link: '/units' },
    { key: '4', type: 'info', message: '3 份合同待签署', detail: '翠微百货新增 3 家商户已确认意向，等待合同签署', link: '/leases' },
  ]

  const alertColumns = [
    {
      title: '', dataIndex: 'type', key: 'type', width: 40,
      render: (t: string) => {
        const icon = t === 'danger' ? <WarningOutlined style={{ color: '#ef4444' }} /> :
          t === 'warning' ? <WarningOutlined style={{ color: '#f59e0b' }} /> :
          <BellOutlined style={{ color: '#6366f1' }} />
        return icon
      },
    },
    {
      title: '预警', dataIndex: 'message', key: 'message',
      render: (v: string, r: AlertItem) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{v}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.detail}</div>
        </div>
      ),
    },
    {
      title: '', key: 'action', width: 80,
      render: (_: unknown, r: AlertItem) => (
        <Button type="link" size="small" onClick={() => navigate(r.link)}>查看</Button>
      ),
    },
  ] as const

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 className="page-title">工作台</h2>
        <p className="page-subtitle">
          {mallName ? `当前商场：${mallName}` : '商场运营数据概览与待办事项'}
        </p>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>

        {/* KPI Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card className="stat-card" loading={loading}>
              <Statistic
                title="商场总数"
                value={MOCK_STATS.totalMalls}
                prefix={<ShopOutlined style={{ color: '#2563eb' }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card" loading={loading}>
              <Statistic
                title="总铺位数"
                value={MOCK_STATS.totalUnits}
                prefix={<EnvironmentOutlined style={{ color: '#6366f1' }} />}
                suffix={<span style={{ fontSize: 14, color: '#ef4444' }}>{MOCK_STATS.vacantUnits} 空置</span>}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card" loading={loading}>
              <Statistic
                title="在租商户"
                value={MOCK_STATS.totalTenants}
                prefix={<UserOutlined style={{ color: '#10b981' }} />}
                suffix={<span style={{ fontSize: 14, color: '#6b7280' }}>/ {MOCK_STATS.totalUnits}</span>}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card" loading={loading}>
              <Statistic
                title="出租率"
                value={MOCK_STATS.occupancyRate}
                precision={1}
                prefix={MOCK_STATS.occupancyTrend === 'up' ? <RiseOutlined style={{ color: '#10b981' }} /> : <FallOutlined style={{ color: '#ef4444' }} />}
                suffix="%"
                valueStyle={{ color: MOCK_STATS.occupancyRate > 85 ? '#10b981' : '#f59e0b' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* Expiring leases quick view */}
          <Col xs={24} lg={14}>
            <Card
              title={<span style={{ fontWeight: 600 }}>预警中心</span>}
              extra={
                <Button type="link" size="small" onClick={() => navigate('/leases')}>
                  全部 <ArrowRightOutlined />
                </Button>
              }
              loading={loading}
              style={{ height: '100%' }}
            >
              <Table
                dataSource={alerts}
                columns={alertColumns as never}
                pagination={false}
                showHeader={false}
                size="small"
                rowKey="key"
                style={{ margin: '-8px 0' }}
              />
            </Card>
          </Col>

          {/* Quick stats */}
          <Col xs={24} lg={10}>
            <Card title={<span style={{ fontWeight: 600 }}>运营概览</span>} loading={loading} style={{ height: '100%' }}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>即将到期租约</span>
                  <Tag color="error">{MOCK_STATS.expiringLeases} 份</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>空置铺位</span>
                  <Tag color="warning">{MOCK_STATS.vacantUnits} 个</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>月租金收入</span>
                  <span style={{ fontWeight: 600, fontSize: 16, color: '#1f2937' }}>
                    ¥{(MOCK_STATS.monthlyRevenue / 10000).toFixed(1)} 万
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>活跃合同数</span>
                  <span style={{ fontWeight: 600 }}>{MOCK_STATS.activeLeases}</span>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}
