import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SQLExecuteRequest {
  sql: string
  params: unknown[]
  mallId: string
}

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
    const { sql, params, mallId }: SQLExecuteRequest = await req.json()

    if (!sql || !mallId) {
      return new Response(JSON.stringify({ error: 'sql and mallId required' }), { status: 400 })
    }

    // Safety: only allow SELECT statements
    const trimmed = sql.trim().toUpperCase()
    if (!trimmed.startsWith('SELECT')) {
      return new Response(JSON.stringify({ error: 'Only SELECT queries are allowed' }), { status: 403 })
    }

    // Block dangerous keywords
    const blocked = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE']
    for (const keyword of blocked) {
      if (trimmed.includes(keyword)) {
        return new Response(JSON.stringify({ error: `SQL keyword ${keyword} is not allowed` }), { status: 403 })
      }
    }

    // Always enforce mall_id as first parameter
    const safeParams = [mallId, ...(params || [])]

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase.rpc('execute_param_query', {
      query_text: sql,
      query_params: safeParams,
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    const rows = (data as Record<string, unknown>[]) || []
    return new Response(JSON.stringify({
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      rows,
      rowCount: rows.length,
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  }
})
