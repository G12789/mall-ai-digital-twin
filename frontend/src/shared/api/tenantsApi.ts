import { supabase } from './supabase'
import type { MallTenant } from '../types/database'

export const mallTenantsApi = {
  async listByMall(mallId: string): Promise<MallTenant[]> {
    const { data, error } = await supabase
      .from('mall_tenants')
      .select('*')
      .eq('mall_id', mallId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<MallTenant> {
    const { data, error } = await supabase
      .from('mall_tenants')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(tenant: Partial<MallTenant>): Promise<MallTenant> {
    const { data, error } = await supabase
      .from('mall_tenants')
      .insert(tenant)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, tenant: Partial<MallTenant>): Promise<MallTenant> {
    const { data, error } = await supabase
      .from('mall_tenants')
      .update(tenant)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('mall_tenants').delete().eq('id', id)
    if (error) throw error
  },
}
