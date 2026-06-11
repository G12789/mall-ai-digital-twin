import { useState, Suspense } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Layout, Spin } from 'antd'
import AppSidebar from '../shared/components/layout/AppSidebar'
import AppHeader from '../shared/components/layout/AppHeader'
import { useAuth } from '../shared/hooks/useAuth'
import LoadingSpinner from '../shared/components/ui/LoadingSpinner'

const { Content } = Layout

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner tip="验证登录状态..." />
  if (!user) return <Navigate to="/login" replace />

  return (
    <Layout hasSider style={{ height: '100vh', overflow: 'hidden' }}>
      <AppSidebar collapsed={collapsed} />
      <Layout style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <div style={{ height: 56, flexShrink: 0 }}>
          <AppHeader collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>
        <Content style={{ flex: 1, minHeight: 0, overflow: 'auto', background: '#f5f5f5', padding: 16 }}>
          <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Spin size="large" />
            </div>
          }>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  )
}
