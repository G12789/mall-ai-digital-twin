import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table, Tag, Button, Input, Select, Space, message, Result, Card, Drawer, Descriptions, Modal, Form } from 'antd'
import { SearchOutlined, PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { mallTenantsApi } from '../../shared/api/tenantsApi'
import { useCurrentMall } from '../../shared/hooks/useCurrentMall'
import { BUSINESS_CATEGORIES } from '../../shared/constants/businessTypes'
import type { MallTenant } from '../../shared/types/database'

const LOAD_TIMEOUT = 15000
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const DEFAULT_DEV_TENANTS: MallTenant[] = [
  { id: 'dev-t1', mall_id: 'dev-mall-001', name: '星巴克', brand: 'Starbucks', category: '餐饮', sub_category: '咖啡茶饮', contact_name: '张经理', contact_phone: '13800138001', contact_email: 'zhang@starbucks.com', contact_wechat: null, business_license: null, legal_representative: null, registered_capital: null, tier: 'A', status: 'active', logo_url: null, notes: '国际连锁咖啡品牌，客流量稳定', metadata: {}, created_at: '2025-01-15', updated_at: '2025-06-01' },
  { id: 'dev-t2', mall_id: 'dev-mall-001', name: '优衣库', brand: 'UNIQLO', category: '零售', sub_category: '服装', contact_name: '李主管', contact_phone: '13800138002', contact_email: null, contact_wechat: null, business_license: null, legal_representative: null, registered_capital: null, tier: 'A', status: 'active', logo_url: null, notes: null, metadata: {}, created_at: '2025-02-01', updated_at: '' },
  { id: 'dev-t3', mall_id: 'dev-mall-001', name: '海底捞', brand: 'Haidilao', category: '餐饮', sub_category: '火锅', contact_name: '王店长', contact_phone: '13800138003', contact_email: null, contact_wechat: null, business_license: null, legal_representative: null, registered_capital: null, tier: 'S', status: 'active', logo_url: null, notes: '头部火锅品牌，S级商户', metadata: {}, created_at: '2025-03-01', updated_at: '' },
  { id: 'dev-t4', mall_id: 'dev-mall-001', name: '万达影城', brand: 'Wanda Cinema', category: '娱乐', sub_category: '影院', contact_name: '赵总', contact_phone: '13800138004', contact_email: null, contact_wechat: null, business_license: null, legal_representative: null, registered_capital: null, tier: 'A', status: 'active', logo_url: null, notes: null, metadata: {}, created_at: '2024-06-01', updated_at: '' },
  { id: 'dev-t5', mall_id: 'dev-mall-001', name: '学而思', brand: 'XES', category: '教育', sub_category: 'K12', contact_name: '刘老师', contact_phone: '13800138005', contact_email: null, contact_wechat: null, business_license: null, legal_representative: null, registered_capital: null, tier: 'B', status: 'inactive', logo_url: null, notes: '已停业，租约到期未续', metadata: {}, created_at: '2024-03-01', updated_at: '2025-03-01' },
  { id: 'dev-t6', mall_id: 'dev-mall-001', name: '屈臣氏', brand: 'Watsons', category: '零售', sub_category: '化妆品', contact_name: '陈经理', contact_phone: '13800138006', contact_email: null, contact_wechat: null, business_license: null, legal_representative: null, registered_capital: null, tier: 'B', status: 'active', logo_url: null, notes: null, metadata: {}, created_at: '2025-04-01', updated_at: '' },
]

async function fetchWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('请求超时，请检查网络或后端服务')), ms)),
  ])
}

const TIER_LABELS: Record<string, { color: string; label: string }> = {
  S: { color: 'gold', label: 'S级' },
  A: { color: 'green', label: 'A级' },
  B: { color: 'blue', label: 'B级' },
  C: { color: 'default', label: 'C级' },
}

export default function TenantListPage() {
  const { mallId } = useCurrentMall()
  const [tenants, setTenants] = useState<MallTenant[]>(() => {
    if (DEV_MODE) return [...DEFAULT_DEV_TENANTS]
    return []
  })
  const [loading, setLoading] = useState(!DEV_MODE)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const filterMallId = searchParams.get('mall_id') || mallId

  // Detail drawer
  const [detailTenant, setDetailTenant] = useState<MallTenant | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<MallTenant | null>(null)
  const [editForm] = Form.useForm()
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<MallTenant | null>(null)

  const loadTenants = () => {
    if (!filterMallId) { setLoading(false); setError('未选择商场，请先进入商场详情页'); return }
    if (DEV_MODE) { setTenants([...DEFAULT_DEV_TENANTS]); setLoading(false); setError(null); return }
    setLoading(true); setError(null)
    fetchWithTimeout(mallTenantsApi.listByMall(filterMallId), LOAD_TIMEOUT)
      .then((data) => { setTenants(data); setError(null) })
      .catch((err) => { console.error('[TenantListPage] 加载失败:', err); setError(err?.message || '加载商户列表失败') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTenants() }, [filterMallId])

  const filtered = useMemo(() => {
    let list = tenants
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      list = list.filter((t) =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.brand || '').toLowerCase().includes(q) ||
        (t.contact_name || '').toLowerCase().includes(q),
      )
    }
    if (categoryFilter) list = list.filter((t) => t.category === categoryFilter)
    return list
  }, [tenants, searchText, categoryFilter])

  // Actions
  const openDetail = (t: MallTenant) => { setDetailTenant(t); setDrawerOpen(true) }
  const openEdit = (t?: MallTenant) => {
    if (t) {
      setEditingTenant(t)
      editForm.setFieldsValue(t)
    } else {
      setEditingTenant(null)
      editForm.resetFields()
    }
    setEditOpen(true)
  }
  const handleSave = async () => {
    try {
      const values = await editForm.validateFields()
      setSaving(true)
      if (editingTenant) {
        // Update existing
        setTenants((prev) => prev.map((t) => t.id === editingTenant.id ? { ...t, ...values } : t))
        message.success(`商户「${values.name}」已更新`)
      } else {
        // Create new
        const newTenant: MallTenant = {
          ...values,
          id: `dev-t${Date.now()}`,
          mall_id: filterMallId || 'dev-mall-001',
          brand: values.brand || null,
          sub_category: values.sub_category || null,
          contact_email: values.contact_email || null,
          contact_wechat: null,
          business_license: null,
          legal_representative: null,
          registered_capital: null,
          logo_url: null,
          notes: values.notes || null,
          metadata: {},
          created_at: new Date().toISOString().slice(0, 10),
          updated_at: '',
        }
        setTenants((prev) => [newTenant, ...prev])
        message.success(`商户「${values.name}」已创建`)
      }
      setEditOpen(false)
      setEditingTenant(null)
    } catch { /* validation failed */ }
    finally { setSaving(false) }
  }
  const handleDelete = (t: MallTenant) => {
    setDeleteTarget(t)
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除商户「${t.name}」吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setTenants((prev) => prev.filter((x) => x.id !== t.id))
        message.success(`商户「${t.name}」已删除`)
        setDeleteTarget(null)
      },
      onCancel: () => setDeleteTarget(null),
    })
  }

  const columns: ColumnsType<MallTenant> = [
    {
      title: '商户名称', dataIndex: 'name', key: 'name', width: 180,
      render: (v: string, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{v}</div>
          {r.brand && <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.brand}</div>}
        </div>
      ),
    },
    {
      title: '业态', dataIndex: 'category', key: 'category', width: 90,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '子类', dataIndex: 'sub_category', key: 'sub_category', width: 100,
      render: (v: string) => v || <span style={{ color: '#d1d5db' }}>-</span>,
    },
    { title: '联系人', dataIndex: 'contact_name', key: 'contact_name', width: 100 },
    { title: '电话', dataIndex: 'contact_phone', key: 'contact_phone', width: 130 },
    {
      title: '等级', dataIndex: 'tier', key: 'tier', width: 70, align: 'center',
      render: (v: string) => v ? <Tag color={TIER_LABELS[v]?.color || 'default'}>{TIER_LABELS[v]?.label || v}</Tag> : '-',
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80, align: 'center',
      render: (v: string) => <Tag color={v === 'active' ? 'success' : 'default'}>{v === 'active' ? '活跃' : '停用'}</Tag>,
    },
    {
      title: '入驻日期', dataIndex: 'created_at', key: 'created_at', width: 110,
      render: (v: string) => v?.slice(0, 10) || '-',
    },
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

  if (error && !loading && tenants.length === 0) {
    return (
      <Card bordered={false}>
        <Result status="error" title="加载失败" subTitle={error}
          extra={<Button type="primary" icon={<ReloadOutlined />} onClick={loadTenants}>重试</Button>}
        />
      </Card>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="page-title">商户管理</h2>
            <p className="page-subtitle">管理商场入驻商户的品牌、业态、联系人等信息</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>
            新增商户
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <Card bordered={false} style={{ marginBottom: 16, flexShrink: 0 }} styles={{ body: { padding: '12px 16px' } }}>
        <Space size={12}>
          <Input
            placeholder="搜索商户名称/品牌/联系人"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 280 }}
          />
          <Select
            placeholder="业态筛选"
            allowClear
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 160 }}
            options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          {DEV_MODE && <Tag color="orange">演示模式</Tag>}
        </Space>
      </Card>

      {/* Table */}
      <Card
        bordered={false}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: 0 } }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          loading={loading}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 个商户`,
          }}
          scroll={{ x: 1100, y: 'calc(100vh - 380px)' }}
          locale={{ emptyText: loading ? '加载中...' : DEV_MODE ? '暂无商户数据，点击「新增商户」开始' : '暂无商户数据' }}
          style={{ flex: 1 }}
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title="商户详情"
        placement="right"
        width={520}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDetailTenant(null) }}
      >
        {detailTenant && (
          <Descriptions column={2} size="middle" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="商户名称" span={2}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{detailTenant.name}</span>
            </Descriptions.Item>
            {detailTenant.brand && (
              <Descriptions.Item label="品牌" span={2}>{detailTenant.brand}</Descriptions.Item>
            )}
            <Descriptions.Item label="业态">{detailTenant.category}</Descriptions.Item>
            <Descriptions.Item label="子类">{detailTenant.sub_category || '-'}</Descriptions.Item>
            <Descriptions.Item label="等级">
              <Tag color={TIER_LABELS[detailTenant.tier]?.color}>{TIER_LABELS[detailTenant.tier]?.label || detailTenant.tier}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={detailTenant.status === 'active' ? 'success' : 'default'}>
                {detailTenant.status === 'active' ? '活跃' : '停用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="联系人">{detailTenant.contact_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{detailTenant.contact_phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱" span={2}>{detailTenant.contact_email || '-'}</Descriptions.Item>
            <Descriptions.Item label="入驻日期">{detailTenant.created_at?.slice(0, 10) || '-'}</Descriptions.Item>
            <Descriptions.Item label="更新日期">{detailTenant.updated_at?.slice(0, 10) || '-'}</Descriptions.Item>
            {detailTenant.notes && (
              <Descriptions.Item label="备注" span={2}>{detailTenant.notes}</Descriptions.Item>
            )}
          </Descriptions>
        )}
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => { setDrawerOpen(false); openEdit(detailTenant!) }}>
            编辑商户
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => { setDrawerOpen(false); handleDelete(detailTenant!) }}>
            删除商户
          </Button>
        </Space>
      </Drawer>

      {/* Edit/Create Modal */}
      <Modal
        title={editingTenant ? '编辑商户' : '新增商户'}
        open={editOpen}
        onOk={handleSave}
        onCancel={() => { setEditOpen(false); setEditingTenant(null) }}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="商户名称" rules={[{ required: true, message: '请输入商户名称' }]}>
            <Input placeholder="例如：星巴克" />
          </Form.Item>
          <Form.Item name="brand" label="品牌">
            <Input placeholder="例如：Starbucks" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="category" label="业态" rules={[{ required: true, message: '请选择业态' }]}>
              <Select placeholder="选择业态" options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </Form.Item>
            <Form.Item name="sub_category" label="子类">
              <Input placeholder="例如：咖啡茶饮" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="tier" label="商户等级">
              <Select options={Object.entries(TIER_LABELS).map(([k, v]) => ({ value: k, label: v.label }))} />
            </Form.Item>
            <Form.Item name="status" label="状态" initialValue="active">
              <Select options={[
                { value: 'active', label: '活跃' },
                { value: 'inactive', label: '停用' },
              ]} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="contact_name" label="联系人">
              <Input placeholder="姓名" />
            </Form.Item>
            <Form.Item name="contact_phone" label="联系电话">
              <Input placeholder="手机号" />
            </Form.Item>
          </div>
          <Form.Item name="contact_email" label="邮箱">
            <Input placeholder="邮箱地址" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
