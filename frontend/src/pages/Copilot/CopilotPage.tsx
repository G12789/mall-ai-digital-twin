import { useEffect, useState, useCallback } from 'react'
import { Result, Button, Spin } from 'antd'
import ChatWindow from '../../features/copilot/components/ChatWindow'
import SessionList from '../../features/copilot/components/SessionList'
import { useCopilotStore } from '../../features/copilot/store/copilotStore'
import { useChat } from '../../features/copilot/hooks/useChat'
import { copilotApi } from '../../features/copilot/services/copilotApi'
import { useCurrentMall } from '../../shared/hooks/useCurrentMall'

export default function CopilotPage() {
  const mallId = useCurrentMall((s) => s.mallId)
  const store = useCopilotStore()
  const { sendMessage, newSession } = useChat(mallId)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState(false)

  const loadSessions = useCallback(async () => {
    if (!mallId) return
    setSessionsLoading(true)
    setSessionsError(false)
    try {
      const data = await copilotApi.listSessions(mallId)
      store.setSessions(data)
    } catch {
      setSessionsError(true)
    } finally {
      setSessionsLoading(false)
    }
  }, [mallId, store])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  function handleSelectSession(sessionId: string) {
    store.setActiveSession(sessionId)
    copilotApi.getMessages(sessionId)
      .then((msgs) => store.setMessages(msgs))
      .catch(() => store.setError('加载消息历史失败'))
  }

  function handleNewSession() {
    newSession()
  }

  if (!mallId) {
    return <Result status="error" title="缺少商场ID" />
  }

  return (
    <div className="flex" style={{ height: 'calc(100vh - 120px)' }}>
      {sessionsLoading ? (
        <div className="w-60 border-r border-gray-200 bg-gray-50 flex items-center justify-center">
          <Spin size="small" />
        </div>
      ) : sessionsError ? (
        <div className="w-60 border-r border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-4">
          <p className="text-xs text-gray-400 mb-2 text-center">无法加载对话历史</p>
          <Button size="small" onClick={loadSessions}>重试</Button>
        </div>
      ) : (
        <SessionList
          sessions={store.sessions}
          activeSessionId={store.activeSessionId}
          onSelect={handleSelectSession}
          onNew={handleNewSession}
        />
      )}

      <ChatWindow
        sessions={store.sessions}
        onSend={sendMessage}
      />
    </div>
  )
}
