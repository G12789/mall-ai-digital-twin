import { Typography } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import type { ChatMessage } from '../types'
import SqlResultCard from './SqlResultCard'
import SourceReference from './SourceReference'

interface MessageBubbleProps {
  message: ChatMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isError = message.messageType === 'error'
  const isConfirmation = message.messageType === 'confirmation'

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
        isUser ? 'bg-blue-500' : isError ? 'bg-red-400' : 'bg-violet-500'
      }`}>
        {isUser ? <UserOutlined /> : <RobotOutlined />}
      </div>

      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {isConfirmation ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
            <Typography.Text>{message.content}</Typography.Text>
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <Typography.Text type="danger">{message.content}</Typography.Text>
          </div>
        ) : (
          <div className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            <Typography.Paragraph
              className={`!mb-0 text-sm whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800'}`}
            >
              {message.content}
            </Typography.Paragraph>

            {message.metadata?.sqlResult && (
              <SqlResultCard data={message.metadata.sqlResult} />
            )}

            {message.metadata?.sources && message.metadata.sources.length > 0 && (
              <SourceReference sources={message.metadata.sources} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
