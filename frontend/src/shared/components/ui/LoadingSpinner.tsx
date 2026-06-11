import { Spin } from 'antd'

export default function LoadingSpinner({ tip = '加载中...' }: { tip?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <Spin size="large" tip={tip}>
        <div className="p-12" />
      </Spin>
    </div>
  )
}
