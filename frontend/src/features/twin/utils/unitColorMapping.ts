const STATUS_COLORS: Record<string, string> = {
  vacant: '#ff4d4f',
  occupied: '#52c41a',
  reserved: '#faad14',
  'off-market': '#d9d9d9',
  renovation: '#1677ff',
}

const STATUS_LABELS: Record<string, string> = {
  vacant: '空置',
  occupied: '已租',
  reserved: '已预定',
  'off-market': '暂不出租',
  renovation: '装修中',
}

export function getUnitColor(status: string | null): string {
  return STATUS_COLORS[status || 'vacant'] || STATUS_COLORS.vacant
}

export function getUnitStatusLabel(status: string | null): string {
  return STATUS_LABELS[status || 'vacant'] || status || '未知'
}

export { STATUS_COLORS, STATUS_LABELS }
