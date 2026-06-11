// Database table types matching Supabase schema

export interface Tenant {
  id: string
  name: string
  slug: string
  plan_type: 'free' | 'starter' | 'professional' | 'enterprise'
  plan_expires_at: string | null
  is_active: boolean
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Mall {
  id: string
  tenant_id: string
  name: string
  name_en: string | null
  address: string
  city: string | null
  district: string | null
  total_area_sqm: number | null
  leasable_area_sqm: number | null
  logo_url: string | null
  cover_image_url: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  status: string
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Floor {
  id: string
  mall_id: string
  floor_index: number
  floor_label: string
  floor_name: string | null
  plan_image_url: string | null
  extrude_height_m: number
  ceiling_height_m: number
  glb_asset_url: string | null
  glb_lowres_url: string | null
  geojson_boundary: GeoJSON.Polygon | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface MallUnit {
  id: string
  floor_id: string
  mall_id: string
  unit_code: string
  unit_name: string | null
  area_gross_sqm: number | null
  area_net_sqm: number | null
  area_leased_sqm: number | null
  polygon_geojson: GeoJSON.Polygon | null
  centroid_geojson: GeoJSON.Point | null
  category: string | null
  sub_category: string | null
  unit_type: string
  frontage_m: number | null
  floor_position: string | null
  status: string
  features: string[]
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MallTenant {
  id: string
  mall_id: string
  name: string
  name_en: string | null
  brand: string | null
  category: string
  sub_category: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  contact_wechat: string | null
  business_license: string | null
  legal_representative: string | null
  registered_capital: string | null
  tier: string
  status: string
  logo_url: string | null
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Lease {
  id: string
  mall_id: string
  unit_id: string
  tenant_id: string
  contract_number: string | null
  start_date: string
  end_date: string
  rent_free_start: string | null
  rent_free_end: string | null
  rent_model: string
  monthly_rent: number | null
  rent_per_sqm: number | null
  turnover_rent_pct: number | null
  mgmt_fee_per_sqm: number | null
  promotion_fee_per_sqm: number | null
  deposit_amount: number | null
  deposit_months: number
  payment_cycle: string
  renewal_option: boolean
  early_termination: string | null
  special_terms: string | null
  contract_file_url: string | null
  status: string
  signed_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  tenant_id: string
  full_name: string | null
  role: 'admin' | 'manager' | 'editor' | 'viewer' | 'merchant'
  avatar_url: string | null
  phone: string | null
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}
