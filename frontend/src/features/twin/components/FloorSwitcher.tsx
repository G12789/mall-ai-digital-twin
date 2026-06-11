import { Button, Space } from 'antd'
import { UpOutlined, DownOutlined } from '@ant-design/icons'

interface FloorSwitcherProps {
  floorLabels: string[]
  activeIndex: number
  onChange: (index: number) => void
}

export default function FloorSwitcher({ floorLabels, activeIndex, onChange }: FloorSwitcherProps) {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
      <Space direction="vertical" size={4}>
        <Button
          size="small"
          icon={<UpOutlined />}
          disabled={activeIndex <= 0}
          onClick={() => onChange(activeIndex - 1)}
          className="shadow-md"
        />
        <div className="bg-white/90 backdrop-blur rounded-lg shadow-md px-3 py-2 text-center min-w-[80px] border border-gray-200">
          <div className="text-xs text-gray-400">
            {activeIndex + 1} / {floorLabels.length}
          </div>
          <div className="text-sm font-bold text-gray-700">
            {floorLabels[activeIndex] || '-'}
          </div>
        </div>
        <Button
          size="small"
          icon={<DownOutlined />}
          disabled={activeIndex >= floorLabels.length - 1}
          onClick={() => onChange(activeIndex + 1)}
          className="shadow-md"
        />
      </Space>
    </div>
  )
}
