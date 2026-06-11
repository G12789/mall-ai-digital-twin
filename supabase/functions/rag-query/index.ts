import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RAGRequest {
  query: string
  mallId: string
  limit?: number
  minSimilarity?: number
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
    const { query, mallId, limit = 5, minSimilarity = 0.3 }: RAGRequest = await req.json()

    if (!query || !mallId) {
      return new Response(JSON.stringify({ error: 'query and mallId required' }), { status: 400 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Text search fallback (works without embedding pipeline)
    const keywords = query.slice(0, 200).replace(/[%_]/g, '')
    const { data: chunks, error } = await supabase
      .from('doc_chunks')
      .select('id, document_id, content, chunk_index, documents!inner(id, title, file_url, category)')
      .eq('documents.mall_id', mallId)
      .ilike('content', `%${keywords}%`)
      .limit(limit)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    const results = (chunks || []).map((chunk: Record<string, unknown>) => ({
      documentId: chunk.document_id as string,
      title: (chunk.documents as Record<string, string>)?.title || '',
      chunkIndex: chunk.chunk_index as number,
      contentSnippet: ((chunk.content as string) || '').slice(0, 500),
      similarity: 0.7,
      fileUrl: (chunk.documents as Record<string, string>)?.file_url || '',
      category: (chunk.documents as Record<string, string>)?.category || '',
    }))

    return new Response(JSON.stringify({ results, count: results.length }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  }
})
