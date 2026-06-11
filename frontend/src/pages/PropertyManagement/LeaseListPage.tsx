import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table, Tag, Button, Input, Select, Space, message, Result, Card, Drawer, Descriptions, Modal, Form, InputNumber, DatePicker } from 'antd'
import { SearchOutlined, PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { leasesApi } from '../../shared/api/leasesApi'
import { useCurrentMall } from '../../shared/hooks/useCurrentMall'
import { LEASE_STATUSES, RENT_MODELS } from '../../shared/constants/businessTypes'
import type { Lease } from '../../shared/types/database'

const LOAD_TIMEOUT = 15000
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const DEFAULT_DEV_LEASES: Lease[] = [
  { id: 'dev-l1', mall_id: 'dev-mall-001', unit_id: 'dev-u1', tenant_id: 'dev-t1', contract_number: 'LS-2025-001', start_date: '2025-01-01', end_date: '2027-12-31', rent_free_start: null, rent_free_end: null, rent_model: 'fixed', monthly_rent: 36000, rent_per_sqm: 300, turnover_rent_pct: null, mgmt_fee_per_sqm: 25, promotion_fee_per_sqm: 5, deposit_amount: 108000, deposit_months: 3, payment_cycle: 'monthly', renewal_option: true, early_termination: null, special_terms: null, contract_file_url: null, status: 'active', signed_date: '2024-12-15', created_by: null, created_at: '', updated_at: '' },
  { id: 'dev-l2', mall_id: 'dev-mall-001', unit_id: 'dev-u2', tenant_id: 'dev-t2', contract_number: 'LS-2025-002', start_date: '2025-02-01', end_date: '2028-01-31', rent_free_start: '2025-02-01', rent_free_end: '2025-03-01', rent_model: 'hybrid', monthly_rent: 60000, rent_per_sqm: 300, turnover_rent_pct: 8, mgmt_fee_per_sqm: 25, promotion_fee_per_sqm: 5, deposit_amount: 180000, deposit_months: 3, payment_cycle: 'quarterly', renewal_option: true, early_termination: null, special_terms: null, contract_file_url: null, status: 'active', signed_date: '2025-01-20', created_by: null, created_at: '', updated_at: '' },
  { id: 'dev-l3', mall_id: 'dev-mall-001', unit_id: 'dev-u4', tenant_id: 'dev-t3', contract_number: 'LS-2025-003', start_date: '2025-03-01', end_date: '2028-02-28', rent_free_start: null, rent_free_end: null, rent_model: 'turnover_percentage', monthly_rent: null, rent_per_sqm: null, turnover_rent_pct: 15, mgmt_fee_per_sqm: 30, promotion_fee_per_sqm: 8, deposit_amount: 135000, deposit_months: 3, payment_cycle: 'monthly', renewal_option: false, early_termination: null, special_terms: null, contract_file_url: null, status: 'active', signed_date: '2025-02-10', created_by: null, created_at: '', updated_at: '' },
  { id: 'dev-l4', mall_id: 'dev-mall-001', unit_id: 'dev-u5', tenant_id: 'dev-t4', contract_number: 'LS-2024-001', start_date: '2024-06-01', end_date: '2026-05-31', rent_free_start: '2024-06-01', rent_free_end: '2024-08-31', rent_model: 'fixed', monthly_rent: 90000, rent_per_sqm: 300, turnover_rent_pct: null, mgmt_fee_per_sqm: 20, promotion_fee_per_sqm: 5, deposit_amount: 270000, deposit_months: 3, payment_cycle: 'quarterly', renewal_option: true, early_termination: null, special_terms: null, contract_file_url: null, status: 'expiring_soon', signed_date: '2024-04-01', created_by: null, created_at: '', updated_at: '' },
  { id: 'dev-l5', mall_id: 'dev-mall-001', unit_id: 'dev-u6', tenant_id: 'dev-t5', contract_number: 'LS-2024-002', start_date: '2024-03-01', end_date: '2025-03-01', rent_free_start: null, rent_free_end: null, rent_model: 'fixed', monthly_rent: 18000, rent_per_sqm: 200, turnover_rent_pct: null, mgmt_fee_per_sqm: 20, promotion_fee_per_sqm: 3, deposit_amount: 54000, deposit_months: 3, payment_cycle: 'monthly', renewal_option: false, early_termination: null, special_terms: null, contract_file_url: null, status: 'expired', signed_date: '2024-01-15', created_by: null, created_at: '', updated_at: '' },
]

async function fetchWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('请求超时，请检查网络或后端服务')), ms)),
  ])
}

export default function LeaseListPage() {
  const { mallId } = useCurrentMall()
  const [leases, setLeases] = useState<Lease[]>(() => DEV_MODE ? [...DEFAULT_DEV_LEASES] : [])
  const [loading, setLoading] = useState(!DEV_MODE)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const filterMallId = searchParams.get('mall_id') || mallId

  // Detail
  const [detailLease, setDetailLease] = useState<Lease | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Edit
  const [editOpen, setEditOpen] = useState(false)
  const [editingLease, setEditingLease] = useState<Lease | null>(null)
  const [editForm] = Form.useForm()
  const [saving, setSaving] = useState(false)

  const loadLeases = () => {
    if (!filterMallId) { setLoading(false); setError('未选择商场'); return }
    if (DEV_MODE) { setLeases([...DEFAULT_DEV_LEASES]); setLoading(false); setError(null); return }
    setLoading(true); setError(null)
    fetchWithTimeout(leasesApi.listByMall(filterMallId), LOAD_TIMEOUT)
      .then((data) => { setLeases(data); setError(null) })
      .catch((err) => { console.error('[LeaseListPage] 加载失败:', err); setError(err?.message || '加载租约列表失败') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadLeases() }, [filterMallId])

  const filtered = useMemo(() => {
    let list = leases
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      list = list.filter((l) =>
        (l.contract_number || '').toLowerCase().includes(q) ||
        (l.unit_id || '').toLowerCase().includes(q) ||
        (l.tenant_id || '').toLowerCase().includes(q),
      )
    }
    if (statusFilter) list = list.filter((l) => l.status === statusFilter)
    return list
  }, [leases, searchText, statusFilter])

  const openDetail = (l: Lease) => { setDetailLease(l); setDrawerOpen(true) }
  const openEdit = (l?: Lease) => {
    if (l) { setEditingLease(l); editForm.setFieldsValue(l) }
    else { setEditingLease(null); editForm.resetFields() }
    setEditOpen(true)
  }
  const handleSave = async () => {
    try {
      const values = await editForm.validateFields()
      setSaving(true)
      if (editingLease) {
        setLeases((prev) => prev.map((l) => l.id === editingLease.id ? { ...l, ...values } : l))
        message.success(`租约「${values.contract_number || editingLease.id}」已更新`)
      } else {
        const newLease: Lease = {
          ...values,
          id: `dev-l${Date.now()}`,
          mall_id: filterMallId || 'dev-mall-001',
          unit_id: values.unit_id || 'dev-u1',
          tenant_id: values.tenant_id || 'dev-t1',
          rent_free_start: null, rent_free_end: null,
          turnover_rent_pct: values.turnover_rent_pct || null,
          mgmt_fee_per_sqm: values.mgmt_fee_per_sqm || null,
          promotion_fee_per_sqm: null,
          contract_file_url: null,
          early_termination: null, special_terms: null, created_by: null,
          renewal_option: values.renewal_option ?? false,
          signed_date: values.signed_date || new Date().toISOString().slice(0, 10),
          created_at: '', updated_at: '',
        }
        setLeases((prev) => [newLease, ...prev])
        message.success(`租约已创建`)
      }
      setEditOpen(false); setEditingLease(null)
    } catch { /* validation */ }
    finally { setSaving(false) }
  }
  const handleDelete = (l: Lease) => {
    Modal.confirm({
      title: '确认删除', content: `确定要删除合同「${l.contract_number || l.id}」吗？`,
      okText: '确认删除', okType: 'danger', cancelText: '取消',
      onOk: () => { setLeases((prev) => prev.filter((x) => x.id !== l.id)); message.success('租约已删除') },
    })
  }

  const columns: ColumnsType<Lease> = [
    {
      title: '合同编号', dataIndex: 'contract_number', key: 'contract_number', width: 150,
      render: (v: string) => v ? <span style={{ fontWeight: 600 }}>{v}</span> : '-',
    },
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date', width: 110 },
    {
      title: '结束日期', dataIndex: 'end_date', key: 'end_date', width: 110,
      sorter: (a, b) => a.end_date.localeCompare(b.end_date),
    },
    {
      title: '租金模式', dataIndex: 'rent_model', key: 'rent_model', width: 130,
      render: (v: string) => { const m = RENT_MODELS.find((m) => m.value === v); return <Tag>{m?.label ?? v}</Tag> },
    },
    {
      title: '月租金(元)', dataIndex: 'monthly_rent', key: 'monthly_rent', width: 130,
      sorter: (a, b) => (a.monthly_rent || 0) - (b.monthly_rent || 0),
      render: (v: number) => v ? <span style={{ fontWeight: 600, color: '#1f2937' }}>¥{v.toLocaleString()}</span> : '-',
    },
    {
      title: '押金(月)', dataIndex: 'deposit_months', key: 'deposit_months', width: 90, align: 'center',
      render: (v: number) => v != null ? `${v}个月` : '-',
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v: string) => { const s = LEASE_STATUSES.find((x) => x.value === v); return <Tag color={s?.color}>{s?.label ?? v}</Tag> },
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

  if (error && !loading && leases.length === 0) {
    return (
      <Card bordered={false}>
        <Result status="error" title="加载失败" subTitle={error}
          extra={<Button type="primary" icon={<ReloadOutlined />} onClick={loadLeases}>重试</Button>}
        />
      </Card>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="page-title">租约管理</h2>
            <p className="page-subtitle">管理铺位租约合同、租金、到期日等信息</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>新增租约</Button>
        </div>
      </div>

      <Card bordered={false} style={{ marginBottom: 16, flexShrink: 0 }} styles={{ body: { padding: '12px 16px' } }}>
        <Space size={12}>
          <Input placeholder="搜索合同编号/铺位/商户" prefix={<SearchOutlined />} value={searchText}
            onChange={(e) => setSearchText(e.target.value)} allowClear style={{ width: 280 }} />
          <Select placeholder="状态筛选" allowClear value={statusFilter} onChange={setStatusFilter}
            style={{ width: 140 }} options={LEASE_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
          {DEV_MODE && <Tag color="orange">演示模式</Tag>}
        </Space>
      </Card>

      <Card bordered={false}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: 0 } }}
      >
        <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: true, showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 个租约` }}
          scroll={{ x: 1050, y: 'calc(100vh - 380px)' }}
          locale={{ emptyText: loading ? '加载中...' : '暂无租约数据' }}
          style={{ flex: 1 }}
        />
      </Card>

      <Drawer title="租约详情" placement="right" width={560} open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDetailLease(null) }}>
        {detailLease && (
          <Descriptions column={2} size="middle" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="合同编号" span={2}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{detailLease.contract_number || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="开始日期">{detailLease.start_date}</Descriptions.Item>
            <Descriptions.Item label="结束日期">{detailLease.end_date}</Descriptions.Item>
            <Descriptions.Item label="租金模式">
              {RENT_MODELS.find(m => m.value === detailLease.rent_model)?.label || detailLease.rent_model}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {(() => { const s = LEASE_STATUSES.find(x => x.value === detailLease.status); return <Tag color={s?.color}>{s?.label ?? detailLease.status}</Tag> })()}
            </Descriptions.Item>
            <Descriptions.Item label="月租金">{detailLease.monthly_rent ? `¥${detailLease.monthly_rent.toLocaleString()}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="押金">{detailLease.deposit_amount ? `¥${detailLease.deposit_amount.toLocaleString()}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="押金月数">{detailLease.deposit_months} 个月</Descriptions.Item>
            <Descriptions.Item label="付款周期">{detailLease.payment_cycle === 'monthly' ? '月付' : detailLease.payment_cycle === 'quarterly' ? '季付' : detailLease.payment_cycle}</Descriptions.Item>
            <Descriptions.Item label="续租选项">{detailLease.renewal_option ? '是' : '否'}</Descriptions.Item>
            <Descriptions.Item label="签约日期">{detailLease.signed_date || '-'}</Descriptions.Item>
          </Descriptions>
        )}
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => { setDrawerOpen(false); openEdit(detailLease!) }}>编辑租约</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => { setDrawerOpen(false); handleDelete(detailLease!) }}>删除租约</Button>
        </Space>
      </Drawer>

      <Modal title={editingLease ? '编辑租约' : '新增租约'} open={editOpen}
        onOk={handleSave} onCancel={() => { setEditOpen(false); setEditingLease(null) }}
        confirmLoading={saving} okText="保存" cancelText="取消" width={640} destroyOnClose>
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="contract_number" label="合同编号" rules={[{ required: true, message: '请输入合同编号' }]}>
              <Input placeholder="例如：LS-2026-001" />
            </Form.Item>
            <Form.Item name="status" label="状态" initialValue="active">
              <Select options={LEASE_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="start_date" label="开始日期" rules={[{ required: true }]}>
              <Input placeholder="2026-01-01" />
            </Form.Item>
            <Form.Item name="end_date" label="结束日期" rules={[{ required: true }]}>
              <Input placeholder="2028-12-31" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="rent_model" label="租金模式" initialValue="fixed">
              <Select options={RENT_MODELS.map((m) => ({ value: m.value, label: m.label }))} />
            </Form.Item>
            <Form.Item name="payment_cycle" label="付款周期" initialValue="monthly">
              <Select options={[
                { value: 'monthly', label: '月付' },
                { value: 'quarterly', label: '季付' },
                { value: 'semi-annual', label: '半年付' },
                { value: 'annual', label: '年付' },
              ]} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="monthly_rent" label="月租金(元)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="36000" />
            </Form.Item>
            <Form.Item name="deposit_amount" label="押金金额(元)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="108000" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="deposit_months" label="押金月数" initialValue={3}>
              <InputNumber min={0} max={6} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="renewal_option" label="续租选项" initialValue={false} valuePropName="checked">
              <Select options={[{ value: true, label: '允许续租' }, { value: false, label: '不允许续租' }]} />
            </Form.Item>
          </div>
          <Form.Item name="signed_date" label="签约日期">
            <Input placeholder="2025-12-01" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
