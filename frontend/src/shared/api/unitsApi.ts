import { supabase } from './supabase'
import type { MallUnit } from '../types/database'

export const unitsApi = {
  async listByMall(mallId: string): Promise<MallUnit[]> {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('mall_id', mallId)
      .order('unit_code', { ascending: true })
    if (error) throw error
    return data
  },

  async listByFloor(floorId: string): Promise<MallUnit[]> {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('floor_id', floorId)
      .order('unit_code', { ascending: true })
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<MallUnit> {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(unit: Partial<MallUnit>): Promise<MallUnit> {
    const { data, error } = await supabase
      .from('units')
      .insert(unit)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, unit: Partial<MallUnit>): Promise<MallUnit> {
    const { data, error } = await supabase
      .from('units')
      .update(unit)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('units').delete().eq('id', id)
    if (error) throw error
  },
}
