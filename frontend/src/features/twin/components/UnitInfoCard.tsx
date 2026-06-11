import { Descriptions, Tag, Empty } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import type { MallUnit } from '../../../shared/types/database'
import { getUnitColor, getUnitStatusLabel } from '../utils/unitColorMapping'

interface UnitInfoCardProps {
  unit: MallUnit | null
  onClose: () => void
}

export default function UnitInfoCard({ unit, onClose }: UnitInfoCardProps) {
  if (!unit) {
    return (
      <div className="absolute top-4 right-4 w-72 bg-white/95 backdrop-blur rounded-lg shadow-lg p-4 border border-gray-200">
        <Empty description="点击铺位查看详情" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  return (
    <div className="absolute top-4 right-4 w-72 bg-white/95 backdrop-blur rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <h4 className="font-bold text-sm m-0">{unit.unit_code}</h4>
        <CloseOutlined className="cursor-pointer text-gray-400 hover:text-gray-600 text-xs" onClick={onClose} />
      </div>
      <div className="p-4">
        <Descriptions column={1} size="small" colon={false}>
          <Descriptions.Item label="铺位名称">{unit.unit_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="业态类别">{unit.category || '-'}</Descriptions.Item>
          <Descriptions.Item label="面积">{unit.area_gross_sqm ? `${unit.area_gross_sqm.toFixed(1)} ㎡` : '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getUnitColor(unit.status)}>{getUnitStatusLabel(unit.status)}</Tag>
          </Descriptions.Item>
          {unit.frontage_m && (
            <Descriptions.Item label="临街面宽">{unit.frontage_m}m</Descriptions.Item>
          )}
          {unit.floor_position && (
            <Descriptions.Item label="楼层位置">{unit.floor_position}</Descriptions.Item>
          )}
        </Descriptions>
      </div>
    </div>
  )
}
