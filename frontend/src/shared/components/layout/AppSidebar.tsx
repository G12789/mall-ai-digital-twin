import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  UserOutlined,
  FileTextOutlined,
  RobotOutlined,
  BookOutlined,
  BarChartOutlined,
} from '@ant-design/icons'

const { Sider } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/malls', icon: <ShopOutlined />, label: '商场管理' },
  { key: '/units', icon: <EnvironmentOutlined />, label: '铺位管理' },
  { key: '/tenants', icon: <UserOutlined />, label: '商户管理' },
  { key: '/leases', icon: <FileTextOutlined />, label: '租约管理' },
  { key: '/copilot', icon: <RobotOutlined />, label: 'AI 助手' },
  { key: '/knowledge', icon: <BookOutlined />, label: '知识库' },
  { key: '/analytics', icon: <BarChartOutlined />, label: '数据分析' },
]

export default function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedKey = '/' + location.pathname.split('/')[1]

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={240}
      collapsedWidth={64}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo area */}
      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 16px',
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #2563eb, #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>M</span>
        </div>
        {!collapsed && (
          <span style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            whiteSpace: 'nowrap',
            letterSpacing: 0.5,
          }}>
            商场AI孪生
          </span>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{
          borderInlineEnd: 'none',
          marginTop: 8,
        }}
      />
    </Sider>
  )
}
