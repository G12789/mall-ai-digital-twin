import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Form, Input, InputNumber, Button, Card, message, Result } from 'antd'
import { mallsApi } from '../../shared/api/mallsApi'
import { useCurrentMall } from '../../shared/hooks/useCurrentMall'
import type { Mall } from '../../shared/types/database'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const DEV_MALL: Mall = {
  id: 'dev-mall-001', tenant_id: 'dev-tenant-001', name: '星辰购物中心', name_en: 'Star Mall',
  address: '中山路888号', city: '深圳', district: '南山区', total_area_sqm: 42000, leasable_area_sqm: 32000,
  logo_url: null, cover_image_url: null, contact_name: '王总', contact_phone: '13800138000',
  contact_email: 'wang@starmall.com', status: 'active', config: {}, created_at: '', updated_at: '',
}

export default function MallEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setMall } = useCurrentMall()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    if (DEV_MODE) {
      form.setFieldsValue(DEV_MALL)
      setFetching(false)
      return
    }
    mallsApi.getById(id)
      .then((m) => { form.setFieldsValue(m); setFetching(false) })
      .catch((err) => { setError(err?.message || '加载失败'); setFetching(false) })
  }, [id])

  async function handleSubmit(values: Record<string, unknown>) {
    if (!id) return
    setLoading(true)
    try {
      if (DEV_MODE) {
        setMall(id, values.name as string)
        message.success('商场信息已更新（演示模式）')
        navigate(`/malls/${id}`)
        return
      }
      await mallsApi.update(id, values as Partial<Mall>)
      if (values.name) setMall(id, values.name as string)
      message.success('商场信息已更新')
      navigate(`/malls/${id}`)
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '更新失败')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <Card bordered={false}>
        <Result status="error" title="加载失败" subTitle={error}
          extra={<Button type="primary" onClick={() => navigate('/malls')}>返回列表</Button>}
        />
      </Card>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 className="page-title">编辑商场信息</h2>
        <p className="page-subtitle">修改商场基本信息和联系方式</p>
      </div>
      <Card bordered={false} loading={fetching} style={{ maxWidth: 720 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item name="name" label="商场名称" rules={[{ required: true, message: '请输入商场名称' }]}>
            <Input placeholder="例如：星辰购物中心" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="city" label="城市" rules={[{ required: true }]}>
              <Input placeholder="例如：北京" />
            </Form.Item>
            <Form.Item name="district" label="区/县">
              <Input placeholder="例如：朝阳区" />
            </Form.Item>
          </div>
          <Form.Item name="address" label="详细地址" rules={[{ required: true }]}>
            <Input placeholder="例如：建国路88号" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="total_area_sqm" label="总面积(㎡)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="50000" />
            </Form.Item>
            <Form.Item name="leasable_area_sqm" label="可租赁面积(㎡)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="35000" />
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
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>保存修改</Button>
            <Button style={{ marginLeft: 12 }} onClick={() => navigate(`/malls/${id}`)}>取消</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
