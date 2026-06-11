import { supabase } from './supabase'
import type { Lease } from '../types/database'

export const leasesApi = {
  async listByMall(mallId: string): Promise<Lease[]> {
    const { data, error } = await supabase
      .from('leases')
      .select('*')
      .eq('mall_id', mallId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<Lease> {
    const { data, error } = await supabase
      .from('leases')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(lease: Partial<Lease>): Promise<Lease> {
    const { data, error } = await supabase
      .from('leases')
      .insert(lease)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, lease: Partial<Lease>): Promise<Lease> {
    const { data, error } = await supabase
      .from('leases')
      .update(lease)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('leases').delete().eq('id', id)
    if (error) throw error
  },
}
