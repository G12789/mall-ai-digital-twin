import { useEffect, useRef } from 'react'
import { Alert, Button, Spin } from 'antd'
import { useCopilotStore } from '../store/copilotStore'
import { copilotApi } from '../services/copilotApi'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import type { ChatSession } from '../types'

interface ChatWindowProps {
  sessions: ChatSession[]
  onSend: (message: string) => void
}

export default function ChatWindow({ sessions, onSend }: ChatWindowProps) {
  const { messages, isLoading, isStreaming, error, pendingConfirmation, activeSessionId } =
    useCopilotStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const hasSession = !!activeSessionId

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {!hasSession ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">商场AI助手</h3>
            <p className="text-sm mb-1">我可以帮你查询铺位、租约、商户信息</p>
            <p className="text-sm">还能回答商场管理制度相关的问题</p>
            <div className="mt-4 text-xs text-gray-300">
              支持查询：空铺 · 租约到期 · 业态分布 · 租金统计 · 商户信息 · 工单状态
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-sm">开始提问吧</p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}

        {isStreaming && (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
            <Spin size="small" />
            <span>AI正在思考...</span>
          </div>
        )}

        {error && (
          <Alert
            type="error"
            message={error}
            closable
            onClose={() => useCopilotStore.getState().setError(null)}
            className="mb-4"
          />
        )}

        {pendingConfirmation && (
          <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-orange-800 mb-2">
              ⚠️ {pendingConfirmation.message}
            </p>
            <div className="flex gap-2">
              <Button size="small" type="primary" danger
                onClick={() => {
                  copilotApi.confirmAction(pendingConfirmation!.id, true)
                  useCopilotStore.getState().setPendingConfirmation(null)
                }}>
                确认执行
              </Button>
              <Button size="small"
                onClick={() => {
                  copilotApi.confirmAction(pendingConfirmation!.id, false)
                  useCopilotStore.getState().setPendingConfirmation(null)
                }}>
                取消
              </Button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={onSend}
        disabled={isLoading || isStreaming}
        placeholder={hasSession ? '输入问题，如：哪些铺位是空置的？' : '点击左侧「新对话」开始'}
      />
    </div>
  )
}
