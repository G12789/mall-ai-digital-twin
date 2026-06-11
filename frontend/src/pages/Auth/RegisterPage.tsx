import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Form, Input, Button, Alert, message } from 'antd'
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '../../shared/hooks/useAuth'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(values: { email: string; password: string; fullName: string }) {
    setError('')
    setLoading(true)
    try {
      await signUp(values.email, values.password, values.fullName)
      message.success('注册成功，请查收验证邮件')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '注册失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-center mb-6">注册</h2>
      {error && <Alert message={error} type="error" className="mb-4" showIcon closable onClose={() => setError('')} />}
      <Form layout="vertical" onFinish={handleSubmit} size="large">
        <Form.Item name="fullName" rules={[{ required: true, message: '请输入姓名' }]}>
          <Input prefix={<UserOutlined />} placeholder="姓名" />
        </Form.Item>
        <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效邮箱' }]}>
          <Input prefix={<MailOutlined />} placeholder="邮箱" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="密码" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve()
                return Promise.reject(new Error('两次输入的密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            注册
          </Button>
        </Form.Item>
      </Form>
      <div className="text-center text-gray-500">
        已有账号？<Link to="/login" className="text-blue-600">立即登录</Link>
      </div>
    </>
  )
}
