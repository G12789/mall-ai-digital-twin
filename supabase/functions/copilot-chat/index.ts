import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  message: string
  sessionId: string
  mallId: string
}

interface CopilotStreamEvent {
  type: 'text_delta' | 'sql_result' | 'source_ref' | 'confirmation_required' | 'error' | 'done'
  content?: string
  sqlResult?: { columns: string[]; rows: Record<string, unknown>[]; rowCount: number; templateName: string }
  sources?: { documentId: string; title: string; chunkIndex: number; contentSnippet: string; similarity: number }[]
  confirmationId?: string
  confirmationMessage?: string
  error?: string
}

// ── SQL Templates (mirrored from frontend for safety) ──────────────────────
const SQL_TEMPLATES: Record<string, { sql: string; paramExtractor: (p: Record<string, unknown>, mallId: string) => unknown[] }> = {
  VACANT_UNITS: {
    sql: `SELECT unit_code, unit_name, category, area_gross_sqm, frontage_m, floor_position, status FROM units WHERE mall_id = $1 AND status = 'vacant' ORDER BY unit_code`,
    paramExtractor: (_p, mallId) => [mallId],
  },
  UNITS_BY_CATEGORY: {
    sql: `SELECT unit_code, unit_name, category, sub_category, area_gross_sqm, status, floor_position FROM units WHERE mall_id = $1 AND category = $2 ORDER BY unit_code`,
    paramExtractor: (p, mallId) => [mallId, p.category],
  },
  UNITS_BY_STATUS: {
    sql: `SELECT unit_code, unit_name, category, area_gross_sqm, frontage_m, floor_position, status FROM units WHERE mall_id = $1 AND status = $2 ORDER BY unit_code`,
    paramExtractor: (p, mallId) => [mallId, p.status],
  },
  UNIT_DETAIL: {
    sql: `SELECT u.*, f.floor_label, l.id as lease_id, l.start_date, l.end_date, l.monthly_rent, l.status as lease_status, t.name as tenant_name, t.brand as tenant_brand, t.contact_phone FROM units u LEFT JOIN floors f ON u.floor_id = f.id LEFT JOIN leases l ON u.id = l.unit_id AND l.status != 'terminated' LEFT JOIN mall_tenants t ON l.tenant_id = t.id WHERE u.mall_id = $1 AND u.unit_code ILIKE $2`,
    paramExtractor: (p, mallId) => [mallId, `%${p.unitCode || ''}%`],
  },
  TENANT_LEASE: {
    sql: `SELECT l.*, u.unit_code, u.area_gross_sqm, t.name as tenant_name, t.brand as tenant_brand FROM leases l JOIN units u ON l.unit_id = u.id JOIN mall_tenants t ON l.tenant_id = t.id WHERE l.mall_id = $1 AND (t.name ILIKE $2 OR t.brand ILIKE $2) ORDER BY l.start_date DESC`,
    paramExtractor: (p, mallId) => [mallId, `%${p.tenantName || ''}%`],
  },
  FLOOR_UNITS: {
    sql: `SELECT u.unit_code, u.unit_name, u.category, u.area_gross_sqm, u.status, u.unit_type FROM units u JOIN floors f ON u.floor_id = f.id WHERE u.mall_id = $1 AND f.floor_label = $2 ORDER BY u.unit_code`,
    paramExtractor: (p, mallId) => [mallId, p.floorLabel],
  },
  MALL_STATS: {
    sql: `SELECT COUNT(*)::int as total_units, COUNT(*) FILTER (WHERE status = 'occupied')::int as occupied_units, COUNT(*) FILTER (WHERE status = 'vacant')::int as vacant_units, COUNT(*) FILTER (WHERE status = 'reserved')::int as reserved_units, COUNT(*) FILTER (WHERE status = 'renovation')::int as renovation_units, COALESCE(SUM(area_gross_sqm), 0) as total_area_sqm, COALESCE(SUM(area_gross_sqm) FILTER (WHERE status = 'occupied'), 0) as occupied_area_sqm, ROUND(COALESCE(SUM(area_gross_sqm) FILTER (WHERE status = 'occupied'), 0) * 100.0 / NULLIF(SUM(area_gross_sqm), 0), 1) as occupancy_rate_pct FROM units WHERE mall_id = $1`,
    paramExtractor: (_p, mallId) => [mallId],
  },
  EXPIRING_LEASES: {
    sql: `SELECT l.contract_number, l.start_date, l.end_date, l.monthly_rent, l.status, u.unit_code, u.area_gross_sqm, t.name as tenant_name, t.contact_phone, (l.end_date - CURRENT_DATE) as days_remaining FROM leases l JOIN units u ON l.unit_id = u.id JOIN mall_tenants t ON l.tenant_id = t.id WHERE l.mall_id = $1 AND l.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($2 || ' days')::INTERVAL AND l.status IN ('active', 'expiring_soon') ORDER BY l.end_date`,
    paramExtractor: (p, mallId) => [mallId, String(p.days || 90)],
  },
  RENT_INCOME: {
    sql: `SELECT l.rent_model, COUNT(*)::int as lease_count, COALESCE(SUM(l.monthly_rent), 0) as total_monthly_rent, ROUND(COALESCE(AVG(l.rent_per_sqm), 0), 2) as avg_rent_per_sqm, COALESCE(SUM(l.deposit_amount), 0) as total_deposits FROM leases l WHERE l.mall_id = $1 AND l.status = 'active' GROUP BY l.rent_model`,
    paramExtractor: (_p, mallId) => [mallId],
  },
  TENANTS_BY_CATEGORY: {
    sql: `SELECT t.name, t.brand, t.category, t.sub_category, t.tier, t.status, t.contact_name, t.contact_phone, COUNT(l.id) FILTER (WHERE l.status = 'active')::int as active_leases FROM mall_tenants t LEFT JOIN leases l ON t.id = l.tenant_id AND l.status = 'active' WHERE t.mall_id = $1 AND t.category = $2 GROUP BY t.id ORDER BY t.name`,
    paramExtractor: (p, mallId) => [mallId, p.category],
  },
  PENDING_WORK_ORDERS: {
    sql: `SELECT wo.id, wo.title, wo.priority, wo.status, wo.created_at, wo.unit_id, u.unit_code, u.floor_position FROM work_orders wo LEFT JOIN units u ON wo.unit_id = u.id WHERE wo.mall_id = $1 AND wo.status IN ('pending', 'in_progress') ORDER BY CASE wo.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, wo.created_at DESC`,
    paramExtractor: (_p, mallId) => [mallId],
  },
  CATEGORY_DISTRIBUTION: {
    sql: `SELECT category, COUNT(*)::int as unit_count, COALESCE(SUM(area_gross_sqm), 0) as total_area_sqm, COUNT(*) FILTER (WHERE status = 'vacant')::int as vacant_count, COUNT(*) FILTER (WHERE status = 'occupied')::int as occupied_count FROM units WHERE mall_id = $1 GROUP BY category ORDER BY unit_count DESC`,
    paramExtractor: (_p, mallId) => [mallId],
  },
  UNIT_COUNT_BY_FLOOR: {
    sql: `SELECT f.floor_label, f.floor_index, COUNT(u.id)::int as unit_count, COUNT(u.id) FILTER (WHERE u.status = 'occupied')::int as occupied_count, COUNT(u.id) FILTER (WHERE u.status = 'vacant')::int as vacant_count, COALESCE(SUM(u.area_gross_sqm), 0) as total_area_sqm FROM floors f LEFT JOIN units u ON f.id = u.floor_id WHERE f.mall_id = $1 GROUP BY f.id, f.floor_label, f.floor_index ORDER BY f.floor_index`,
    paramExtractor: (_p, mallId) => [mallId],
  },
  LARGE_VACANT: {
    sql: `SELECT unit_code, unit_name, category, area_gross_sqm, frontage_m, floor_position, status FROM units WHERE mall_id = $1 AND status = 'vacant' AND area_gross_sqm >= $2 ORDER BY area_gross_sqm DESC`,
    paramExtractor: (p, mallId) => [mallId, p.minArea || 100],
  },
  LEASES_BY_STATUS: {
    sql: `SELECT l.contract_number, l.start_date, l.end_date, l.monthly_rent, l.rent_model, l.status, u.unit_code, t.name as tenant_name, t.contact_phone FROM leases l JOIN units u ON l.unit_id = u.id JOIN mall_tenants t ON l.tenant_id = t.id WHERE l.mall_id = $1 AND l.status = $2 ORDER BY l.end_date`,
    paramExtractor: (p, mallId) => [mallId, p.leaseStatus],
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sendEvent(writer: WritableStreamDefaultWriter<Uint8Array>, event: CopilotStreamEvent): void {
  const encoder = new TextEncoder()
  writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
}

async function callLLM(
  messages: { role: string; content: string }[],
  stream: boolean,
  options?: { temperature?: number },
): Promise<string | ReadableStreamDefaultReader<Uint8Array>> {
  const apiKey = Deno.env.get('DEEPSEEK_API_KEY') || ''
  const endpoint = 'https://api.deepseek.com/v1/chat/completions'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: stream ? 2048 : 1024,
      stream,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DeepSeek API error ${response.status}: ${err}`)
  }

  if (stream) return response.body!.getReader()
  const data = await response.json()
  return data.choices[0].message.content
}

async function classifyIntent(userMessage: string): Promise<{
  intent: string | null
  params: Record<string, unknown>
  confidence: number
  isDataQuery: boolean
  needsClarification: boolean
}> {
  const prompt = `你是一个商场管理AI助手的意图分类器。根据用户输入，判断意图并提取参数。

可用意图列表：
- VACANT_UNITS: 空置铺位查询
- UNITS_BY_CATEGORY: 按业态查铺位 (需提取 category 参数: 餐饮/零售/服务/娱乐/教育/办公/其他)
- UNITS_BY_STATUS: 按状态查铺位 (需提取 status 参数: vacant/occupied/reserved/off-market/renovation)
- UNIT_DETAIL: 铺位详情查询 (需提取 unitCode 参数)
- TENANT_LEASE: 商户租约查询 (需提取 tenantName 参数)
- FLOOR_UNITS: 楼层铺位列表 (需提取 floorLabel 参数: B1/F1/F2等)
- MALL_STATS: 商场整体统计
- EXPIRING_LEASES: 即将到期租约 (可提取 days 参数, 默认90)
- RENT_INCOME: 租金收入汇总
- TENANTS_BY_CATEGORY: 按业态查商户 (需提取 category 参数)
- PENDING_WORK_ORDERS: 待处理工单
- CATEGORY_DISTRIBUTION: 业态分布统计
- UNIT_COUNT_BY_FLOOR: 各楼层铺位统计
- LARGE_VACANT: 大面积空置铺位 (可提取 minArea 参数, 默认100平)
- LEASES_BY_STATUS: 按状态查租约 (需提取 leaseStatus 参数: active/expired/expiring_soon/draft/terminated)
- DOCUMENT_SEARCH: 文档/知识库/制度/流程相关问题
- GENERAL: 闲聊或无法分类的通用问题

用户输入: "${userMessage}"

请只返回JSON (不要markdown代码块):
{
  "intent": "意图名称或null",
  "params": {"参数名": "参数值"},
  "confidence": 0.0到1.0之间的置信度,
  "isDataQuery": true或false,
  "needsClarification": true或false
}`

  const result = await callLLM([{ role: 'user', content: prompt }], false, { temperature: 0.1 })
  try {
    const content = typeof result === 'string' ? result : ''
    // Strip markdown code block if present
    const jsonStr = content.replace(/```json\s?/g, '').replace(/```\s?/g, '').trim()
    return JSON.parse(jsonStr)
  } catch {
    return { intent: 'GENERAL', params: {}, confidence: 0.5, isDataQuery: false, needsClarification: false }
  }
}

async function searchDocuments(supabase: ReturnType<typeof createClient>, mallId: string, query: string) {
  // Text search as primary (no embedding server needed at query time)
  const keywords = query.slice(0, 200)
  const { data, error } = await supabase
    .from('doc_chunks')
    .select('id, document_id, content, documents!inner(title)')
    .eq('documents.mall_id', mallId)
    .or(`content.ilike.%${keywords}%`)
    .limit(3)

  if (error || !data) return []

  return data.slice(0, 3).map((row: Record<string, unknown>, i: number) => ({
    documentId: (row.document_id as string) || '',
    title: (row.documents as Record<string, string>)?.title || '未知文档',
    chunkIndex: i,
    contentSnippet: ((row.content as string) || '').slice(0, 300),
    similarity: 0.7 - i * 0.1,
  }))
}

async function executeSqlQuery(supabase: ReturnType<typeof createClient>, intent: string, params: Record<string, unknown>, mallId: string) {
  const template = SQL_TEMPLATES[intent]
  if (!template) return null

  const sqlParams = template.paramExtractor(params, mallId)
  const { data, error } = await supabase.rpc('execute_query', {
    query_text: template.sql,
    query_params: sqlParams,
  })

  if (error) throw new Error(`SQL执行失败: ${error.message}`)
  const rows = (data as Record<string, unknown>[]) || []
  const columns = rows.length > 0 ? Object.keys(rows[0]) : []

  return {
    columns,
    rows,
    rowCount: rows.length,
    templateName: intent,
  }
}

// ── Main handler ────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const body: RequestBody = await req.json()
    const { message, sessionId, mallId } = body

    if (!message || !mallId) {
      return new Response(JSON.stringify({ error: 'message and mallId required' }), { status: 400 })
    }

    // Auth & Supabase client
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verify user & tenant
    let tenantId: string
    if (token) {
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      }
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
      tenantId = profile?.tenant_id || user.id
    } else {
      return new Response(JSON.stringify({ error: 'Authorization required' }), { status: 401 })
    }

    // Verify mall belongs to tenant
    const { data: mall } = await supabase.from('malls').select('id').eq('id', mallId).eq('tenant_id', tenantId).single()
    if (!mall) {
      return new Response(JSON.stringify({ error: 'Mall not found or access denied' }), { status: 403 })
    }

    // ── Stream response ──
    const stream = new ReadableStream({
      async start(controller) {
        const writer = controller.getWriter()
        const emit = (e: CopilotStreamEvent) => sendEvent(writer, e)

        try {
          // Step 1: Intent classification
          const classification = await classifyIntent(message)

          // Step 2: SQL execution (if data query)
          let sqlResult = null
          if (classification.isDataQuery && classification.intent && SQL_TEMPLATES[classification.intent]) {
            sqlResult = await executeSqlQuery(supabase, classification.intent, classification.params, mallId)
            if (sqlResult) emit({ type: 'sql_result', sqlResult })
          }

          // Step 3: Document search (always attempt for context)
          let sources = await searchDocuments(supabase, mallId, message)
          if (sources.length > 0) emit({ type: 'source_ref', sources })

          // Step 4: Synthesize final answer
          const contextParts: string[] = []
          if (sqlResult && sqlResult.rowCount > 0) {
            contextParts.push(`SQL查询结果 (${classification.intent}): ${JSON.stringify(sqlResult.rows.slice(0, 50))}`)
          } else if (sqlResult && sqlResult.rowCount === 0) {
            contextParts.push('SQL查询结果为空')
          }
          if (sources.length > 0) {
            contextParts.push(`相关文档: ${JSON.stringify(sources.map(s => s.contentSnippet))}`)
          }

          const systemPrompt = `你是商场AI管理助手，帮助商场运营人员高效管理商场。
${contextParts.length > 0 ? '参考信息:\n' + contextParts.join('\n\n') : ''}
请基于参考信息用中文回答用户问题。简洁专业，适当使用数据。如果参考信息为空，说明你是基于常识回答。
可以使用列表、数字等格式让回答更清晰。`

          const llmStream = await callLLM([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ], true, { temperature: 0.5 }) as ReadableStreamDefaultReader<Uint8Array>

          // Stream LLM response as text_delta events
          const decoder = new TextDecoder()
          let buffer = ''
          while (true) {
            const { done, value } = await llmStream.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith('data: ')) continue
              const jsonStr = trimmed.slice(6)
              if (jsonStr === '[DONE]') continue
              try {
                const parsed = JSON.parse(jsonStr)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) emit({ type: 'text_delta', content })
              } catch { /* skip incomplete JSON */ }
            }
          }

          // Save session (optional, if session table exists)
          try {
            await supabase.from('chat_messages').insert([
              { session_id: sessionId, role: 'user', content: message },
              { session_id: sessionId, role: 'assistant', content: '[streamed]', metadata: { intent: classification.intent } },
            ])
          } catch { /* session logging is best-effort */ }

          emit({ type: 'done' })
        } catch (err) {
          emit({ type: 'error', error: err instanceof Error ? err.message : 'Unknown error' })
          emit({ type: 'done' })
        } finally {
          writer.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  }
})
