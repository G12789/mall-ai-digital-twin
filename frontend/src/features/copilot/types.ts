export interface SqlTemplate {
  name: string
  intent: string
  description: string
  examples: string[]
  sql: string
  paramExtractor: (params: Record<string, unknown>, context: { mallId: string }) => unknown[]
  resultType: 'table' | 'stats' | 'detail'
  requireConfirmation: boolean
}

export interface IntentResult {
  intent: string | null
  params: Record<string, unknown>
  confidence: number
  isDataQuery: boolean
  needsClarification: boolean
  clarificationQuestion: string | null
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  messageType: 'text' | 'sql_result' | 'source_ref' | 'confirmation' | 'error'
  metadata: ChatMessageMeta | null
  createdAt: string
}

export interface ChatMessageMeta {
  intent?: string
  sqlResult?: SqlResultData
  sources?: SourceRef[]
  confirmationId?: string
  confirmed?: boolean
}

export interface SqlResultData {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  templateName: string
}

export interface SourceRef {
  documentId: string
  title: string
  chunkIndex: number
  contentSnippet: string
  similarity: number
}

export interface ChatSession {
  id: string
  mallId: string
  title: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

export interface CopilotRequest {
  message: string
  sessionId: string
  mallId: string
}

export interface CopilotStreamEvent {
  type: 'text_delta' | 'sql_result' | 'source_ref' | 'confirmation_required' | 'error' | 'done'
  content?: string
  sqlResult?: SqlResultData
  sources?: SourceRef[]
  confirmationId?: string
  confirmationMessage?: string
  error?: string
}
