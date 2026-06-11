import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, InputNumber, Button, Card, message } from 'antd'
import { mallsApi } from '../../shared/api/mallsApi'
import { useCurrentMall } from '../../shared/hooks/useCurrentMall'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

async function fetchWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('请求超时，请检查网络或后端服务')), ms)),
  ])
}

export default function MallCreatePage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setMall } = useCurrentMall()

  async function handleSubmit(values: Record<string, unknown>) {
    if (DEV_MODE) {
      setLoading(true)
      // simulate brief loading then navigate to demo mall
      setTimeout(() => {
        const demoId = 'dev-mall-001'
        setMall(demoId, values.name as string)
        message.success('商场创建成功（演示模式）')
        navigate(`/malls/${demoId}`)
        setLoading(false)
      }, 600)
      return
    }

    setLoading(true)
    try {
      const mall = await fetchWithTimeout(
        mallsApi.create({
          name: values.name as string,
          address: values.address as string,
          city: values.city as string,
          district: values.district as string,
          total_area_sqm: values.total_area_sqm as number,
          leasable_area_sqm: values.leasable_area_sqm as number,
          contact_name: values.contact_name as string,
          contact_phone: values.contact_phone as string,
        }),
        15000,
      )
      message.success('商场创建成功')
      navigate(`/malls/${mall.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '创建失败'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1a1a2e' }}>创建商场</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#999' }}>
          填写商场基本信息，创建后将自动生成默认楼层结构
        </p>
      </div>

      <Card bordered={false} style={{ maxWidth: 720 }}>
        <Form layout="vertical" onFinish={handleSubmit} size="large">
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
            <Button type="primary" htmlType="submit" loading={loading}>创建商场</Button>
            <Button style={{ marginLeft: 12 }} onClick={() => navigate('/malls')}>取消</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
