import { useCallback, useRef } from 'react'
import { useCopilotStore } from '../store/copilotStore'
import { copilotApi } from '../services/copilotApi'
import type { ChatMessage, CopilotStreamEvent } from '../types'

function genId(): string {
  return crypto.randomUUID()
}

export function useChat(mallId: string | null) {
  const store = useCopilotStore()
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!mallId || !content.trim()) return
    if (store.isLoading || store.isStreaming) return

    let sessionId = store.activeSessionId
    if (!sessionId) {
      sessionId = store.newSession()
    }

    store.setError(null)
    store.setLoading(true)
    store.setStreaming(true)

    const userMsg: ChatMessage = {
      id: genId(),
      sessionId,
      role: 'user',
      content: content.trim(),
      messageType: 'text',
      metadata: null,
      createdAt: new Date().toISOString(),
    }
    store.addMessage(userMsg)

    const assistantId = genId()
    const assistantMsg: ChatMessage = {
      id: assistantId,
      sessionId,
      role: 'assistant',
      content: '',
      messageType: 'text',
      metadata: null,
      createdAt: new Date().toISOString(),
    }
    store.addMessage(assistantMsg)

    let assistantContent = ''

    const onEvent = (event: CopilotStreamEvent) => {
      switch (event.type) {
        case 'text_delta':
          assistantContent += event.content || ''
          store.updateMessage(assistantId, { content: assistantContent })
          break

        case 'sql_result':
          store.updateMessage(assistantId, {
            metadata: {
              ...store.messages.find((m) => m.id === assistantId)?.metadata,
              sqlResult: event.sqlResult,
            } as never,
          })
          break

        case 'source_ref':
          store.updateMessage(assistantId, {
            metadata: {
              ...store.messages.find((m) => m.id === assistantId)?.metadata,
              sources: event.sources,
            } as never,
          })
          break

        case 'confirmation_required':
          store.setPendingConfirmation({
            id: event.confirmationId || genId(),
            message: event.confirmationMessage || '确认执行此操作？',
          })
          break

        case 'error':
          store.setError(event.error || '发生未知错误')
          store.updateMessage(assistantId, { messageType: 'error', content: event.error || '' })
          break

        case 'done':
          break
      }
    }

    const onError = (error: string) => {
      store.setError(error)
      store.updateMessage(assistantId, { messageType: 'error', content: error })
    }

    const onDone = () => {
      store.setLoading(false)
      store.setStreaming(false)
      if (!assistantContent && !store.error) {
        store.updateMessage(assistantId, { content: '抱歉，我暂时无法回答这个问题。请尝试换个问法。' })
      }
    }

    try {
      await copilotApi.sendMessage(
        { message: content.trim(), sessionId, mallId },
        onEvent,
        onError,
        onDone,
      )
    } catch (err) {
      store.setError(err instanceof Error ? err.message : '请求失败')
      store.setLoading(false)
      store.setStreaming(false)
    }
  }, [mallId, store])

  const newSession = useCallback(() => {
    store.newSession()
  }, [store])

  return {
    sendMessage,
    newSession,
  }
}
