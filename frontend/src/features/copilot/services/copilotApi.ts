import type { CopilotRequest, CopilotStreamEvent, ChatSession, ChatMessage } from '../types'

const EDGE_FUNCTION_BASE = import.meta.env.VITE_SUPABASE_EDGE_URL || ''
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

function getAuthHeaders(): Record<string, string> {
  const token = Object.keys(localStorage)
    .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
    .map((k) => JSON.parse(localStorage[k] || '{}'))
    .find((s) => s?.access_token)?.access_token || ''
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

// Mock responses for DEV_MODE — simulates the full SSE streaming experience locally
const MOCK_RESPONSES: Record<string, {
  text: string
  hasSql?: boolean
  sqlTable?: { columns: string[]; rows: string[][] }
}> = {
  '空铺': {
    text: '根据当前数据库查询，星辰购物中心共有 **4 个空置铺位**：\n\n1. **F1-003** — 80㎡，零售/化妆品，临街面 6m，位于西南角\n2. **F2-002** — 90㎡，教育/K12，临街面 6m，位于东区\n3. **F2-K01** — 15㎡，零售/便利店，岛柜，位于电梯口\n4. **F1-003 旁** — 另有 1 个铺位处于「已预定」状态\n\n建议优先招商餐饮和体验业态，F1-003 位置较好适合引入美妆集合店。',
    hasSql: true,
    sqlTable: {
      columns: ['铺位编号', '面积(㎡)', '业态', '状态', '临街面'],
      rows: [
        ['F1-003', '80', '零售/化妆品', '空置', '6m'],
        ['F2-002', '90', '教育/K12', '空置', '6m'],
        ['F2-K01', '15', '零售/便利店', '空置', '3m'],
        ['F2-003', '110', '零售/数码电子', '已预定', '8m'],
      ],
    },
  },
  '租约': {
    text: '当前有 **5 份租约**，其中 1 份即将到期需要关注：\n\n⚠️ **LS-2024-001 万达影城** — 到期日 2026-05-31，剩余 14 天！\n月租金 ¥90,000，押金 ¥270,000（3个月），建议尽快联系赵总确认续租意向。\n\n其余 3 份合同在正常履约中，1 份已到期。',
    hasSql: true,
    sqlTable: {
      columns: ['合同编号', '商户', '到期日', '状态', '月租金'],
      rows: [
        ['LS-2025-001', '星巴克', '2027-12-31', '生效中', '¥36,000'],
        ['LS-2025-002', '优衣库', '2028-01-31', '生效中', '¥60,000'],
        ['LS-2025-003', '海底捞', '2028-02-28', '生效中', '扣点15%'],
        ['LS-2024-001', '万达影城', '2026-05-31', '即将到期', '¥90,000'],
        ['LS-2024-002', '学而思', '2025-03-01', '已到期', '¥18,000'],
      ],
    },
  },
  '出租率': {
    text: '当前星辰购物中心整体出租率 **84.5%**，较上月提升 1.2%。\n\n分楼层来看：\n- **F1 层**：87.5%（4 个铺位中 3.5 个已租）\n- **F2 层**：80.0%（4 个铺位中 3.2 个已租）\n\n按业态分布，**餐饮**业态出租率最高（100%），**教育**业态空置较多。建议加大教育类商户招商力度。',
  },
  '商户': {
    text: '当前共有 **6 家商户**入驻星辰购物中心：\n\n| 商户 | 品牌 | 业态 | 状态 |\n|------|------|------|------|\n| 星巴克 | Starbucks | 餐饮/咖啡 | 活跃 |\n| 优衣库 | UNIQLO | 零售/服装 | 活跃 |\n| 海底捞 | Haidilao | 餐饮/火锅 | 活跃 |\n| 万达影城 | Wanda Cinema | 娱乐/影院 | 活跃 |\n| 屈臣氏 | Watsons | 零售/化妆品 | 活跃 |\n| 学而思 | XES | 教育/K12 | 已停用 |\n\nS 级商户 1 家（海底捞），A 级 3 家，B 级 2 家。',
  },
}

function getMockResponse(message: string): typeof MOCK_RESPONSES[string] {
  const lower = message.toLowerCase()
  if (lower.includes('空铺') || lower.includes('空置') || lower.includes('vacant')) return MOCK_RESPONSES['空铺']
  if (lower.includes('租约') || lower.includes('合同') || lower.includes('到期') || lower.includes('lease')) return MOCK_RESPONSES['租约']
  if (lower.includes('出租率') || lower.includes('面积') || lower.includes('occupancy')) return MOCK_RESPONSES['出租率']
  return MOCK_RESPONSES['商户']
}

async function mockStreamEvents(
  message: string,
  onEvent: (event: CopilotStreamEvent) => void,
  onDone: () => void,
) {
  const resp = getMockResponse(message)

  // Simulate DB search phase
  onEvent({ type: 'status', status: 'searching', message: '正在搜索相关数据...' })
  await new Promise((r) => setTimeout(r, 400))

  if (resp.hasSql) {
    onEvent({ type: 'status', status: 'executing_sql', message: '正在查询数据库...' })
    await new Promise((r) => setTimeout(r, 300))
    onEvent({ type: 'sql_result', sqlResult: resp.sqlTable! })
    await new Promise((r) => setTimeout(r, 200))
  }

  // Stream text character by character (simplified: word by word)
  onEvent({ type: 'status', status: 'generating', message: '正在生成回答...' })
  const words = resp.text.split('')
  let accumulated = ''
  for (let i = 0; i < words.length; i += 3) {
    const chunk = words.slice(i, i + 3).join('')
    accumulated += chunk
    onEvent({ type: 'text_delta', content: accumulated })
    await new Promise((r) => setTimeout(r, 15))
  }

  onEvent({ type: 'done' })
  onDone()
}

// Mock sessions store
const mockSessions: ChatSession[] = [
  { id: 'mock-session-1', mallId: 'dev-mall-001', title: '查询空铺情况', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]
const mockMessages: Record<string, ChatMessage[]> = {
  'mock-session-1': [
    { id: 'mock-msg-1', sessionId: 'mock-session-1', role: 'user', content: '有哪些空铺？', messageType: 'text', metadata: null, createdAt: new Date(Date.now() - 60000).toISOString() },
    { id: 'mock-msg-2', sessionId: 'mock-session-1', role: 'assistant', content: '根据当前数据库查询，星辰购物中心共有 4 个空置铺位...', messageType: 'text', metadata: null, createdAt: new Date(Date.now() - 55000).toISOString() },
  ],
}

export const copilotApi = {
  async sendMessage(
    request: CopilotRequest,
    onEvent: (event: CopilotStreamEvent) => void,
    onError: (error: string) => void,
    onDone: () => void,
  ): Promise<void> {
    // Use mock in DEV_MODE or when edge function URL is not configured
    if (DEV_MODE || !EDGE_FUNCTION_BASE) {
      return mockStreamEvents(request.message, onEvent, onDone)
    }

    const url = `${EDGE_FUNCTION_BASE}/copilot-chat`
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const body = await response.text()
        onError(`请求失败 (${response.status}): ${body}`)
        onDone()
        return
      }

      const reader = response.body?.getReader()
      if (!reader) { onError('无法读取响应流'); onDone(); return }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const jsonStr = trimmed.slice(6)
          try {
            const event = JSON.parse(jsonStr) as CopilotStreamEvent
            onEvent(event)
            if (event.type === 'done' || event.type === 'error') {
              onDone()
              return
            }
          } catch { /* skip */ }
        }
      }
      onDone()
    } catch (err) {
      onError(err instanceof Error ? err.message : '网络请求失败')
      onDone()
    }
  },

  async createSession(mallId: string, title: string): Promise<ChatSession> {
    if (DEV_MODE || !EDGE_FUNCTION_BASE) {
      const s: ChatSession = { id: `mock-session-${Date.now()}`, mallId, title, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      mockSessions.push(s)
      return s
    }
    const response = await fetch(`${EDGE_FUNCTION_BASE}/copilot-chat/sessions`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ mallId, title }),
    })
    if (!response.ok) throw new Error('Failed to create session')
    return response.json()
  },

  async listSessions(mallId: string): Promise<ChatSession[]> {
    if (DEV_MODE || !EDGE_FUNCTION_BASE) return mockSessions.filter((s) => s.mallId === mallId)
    const response = await fetch(
      `${EDGE_FUNCTION_BASE}/copilot-chat/sessions?mallId=${encodeURIComponent(mallId)}`,
      { headers: getAuthHeaders() },
    )
    if (!response.ok) throw new Error('Failed to list sessions')
    return response.json()
  },

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    if (DEV_MODE || !EDGE_FUNCTION_BASE) return mockMessages[sessionId] || []
    const response = await fetch(
      `${EDGE_FUNCTION_BASE}/copilot-chat/sessions/${sessionId}/messages`,
      { headers: getAuthHeaders() },
    )
    if (!response.ok) throw new Error('Failed to get messages')
    return response.json()
  },

  confirmAction(): Promise<void> {
    return Promise.resolve()
  },
}
