import { Progress } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

interface TwinLoadingScreenProps {
  progress: number
  message?: string
}

export default function TwinLoadingScreen({ progress, message = '加载3D场景...' }: TwinLoadingScreenProps) {
  if (progress >= 100) return null

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <LoadingOutlined className="text-4xl text-blue-500 mb-4" spin />
      <p className="text-gray-600 mb-4">{message}</p>
      <div className="w-64">
        <Progress percent={Math.round(progress)} status="active" strokeColor="#1677ff" />
      </div>
    </div>
  )
}
