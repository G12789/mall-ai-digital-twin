import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table, Tag, Button, Input, Select, Space, message, Result, Card, Drawer, Descriptions, Modal, Form, InputNumber } from 'antd'
import { SearchOutlined, PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { unitsApi } from '../../shared/api/unitsApi'
import { useCurrentMall } from '../../shared/hooks/useCurrentMall'
import { UNIT_STATUSES, BUSINESS_CATEGORIES } from '../../shared/constants/businessTypes'
import type { MallUnit } from '../../shared/types/database'

const LOAD_TIMEOUT = 15000
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const DEFAULT_DEV_UNITS: MallUnit[] = [
  { id: 'dev-u1', floor_id: 'dev-f1', mall_id: 'dev-mall-001', unit_code: 'F1-001', unit_name: null, area_gross_sqm: 120, area_net_sqm: 100, area_leased_sqm: 120, polygon_geojson: null, centroid_geojson: null, category: '餐饮', sub_category: '咖啡茶饮', unit_type: 'standard', frontage_m: 8, floor_position: '东北角', status: 'occupied', features: [], notes: null, created_at: '2025-01-01', updated_at: '' },
  { id: 'dev-u2', floor_id: 'dev-f1', mall_id: 'dev-mall-001', unit_code: 'F1-002', unit_name: null, area_gross_sqm: 200, area_net_sqm: 180, area_leased_sqm: 200, polygon_geojson: null, centroid_geojson: null, category: '零售', sub_category: '服装', unit_type: 'standard', frontage_m: 12, floor_position: '主通道', status: 'occupied', features: [], notes: null, created_at: '2025-02-01', updated_at: '' },
  { id: 'dev-u3', floor_id: 'dev-f1', mall_id: 'dev-mall-001', unit_code: 'F1-003', unit_name: null, area_gross_sqm: 80, area_net_sqm: 65, area_leased_sqm: null, polygon_geojson: null, centroid_geojson: null, category: '零售', sub_category: '化妆品', unit_type: 'standard', frontage_m: 6, floor_position: '西南角', status: 'vacant', features: [], notes: null, created_at: '', updated_at: '' },
  { id: 'dev-u4', floor_id: 'dev-f1', mall_id: 'dev-mall-001', unit_code: 'F1-004', unit_name: null, area_gross_sqm: 150, area_net_sqm: 130, area_leased_sqm: 150, polygon_geojson: null, centroid_geojson: null, category: '餐饮', sub_category: '火锅', unit_type: 'standard', frontage_m: 10, floor_position: '中庭', status: 'occupied', features: [], notes: null, created_at: '2025-03-01', updated_at: '' },
  { id: 'dev-u5', floor_id: 'dev-f2', mall_id: 'dev-mall-001', unit_code: 'F2-001', unit_name: null, area_gross_sqm: 300, area_net_sqm: 260, area_leased_sqm: 300, polygon_geojson: null, centroid_geojson: null, category: '娱乐', sub_category: '影院', unit_type: 'standard', frontage_m: 20, floor_position: '整层', status: 'occupied', features: [], notes: null, created_at: '2024-06-01', updated_at: '' },
  { id: 'dev-u6', floor_id: 'dev-f2', mall_id: 'dev-mall-001', unit_code: 'F2-002', unit_name: null, area_gross_sqm: 90, area_net_sqm: 75, area_leased_sqm: null, polygon_geojson: null, centroid_geojson: null, category: '教育', sub_category: 'K12', unit_type: 'standard', frontage_m: 6, floor_position: '东区', status: 'vacant', features: [], notes: null, created_at: '', updated_at: '' },
  { id: 'dev-u7', floor_id: 'dev-f2', mall_id: 'dev-mall-001', unit_code: 'F2-003', unit_name: null, area_gross_sqm: 110, area_net_sqm: 95, area_leased_sqm: null, polygon_geojson: null, centroid_geojson: null, category: '零售', sub_category: '数码电子', unit_type: 'standard', frontage_m: 8, floor_position: '中庭', status: 'reserved', features: [], notes: null, created_at: '', updated_at: '' },
  { id: 'dev-u8', floor_id: 'dev-f2', mall_id: 'dev-mall-001', unit_code: 'F2-K01', unit_name: null, area_gross_sqm: 15, area_net_sqm: 15, area_leased_sqm: null, polygon_geojson: null, centroid_geojson: null, category: '零售', sub_category: '便利店', unit_type: 'kiosk', frontage_m: 3, floor_position: '电梯口', status: 'vacant', features: [], notes: null, created_at: '', updated_at: '' },
]

async function fetchWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('请求超时，请检查网络或后端服务')), ms)),
  ])
}

export default function UnitListPage() {
  const { mallId } = useCurrentMall()
  const [units, setUnits] = useState<MallUnit[]>(() => DEV_MODE ? [...DEFAULT_DEV_UNITS] : [])
  const [loading, setLoading] = useState(!DEV_MODE)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const filterMallId = searchParams.get('mall_id') || mallId

  // Detail
  const [detailUnit, setDetailUnit] = useState<MallUnit | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Edit
  const [editOpen, setEditOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<MallUnit | null>(null)
  const [editForm] = Form.useForm()
  const [saving, setSaving] = useState(false)

  const loadUnits = () => {
    if (!filterMallId) { setLoading(false); setError('未选择商场，请先进入商场详情页'); return }
    if (DEV_MODE) { setUnits([...DEFAULT_DEV_UNITS]); setLoading(false); setError(null); return }
    setLoading(true); setError(null)
    fetchWithTimeout(unitsApi.listByMall(filterMallId), LOAD_TIMEOUT)
      .then((data) => { setUnits(data); setError(null) })
      .catch((err) => { console.error('[UnitListPage] 加载失败:', err); setError(err?.message || '加载铺位列表失败') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUnits() }, [filterMallId])

  const filtered = useMemo(() => {
    let list = units
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      list = list.filter((u) =>
        (u.unit_code || '').toLowerCase().includes(q) ||
        (u.category || '').toLowerCase().includes(q) ||
        (u.sub_category || '').toLowerCase().includes(q),
      )
    }
    if (categoryFilter) list = list.filter((u) => u.category === categoryFilter)
    if (statusFilter) list = list.filter((u) => u.status === statusFilter)
    return list
  }, [units, searchText, categoryFilter, statusFilter])

  const openDetail = (u: MallUnit) => { setDetailUnit(u); setDrawerOpen(true) }
  const openEdit = (u?: MallUnit) => {
    if (u) { setEditingUnit(u); editForm.setFieldsValue(u) }
    else { setEditingUnit(null); editForm.resetFields() }
    setEditOpen(true)
  }
  const handleSave = async () => {
    try {
      const values = await editForm.validateFields()
      setSaving(true)
      if (editingUnit) {
        setUnits((prev) => prev.map((u) => u.id === editingUnit.id ? { ...u, ...values } : u))
        message.success(`铺位「${values.unit_code}」已更新`)
      } else {
        const newUnit: MallUnit = {
          ...values,
          id: `dev-u${Date.now()}`,
          mall_id: filterMallId || 'dev-mall-001',
          floor_id: values.floor_id || 'dev-f1',
          unit_name: null,
          area_net_sqm: values.area_gross_sqm ? values.area_gross_sqm * 0.85 : null,
          area_leased_sqm: null,
          polygon_geojson: null, centroid_geojson: null,
          floor_position: null, features: [], notes: values.notes || null,
          created_at: new Date().toISOString().slice(0, 10),
          updated_at: '',
        }
        setUnits((prev) => [newUnit, ...prev])
        message.success(`铺位「${values.unit_code}」已创建`)
      }
      setEditOpen(false); setEditingUnit(null)
    } catch { /* validation failed */ }
    finally { setSaving(false) }
  }
  const handleDelete = (u: MallUnit) => {
    Modal.confirm({
      title: '确认删除', content: `确定要删除铺位「${u.unit_code}」吗？`,
      okText: '确认删除', okType: 'danger', cancelText: '取消',
      onOk: () => { setUnits((prev) => prev.filter((x) => x.id !== u.id)); message.success(`铺位「${u.unit_code}」已删除`) },
    })
  }

  const columns: ColumnsType<MallUnit> = [
    {
      title: '铺位编号', dataIndex: 'unit_code', key: 'unit_code', width: 120,
      sorter: (a, b) => a.unit_code.localeCompare(b.unit_code),
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: '业态', dataIndex: 'category', key: 'category', width: 90,
      render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '-',
    },
    { title: '子类', dataIndex: 'sub_category', key: 'sub_category', width: 100, render: (v: string) => v || '-' },
    {
      title: '面积(㎡)', dataIndex: 'area_gross_sqm', key: 'area_gross_sqm', width: 100,
      sorter: (a, b) => (a.area_gross_sqm || 0) - (b.area_gross_sqm || 0),
      render: (v: number) => v ? v.toLocaleString() : '-',
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v: string) => { const s = UNIT_STATUSES.find((x) => x.value === v); return <Tag color={s?.color}>{s?.label ?? v}</Tag> },
    },
    {
      title: '类型', dataIndex: 'unit_type', key: 'unit_type', width: 80,
      render: (v: string) => v === 'kiosk' ? <Tag>岛柜</Tag> : v === 'standard' ? '标准铺' : v || '-',
    },
    { title: '临街面(m)', dataIndex: 'frontage_m', key: 'frontage_m', width: 110, render: (v: number) => v != null ? `${v}m` : '-' },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
        </Space>
      ),
    },
  ]

  if (error && !loading && units.length === 0) {
    return (
      <Card bordered={false}>
        <Result status="error" title="加载失败" subTitle={error}
          extra={<Button type="primary" icon={<ReloadOutlined />} onClick={loadUnits}>重试</Button>}
        />
      </Card>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="page-title">铺位管理</h2>
            <p className="page-subtitle">管理商场铺位信息、业态、出租状态</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>新增铺位</Button>
        </div>
      </div>

      <Card bordered={false} style={{ marginBottom: 16, flexShrink: 0 }} styles={{ body: { padding: '12px 16px' } }}>
        <Space size={12}>
          <Input placeholder="搜索铺位编号/业态/子类" prefix={<SearchOutlined />} value={searchText}
            onChange={(e) => setSearchText(e.target.value)} allowClear style={{ width: 280 }} />
          <Select placeholder="业态筛选" allowClear value={categoryFilter} onChange={setCategoryFilter}
            style={{ width: 160 }} options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <Select placeholder="状态筛选" allowClear value={statusFilter} onChange={setStatusFilter}
            style={{ width: 140 }} options={UNIT_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
          {DEV_MODE && <Tag color="orange">演示模式</Tag>}
        </Space>
      </Card>

      <Card bordered={false}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: 0 } }}
      >
        <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: true, showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 个铺位` }}
          scroll={{ x: 1000, y: 'calc(100vh - 380px)' }}
          locale={{ emptyText: loading ? '加载中...' : '暂无铺位数据' }}
          style={{ flex: 1 }}
        />
      </Card>

      <Drawer title="铺位详情" placement="right" width={520} open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDetailUnit(null) }}>
        {detailUnit && (
          <Descriptions column={2} size="middle" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="铺位编号" span={2}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{detailUnit.unit_code}</span>
            </Descriptions.Item>
            <Descriptions.Item label="业态">{detailUnit.category || '-'}</Descriptions.Item>
            <Descriptions.Item label="子类">{detailUnit.sub_category || '-'}</Descriptions.Item>
            <Descriptions.Item label="总面积">{detailUnit.area_gross_sqm ? `${detailUnit.area_gross_sqm} ㎡` : '-'}</Descriptions.Item>
            <Descriptions.Item label="使用面积">{detailUnit.area_net_sqm ? `${detailUnit.area_net_sqm} ㎡` : '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {(() => { const s = UNIT_STATUSES.find(x => x.value === detailUnit.status); return <Tag color={s?.color}>{s?.label ?? detailUnit.status}</Tag> })()}
            </Descriptions.Item>
            <Descriptions.Item label="类型">{detailUnit.unit_type === 'kiosk' ? '岛柜' : detailUnit.unit_type === 'standard' ? '标准铺' : detailUnit.unit_type}</Descriptions.Item>
            <Descriptions.Item label="临街面">{detailUnit.frontage_m != null ? `${detailUnit.frontage_m}m` : '-'}</Descriptions.Item>
            <Descriptions.Item label="位置">{detailUnit.floor_position || '-'}</Descriptions.Item>
          </Descriptions>
        )}
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => { setDrawerOpen(false); openEdit(detailUnit!) }}>编辑铺位</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => { setDrawerOpen(false); handleDelete(detailUnit!) }}>删除铺位</Button>
        </Space>
      </Drawer>

      <Modal title={editingUnit ? '编辑铺位' : '新增铺位'} open={editOpen}
        onOk={handleSave} onCancel={() => { setEditOpen(false); setEditingUnit(null) }}
        confirmLoading={saving} okText="保存" cancelText="取消" width={600} destroyOnClose>
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="unit_code" label="铺位编号" rules={[{ required: true, message: '请输入铺位编号' }]}>
            <Input placeholder="例如：F1-001" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="category" label="业态">
              <Select placeholder="选择业态" options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </Form.Item>
            <Form.Item name="sub_category" label="子类">
              <Input placeholder="例如：咖啡茶饮" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="area_gross_sqm" label="面积(㎡)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="120" />
            </Form.Item>
            <Form.Item name="frontage_m" label="临街面(m)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="8" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="status" label="状态" initialValue="vacant">
              <Select options={UNIT_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
            </Form.Item>
            <Form.Item name="unit_type" label="类型" initialValue="standard">
              <Select options={[
                { value: 'standard', label: '标准铺' },
                { value: 'kiosk', label: '岛柜' },
                { value: 'atrium', label: '中庭' },
              ]} />
            </Form.Item>
          </div>
          <Form.Item name="floor_position" label="楼层位置">
            <Input placeholder="例如：东北角" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
