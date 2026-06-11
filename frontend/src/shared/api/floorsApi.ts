import { supabase } from './supabase'
import type { Floor } from '../types/database'

export const floorsApi = {
  async listByMall(mallId: string): Promise<Floor[]> {
    const { data, error } = await supabase
      .from('floors')
      .select('*')
      .eq('mall_id', mallId)
      .order('floor_index', { ascending: true })
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<Floor> {
    const { data, error } = await supabase
      .from('floors')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(floor: Partial<Floor>): Promise<Floor> {
    const { data, error } = await supabase
      .from('floors')
      .insert(floor)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, floor: Partial<Floor>): Promise<Floor> {
    const { data, error } = await supabase
      .from('floors')
      .update(floor)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('floors').delete().eq('id', id)
    if (error) throw error
  },
}
