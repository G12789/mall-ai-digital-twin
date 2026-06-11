import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Form, Input, Button, Alert, message } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../../shared/hooks/useAuth'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(values: { email: string; password: string }) {
    setError('')
    setLoading(true)
    try {
      await signIn(values.email, values.password)
      message.success('登录成功')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登录失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-center mb-6">登录</h2>
      {error && <Alert message={error} type="error" className="mb-4" showIcon closable onClose={() => setError('')} />}
      <Form layout="vertical" onFinish={handleSubmit} size="large">
        <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效邮箱' }]}>
          <Input prefix={<MailOutlined />} placeholder="邮箱" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="密码" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            登录
          </Button>
        </Form.Item>
      </Form>
      <div className="text-center text-gray-500">
        还没有账号？<Link to="/register" className="text-blue-600">立即注册</Link>
      </div>
    </>
  )
}
