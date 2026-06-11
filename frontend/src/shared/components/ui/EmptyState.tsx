import { Empty, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Empty
      description={
        <div>
          <div className="text-gray-500 font-medium mb-1">{title}</div>
          {description && <div className="text-gray-400 text-sm">{description}</div>}
        </div>
      }
    >
      {actionLabel && onAction && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Empty>
  )
}
