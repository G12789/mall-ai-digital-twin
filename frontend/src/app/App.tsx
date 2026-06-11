import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider } from '../shared/hooks/useAuth'
import { router } from './router'

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#6366f1',
          borderRadius: 8,
          borderRadiusSM: 6,
          borderRadiusLG: 12,
          colorBgLayout: '#f0f2f5',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          colorBorder: '#e5e7eb',
          colorBorderSecondary: '#f0f0f0',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif",
          fontSize: 14,
          fontSizeLG: 16,
          fontSizeSM: 12,
          colorText: '#1f2937',
          colorTextSecondary: '#6b7280',
          colorTextTertiary: '#9ca3af',
          lineHeight: 1.6,
          paddingLG: 24,
          paddingMD: 20,
          paddingSM: 16,
          paddingXS: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          boxShadowSecondary: '0 4px 12px rgba(0,0,0,0.08)',
        },
        components: {
          Layout: {
            siderBg: '#0f172a',
            headerBg: '#ffffff',
            bodyBg: '#f0f2f5',
            triggerBg: '#1e293b',
            triggerColor: '#94a3b8',
          },
          Menu: {
            darkItemBg: '#0f172a',
            darkItemSelectedBg: '#2563eb',
            darkSubMenuItemBg: '#0f172a',
            darkItemColor: '#94a3b8',
            darkItemSelectedColor: '#ffffff',
            darkItemHoverBg: 'rgba(37,99,235,0.15)',
            itemBorderRadius: 8,
            itemMarginInline: 8,
            itemMarginBlock: 2,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            rowHoverBg: '#f1f5f9',
            borderColor: '#f1f5f9',
            cellPaddingBlock: 12,
            cellPaddingInline: 16,
          },
          Card: {
            paddingLG: 20,
            paddingMD: 16,
          },
          Button: {
            borderRadius: 6,
            controlHeight: 36,
            controlHeightLG: 42,
          },
          Tag: {
            borderRadiusSM: 4,
          },
          Statistic: {
            titleFontSize: 13,
          },
        },
      }}
    >
      <AntApp>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  )
}
