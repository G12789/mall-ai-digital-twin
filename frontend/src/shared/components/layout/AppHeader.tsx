import { Button, Dropdown, Space, Breadcrumb, Badge } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentMall } from '../../hooks/useCurrentMall'
import { useLocation } from 'react-router-dom'

interface AppHeaderProps {
  collapsed: boolean
  onToggle: () => void
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': '工作台',
  '/malls': '商场管理',
  '/units': '铺位管理',
  '/tenants': '商户管理',
  '/leases': '租约管理',
  '/copilot': 'AI 助手',
  '/knowledge': '知识库',
  '/analytics': '数据分析',
}

export default function AppHeader({ collapsed, onToggle }: AppHeaderProps) {
  const { user, signOut } = useAuth()
  const { mallName } = useCurrentMall()
  const location = useLocation()

  const displayName = user?.email?.split('@')[0] || user?.user_metadata?.full_name || '管理员'
  const currentPage = BREADCRUMB_MAP['/' + location.pathname.split('/')[1]] || location.pathname

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '100%',
      background: '#fff',
      borderBottom: '1px solid #f0f0f0',
    }}>
      <Space size={16}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          style={{ fontSize: 16, color: '#64748b' }}
        />
        <Breadcrumb
          items={[
            { title: <span style={{ color: '#94a3b8' }}>首页</span> },
            { title: <span style={{ color: '#334155', fontWeight: 500 }}>{currentPage}</span> },
          ]}
        />
        {mallName && (
          <span style={{
            fontSize: 12,
            color: '#2563eb',
            background: '#eff6ff',
            padding: '2px 10px',
            borderRadius: 4,
            fontWeight: 500,
          }}>
            {mallName}
          </span>
        )}
      </Space>

      <Space size={8}>
        <Button type="text" icon={<SearchOutlined />} style={{ color: '#94a3b8' }} />
        <Badge count={0} size="small">
          <Button type="text" icon={<BellOutlined />} style={{ color: '#94a3b8' }} />
        </Badge>
        <Dropdown
          menu={{
            items: [
              {
                key: 'user',
                label: user?.email || displayName,
                icon: <UserOutlined />,
                disabled: true,
              },
              { type: 'divider' },
              {
                key: 'settings',
                label: '个人设置',
                icon: <SettingOutlined />,
              },
              { type: 'divider' },
              {
                key: 'logout',
                label: '退出登录',
                icon: <LogoutOutlined />,
                danger: true,
                onClick: signOut,
              },
            ],
          }}
        >
          <Button type="text" style={{ color: '#475569' }}>
            <Space size={8}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
              }}>
                {displayName[0]?.toUpperCase() || 'A'}
              </div>
              <span style={{ fontSize: 13 }}>{displayName}</span>
            </Space>
          </Button>
        </Dropdown>
      </Space>
    </div>
  )
}
