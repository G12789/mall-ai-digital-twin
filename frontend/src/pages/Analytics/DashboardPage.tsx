import { BarChartOutlined } from '@ant-design/icons'

export default function AnalyticsDashboardPage() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1a1a2e' }}>数据分析</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#999' }}>
          客流分析、POS数据、出租率趋势等
        </p>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        borderRadius: 8,
        border: '1px dashed #d9d9d9',
        minHeight: 300,
      }}>
        <BarChartOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
        <p style={{ fontSize: 16, color: '#999', margin: 0 }}>数据分析功能将在 M3 阶段开发</p>
        <p style={{ fontSize: 13, color: '#bbb', marginTop: 8 }}>支持客流分析、POS数据、出租率趋势等</p>
      </div>
    </div>
  )
}
