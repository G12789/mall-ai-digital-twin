import { create } from 'zustand'
import type { ChatMessage, ChatSession } from '../types'

interface CopilotState {
  messages: ChatMessage[]
  sessions: ChatSession[]
  activeSessionId: string | null
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  pendingConfirmation: { id: string; message: string } | null

  setSessions: (sessions: ChatSession[]) => void
  setActiveSession: (sessionId: string | null) => void
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, partial: Partial<ChatMessage>) => void
  removeMessage: (id: string) => void
  setLoading: (loading: boolean) => void
  setStreaming: (streaming: boolean) => void
  setError: (error: string | null) => void
  setPendingConfirmation: (conf: { id: string; message: string } | null) => void
  newSession: () => string
  clearMessages: () => void
}

function genId(): string {
  return crypto.randomUUID()
}

export const useCopilotStore = create<CopilotState>((set, get) => ({
  messages: [],
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  isStreaming: false,
  error: null,
  pendingConfirmation: null,

  setSessions: (sessions) => set({ sessions }),

  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  updateMessage: (id, partial) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...partial } : m)),
    })),

  removeMessage: (id) =>
    set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

  setLoading: (loading) => set({ isLoading: loading }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setError: (error) => set({ error }),

  setPendingConfirmation: (conf) => set({ pendingConfirmation: conf }),

  newSession: () => {
    const id = genId()
    set({ activeSessionId: id, messages: [], error: null, pendingConfirmation: null })
    return id
  },

  clearMessages: () => set({ messages: [], error: null }),
}))
