export const BUSINESS_CATEGORIES = [
  '餐饮',
  '零售',
  '服务',
  '娱乐',
  '教育',
  '办公',
  '其他',
] as const

export const SUB_CATEGORIES: Record<string, string[]> = {
  '餐饮': ['中餐', '西餐', '日韩料理', '快餐', '咖啡茶饮', '烘焙甜点', '火锅', '烧烤', '小吃'],
  '零售': ['服装', '鞋帽', '化妆品', '珠宝钟表', '数码电子', '家居用品', '超市', '便利店', '书店'],
  '服务': ['美容美发', '健身', '摄影', '洗衣', '宠物', '银行', '快递'],
  '娱乐': ['影院', 'KTV', '电玩', '密室逃脱', '儿童游乐', 'VR体验'],
  '教育': ['早教', 'K12', '艺术培训', '语言培训', '职业技能'],
  '办公': ['联合办公', '企业总部'],
  '其他': ['展厅', '仓库', '其他'],
}

export const UNIT_STATUSES = [
  { value: 'vacant', label: '空置', color: '#ff4d4f' },
  { value: 'occupied', label: '已租', color: '#52c41a' },
  { value: 'reserved', label: '已预定', color: '#faad14' },
  { value: 'off-market', label: '暂不出租', color: '#d9d9d9' },
  { value: 'renovation', label: '装修中', color: '#1677ff' },
]

export const LEASE_STATUSES = [
  { value: 'draft', label: '草稿', color: '#d9d9d9' },
  { value: 'active', label: '生效中', color: '#52c41a' },
  { value: 'expiring_soon', label: '即将到期', color: '#faad14' },
  { value: 'expired', label: '已到期', color: '#ff4d4f' },
  { value: 'terminated', label: '已终止', color: '#8c8c8c' },
]

export const RENT_MODELS = [
  { value: 'fixed', label: '固定租金' },
  { value: 'turnover_percentage', label: '扣点租金' },
  { value: 'hybrid', label: '混合租金（保底+扣点）' },
]
