import { Table } from 'antd'
import type { SqlResultData } from '../types'

interface SqlResultCardProps {
  data: SqlResultData
}

export default function SqlResultCard({ data }: SqlResultCardProps) {
  if (!data.rows || data.rows.length === 0) {
    return (
      <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-400 text-center">
        查询结果为空
      </div>
    )
  }

  const columns = data.columns.map((col) => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
    render: (val: unknown) => {
      if (val === null || val === undefined) return <span className="text-gray-300">-</span>
      if (typeof val === 'number') {
        if (col.includes('rate') || col.includes('pct')) return `${val}%`
        if (col.includes('rent') || col.includes('amount') || col.includes('deposit'))
          return `¥${val.toLocaleString()}`
        if (col.includes('area') || col.includes('sqm')) return `${val.toLocaleString()} ㎡`
        return val.toLocaleString()
      }
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        return val.slice(0, 10)
      }
      return String(val)
    },
  }))

  return (
    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-1.5 text-xs text-gray-400 border-b border-gray-100">
        查询结果 ({data.rowCount} 行)
      </div>
      <Table
        columns={columns}
        dataSource={data.rows.map((row, i) => ({ ...row, _key: i }))}
        rowKey="_key"
        size="small"
        pagination={data.rowCount > 20 ? { pageSize: 20, size: 'small' } : false}
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}
