import { supabase } from '../../../shared/api/supabase'

export interface KnowledgeDocument {
  id: string
  tenant_id: string
  mall_id: string
  title: string
  file_url: string | null
  category: string
  access_level: string
  created_at: string
  updated_at: string
}

export const knowledgeApi = {
  async list(mallId: string): Promise<KnowledgeDocument[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('mall_id', mallId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async upload(mallId: string, file: File, category: string): Promise<KnowledgeDocument> {
    const fileExt = file.name.split('.').pop()
    const filePath = `${mallId}/${Date.now()}-${file.name}`

    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadErr) throw uploadErr

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    const { data, error } = await supabase
      .from('documents')
      .insert({
        mall_id: mallId,
        title: file.name,
        file_url: urlData.publicUrl,
        category,
        access_level: 'tenant',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('documents').delete().eq('id', id)
    if (error) throw error
  },
}
