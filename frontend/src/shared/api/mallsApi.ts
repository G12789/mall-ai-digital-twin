import { supabase } from './supabase'
import type { Mall } from '../types/database'

export const mallsApi = {
  async list(): Promise<Mall[]> {
    const { data, error } = await supabase
      .from('malls')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<Mall> {
    const { data, error } = await supabase
      .from('malls')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(mall: Partial<Mall>): Promise<Mall> {
    const { data, error } = await supabase
      .from('malls')
      .insert(mall)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, mall: Partial<Mall>): Promise<Mall> {
    const { data, error } = await supabase
      .from('malls')
      .update(mall)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('malls').delete().eq('id', id)
    if (error) throw error
  },
}
