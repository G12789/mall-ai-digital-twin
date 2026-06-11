import { List, Button, Space, Typography, Popconfirm } from 'antd'
import { PlusOutlined, MessageOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ChatSession } from '../types'

interface SessionListProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSelect: (sessionId: string) => void
  onNew: () => void
  onDelete?: (sessionId: string) => void
}

export default function SessionList({
  sessions, activeSessionId, onSelect, onNew, onDelete,
}: SessionListProps) {
  return (
    <div className="w-60 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
      <div className="p-3 border-b border-gray-200">
        <Button type="primary" icon={<PlusOutlined />} block onClick={onNew} size="small">
          新对话
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400">
            <MessageOutlined className="text-lg mb-1 block" />
            暂无对话记录
          </div>
        ) : (
          <List
            size="small"
            dataSource={sessions}
            renderItem={(session) => (
              <div
                className={`px-3 py-2.5 cursor-pointer border-l-2 transition-colors ${
                  session.id === activeSessionId
                    ? 'border-l-blue-500 bg-blue-50'
                    : 'border-l-transparent hover:bg-gray-100'
                }`}
                onClick={() => onSelect(session.id)}
              >
                <div className="flex items-center justify-between">
                  <Typography.Text
                    className="text-sm font-medium truncate flex-1"
                    style={{ maxWidth: 160 }}
                  >
                    {session.title}
                  </Typography.Text>
                  {onDelete && (
                    <Popconfirm
                      title="删除此对话？"
                      onConfirm={(e) => { e?.stopPropagation(); onDelete(session.id) }}
                      onCancel={(e) => e?.stopPropagation()}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        className="text-gray-300 hover:text-red-400"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  )}
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-xs text-gray-400 truncate">
                    {session.messageCount} 条消息
                  </span>
                  <span className="text-xs text-gray-300">
                    {session.createdAt ? new Date(session.createdAt).toLocaleDateString('zh-CN') : ''}
                  </span>
                </div>
              </div>
            )}
          />
        )}
      </div>

      <div className="p-2 border-t border-gray-200 text-center">
        <Space size={4} className="text-xs text-gray-400">
          <span>AI Copilot</span>
          <span>v1.0</span>
        </Space>
      </div>
    </div>
  )
}
