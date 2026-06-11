import type { SqlTemplate } from '../types'

export const SQL_TEMPLATES: Record<string, SqlTemplate> = {
  VACANT_UNITS: {
    name: 'VACANT_UNITS',
    intent: 'VACANT_UNITS',
    description: '查询空置铺位',
    examples: ['哪些铺位是空的', '空铺有哪些', '查一下空置的铺位', '还有哪些铺位没租出去'],
    sql: `SELECT unit_code, unit_name, category, area_gross_sqm, frontage_m, floor_position, status
          FROM units WHERE mall_id = $1 AND status = 'vacant' ORDER BY unit_code`,
    paramExtractor: (_params, ctx) => [ctx.mallId],
    resultType: 'table',
    requireConfirmation: false,
  },

  UNITS_BY_CATEGORY: {
    name: 'UNITS_BY_CATEGORY',
    intent: 'UNITS_BY_CATEGORY',
    description: '按业态类别查询铺位',
    examples: ['餐饮铺位有哪些', '零售业态的铺位', '娱乐类的铺位有哪些', '有哪些做餐饮的铺位'],
    sql: `SELECT unit_code, unit_name, category, sub_category, area_gross_sqm, status, floor_position
          FROM units WHERE mall_id = $1 AND category = $2 ORDER BY unit_code`,
    paramExtractor: (params, ctx) => [ctx.mallId, params.category as string],
    resultType: 'table',
    requireConfirmation: false,
  },

  UNITS_BY_STATUS: {
    name: 'UNITS_BY_STATUS',
    intent: 'UNITS_BY_STATUS',
    description: '按状态查询铺位',
    examples: ['已租的铺位', '装修中的铺位', '已预定的铺位'],
    sql: `SELECT unit_code, unit_name, category, area_gross_sqm, frontage_m, floor_position, status
          FROM units WHERE mall_id = $1 AND status = $2 ORDER BY unit_code`,
    paramExtractor: (params, ctx) => [ctx.mallId, params.status as string],
    resultType: 'table',
    requireConfirmation: false,
  },

  UNIT_DETAIL: {
    name: 'UNIT_DETAIL',
    intent: 'UNIT_DETAIL',
    description: '查询铺位详情',
    examples: ['A-101铺位的信息', '查一下B-203', '单元A-105的详情'],
    sql: `SELECT u.*, f.floor_label,
            l.id as lease_id, l.start_date, l.end_date, l.monthly_rent, l.status as lease_status,
            t.name as tenant_name, t.brand as tenant_brand, t.contact_phone
          FROM units u
          LEFT JOIN floors f ON u.floor_id = f.id
          LEFT JOIN leases l ON u.id = l.unit_id AND l.status != 'terminated'
          LEFT JOIN mall_tenants t ON l.tenant_id = t.id
          WHERE u.mall_id = $1 AND u.unit_code ILIKE $2`,
    paramExtractor: (params, ctx) => [ctx.mallId, `%${params.unitCode || ''}%`],
    resultType: 'detail',
    requireConfirmation: false,
  },

  TENANT_LEASE: {
    name: 'TENANT_LEASE',
    intent: 'TENANT_LEASE',
    description: '查询商户租约信息',
    examples: ['星巴克的租约', '优衣库的合同', '海底捞租约什么时候到期'],
    sql: `SELECT l.*, u.unit_code, u.area_gross_sqm, t.name as tenant_name, t.brand as tenant_brand
          FROM leases l
          JOIN units u ON l.unit_id = u.id
          JOIN mall_tenants t ON l.tenant_id = t.id
          WHERE l.mall_id = $1 AND (t.name ILIKE $2 OR t.brand ILIKE $2)
          ORDER BY l.start_date DESC`,
    paramExtractor: (params, ctx) => [ctx.mallId, `%${params.tenantName || ''}%`],
    resultType: 'table',
    requireConfirmation: false,
  },

  FLOOR_UNITS: {
    name: 'FLOOR_UNITS',
    intent: 'FLOOR_UNITS',
    description: '查询某楼层的铺位列表',
    examples: ['一楼有哪些铺位', '二楼的铺位', 'F1都有什么铺位', 'B1有哪些店'],
    sql: `SELECT u.unit_code, u.unit_name, u.category, u.area_gross_sqm, u.status, u.unit_type
          FROM units u JOIN floors f ON u.floor_id = f.id
          WHERE u.mall_id = $1 AND f.floor_label = $2 ORDER BY u.unit_code`,
    paramExtractor: (params, ctx) => [ctx.mallId, params.floorLabel as string],
    resultType: 'table',
    requireConfirmation: false,
  },

  MALL_STATS: {
    name: 'MALL_STATS',
    intent: 'MALL_STATS',
    description: '商场出租率与面积统计',
    examples: ['商场出租率怎么样', '整体经营情况', '各状态铺位统计', '空置率是多少'],
    sql: `SELECT
            COUNT(*)::int as total_units,
            COUNT(*) FILTER (WHERE status = 'occupied')::int as occupied_units,
            COUNT(*) FILTER (WHERE status = 'vacant')::int as vacant_units,
            COUNT(*) FILTER (WHERE status = 'reserved')::int as reserved_units,
            COUNT(*) FILTER (WHERE status = 'renovation')::int as renovation_units,
            COALESCE(SUM(area_gross_sqm), 0) as total_area_sqm,
            COALESCE(SUM(area_gross_sqm) FILTER (WHERE status = 'occupied'), 0) as occupied_area_sqm,
            ROUND(
              COALESCE(SUM(area_gross_sqm) FILTER (WHERE status = 'occupied'), 0) * 100.0 /
              NULLIF(SUM(area_gross_sqm), 0), 1
            ) as occupancy_rate_pct
          FROM units WHERE mall_id = $1`,
    paramExtractor: (_params, ctx) => [ctx.mallId],
    resultType: 'stats',
    requireConfirmation: false,
  },

  EXPIRING_LEASES: {
    name: 'EXPIRING_LEASES',
    intent: 'EXPIRING_LEASES',
    description: '查询即将到期的租约',
    examples: ['哪些租约快到期了', '未来3个月到期的合同', '即将到期的租约', '30天内到期的合同'],
    sql: `SELECT l.contract_number, l.start_date, l.end_date, l.monthly_rent, l.status,
            u.unit_code, u.area_gross_sqm, t.name as tenant_name, t.contact_phone,
            (l.end_date - CURRENT_DATE) as days_remaining
          FROM leases l JOIN units u ON l.unit_id = u.id JOIN mall_tenants t ON l.tenant_id = t.id
          WHERE l.mall_id = $1 AND l.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($2 || ' days')::INTERVAL
            AND l.status IN ('active', 'expiring_soon')
          ORDER BY l.end_date`,
    paramExtractor: (params, ctx) => [ctx.mallId, String(params.days || 90)],
    resultType: 'table',
    requireConfirmation: false,
  },

  RENT_INCOME: {
    name: 'RENT_INCOME',
    intent: 'RENT_INCOME',
    description: '租金收入汇总',
    examples: ['每月租金收入', '租金汇总', '各业态租金收入', '收租情况'],
    sql: `SELECT l.rent_model, COUNT(*)::int as lease_count,
            COALESCE(SUM(l.monthly_rent), 0) as total_monthly_rent,
            ROUND(COALESCE(AVG(l.rent_per_sqm), 0), 2) as avg_rent_per_sqm,
            COALESCE(SUM(l.deposit_amount), 0) as total_deposits
          FROM leases l WHERE l.mall_id = $1 AND l.status = 'active'
          GROUP BY l.rent_model`,
    paramExtractor: (_params, ctx) => [ctx.mallId],
    resultType: 'stats',
    requireConfirmation: false,
  },

  TENANTS_BY_CATEGORY: {
    name: 'TENANTS_BY_CATEGORY',
    intent: 'TENANTS_BY_CATEGORY',
    description: '按业态查询商户',
    examples: ['餐饮商户有哪些', '零售品牌', '有哪些做教育的商户'],
    sql: `SELECT t.name, t.brand, t.category, t.sub_category, t.tier, t.status,
            t.contact_name, t.contact_phone,
            COUNT(l.id) FILTER (WHERE l.status = 'active')::int as active_leases
          FROM mall_tenants t LEFT JOIN leases l ON t.id = l.tenant_id AND l.status = 'active'
          WHERE t.mall_id = $1 AND t.category = $2
          GROUP BY t.id ORDER BY t.name`,
    paramExtractor: (params, ctx) => [ctx.mallId, params.category as string],
    resultType: 'table',
    requireConfirmation: false,
  },

  PENDING_WORK_ORDERS: {
    name: 'PENDING_WORK_ORDERS',
    intent: 'PENDING_WORK_ORDERS',
    description: '查询待处理工单',
    examples: ['有哪些待处理的工单', '维修工单', '未完成的工单', '报修情况'],
    sql: `SELECT wo.id, wo.title, wo.priority, wo.status, wo.created_at,
            wo.unit_id, u.unit_code, u.floor_position
          FROM work_orders wo LEFT JOIN units u ON wo.unit_id = u.id
          WHERE wo.mall_id = $1 AND wo.status IN ('pending', 'in_progress')
          ORDER BY CASE wo.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                   wo.created_at DESC`,
    paramExtractor: (_params, ctx) => [ctx.mallId],
    resultType: 'table',
    requireConfirmation: false,
  },

  CATEGORY_DISTRIBUTION: {
    name: 'CATEGORY_DISTRIBUTION',
    intent: 'CATEGORY_DISTRIBUTION',
    description: '业态分布统计',
    examples: ['业态分布情况', '各业态占比', '铺位业态构成', '各业态面积占比'],
    sql: `SELECT category, COUNT(*)::int as unit_count,
            COALESCE(SUM(area_gross_sqm), 0) as total_area_sqm,
            COUNT(*) FILTER (WHERE status = 'vacant')::int as vacant_count,
            COUNT(*) FILTER (WHERE status = 'occupied')::int as occupied_count
          FROM units WHERE mall_id = $1
          GROUP BY category ORDER BY unit_count DESC`,
    paramExtractor: (_params, ctx) => [ctx.mallId],
    resultType: 'stats',
    requireConfirmation: false,
  },

  UNIT_COUNT_BY_FLOOR: {
    name: 'UNIT_COUNT_BY_FLOOR',
    intent: 'UNIT_COUNT_BY_FLOOR',
    description: '各楼层铺位统计',
    examples: ['每层有多少铺位', '楼层铺位分布', '各楼层的空铺情况'],
    sql: `SELECT f.floor_label, f.floor_index,
            COUNT(u.id)::int as unit_count,
            COUNT(u.id) FILTER (WHERE u.status = 'occupied')::int as occupied_count,
            COUNT(u.id) FILTER (WHERE u.status = 'vacant')::int as vacant_count,
            COALESCE(SUM(u.area_gross_sqm), 0) as total_area_sqm
          FROM floors f LEFT JOIN units u ON f.id = u.floor_id
          WHERE f.mall_id = $1
          GROUP BY f.id, f.floor_label, f.floor_index
          ORDER BY f.floor_index`,
    paramExtractor: (_params, ctx) => [ctx.mallId],
    resultType: 'table',
    requireConfirmation: false,
  },

  LARGE_VACANT: {
    name: 'LARGE_VACANT',
    intent: 'LARGE_VACANT',
    description: '查询大面积空置铺位',
    examples: ['大面积空铺', '超过100平米的空铺', '大铺位空置情况'],
    sql: `SELECT unit_code, unit_name, category, area_gross_sqm, frontage_m, floor_position, status
          FROM units WHERE mall_id = $1 AND status = 'vacant' AND area_gross_sqm >= $2
          ORDER BY area_gross_sqm DESC`,
    paramExtractor: (params, ctx) => [ctx.mallId, params.minArea || 100],
    resultType: 'table',
    requireConfirmation: false,
  },

  LEASES_BY_STATUS: {
    name: 'LEASES_BY_STATUS',
    intent: 'LEASES_BY_STATUS',
    description: '按状态查询租约',
    examples: ['已到期的租约', '生效中的合同', '已终止的租约'],
    sql: `SELECT l.contract_number, l.start_date, l.end_date, l.monthly_rent, l.rent_model,
            l.status, u.unit_code, t.name as tenant_name, t.contact_phone
          FROM leases l JOIN units u ON l.unit_id = u.id JOIN mall_tenants t ON l.tenant_id = t.id
          WHERE l.mall_id = $1 AND l.status = $2 ORDER BY l.end_date`,
    paramExtractor: (params, ctx) => [ctx.mallId, params.leaseStatus as string],
    resultType: 'table',
    requireConfirmation: false,
  },
}

export const INTENT_DESCRIPTIONS = Object.values(SQL_TEMPLATES).map((t) => ({
  intent: t.intent,
  description: t.description,
  examples: t.examples,
  paramHints: t.paramExtractor.toString(),
}))

export function getTemplate(intent: string): SqlTemplate | undefined {
  return SQL_TEMPLATES[intent]
}

export function buildParameterizedQuery(
  intent: string,
  params: Record<string, unknown>,
  mallId: string,
): { sql: string; params: unknown[] } | null {
  const template = getTemplate(intent)
  if (!template) return null
  return {
    sql: template.sql,
    params: template.paramExtractor(params, { mallId }),
  }
}
