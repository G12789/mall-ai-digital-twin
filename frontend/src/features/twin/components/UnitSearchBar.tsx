import { useState, useMemo } from 'react'
import { AutoComplete, Input } from 'antd'
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons'
import type { MallUnit } from '../../../shared/types/database'

interface UnitSearchBarProps {
  units: MallUnit[]
  onSelect: (unit: MallUnit) => void
  disabled?: boolean
}

export default function UnitSearchBar({ units, onSelect, disabled }: UnitSearchBarProps) {
  const [searchText, setSearchText] = useState('')

  const options = useMemo(() => {
    if (!searchText.trim()) return []
    const q = searchText.toLowerCase()
    return units
      .filter((u) => {
        const code = (u.unit_code || '').toLowerCase()
        const name = (u.unit_name || '').toLowerCase()
        const cat = (u.category || '').toLowerCase()
        return code.includes(q) || name.includes(q) || cat.includes(q)
      })
      .slice(0, 8)
      .map((u) => ({
        value: u.unit_code,
        label: (
          <div className="flex items-center justify-between">
            <span className="font-medium">{u.unit_code}</span>
            <span className="text-xs text-gray-400">
              {u.unit_name || u.category || ''} {u.area_gross_sqm ? `${u.area_gross_sqm}㎡` : ''}
            </span>
          </div>
        ),
        unit: u,
      }))
  }, [searchText, units])

  return (
    <AutoComplete
      value={searchText}
      onChange={setSearchText}
      onSelect={(_, option) => {
        const opt = option as { unit: MallUnit }
        setSearchText(opt.unit.unit_code)
        onSelect(opt.unit)
      }}
      options={options}
      className="w-56"
      disabled={disabled}
    >
      <Input
        prefix={<SearchOutlined className="text-gray-400" />}
        placeholder="搜索铺位编号..."
        allowClear
        size="small"
      />
    </AutoComplete>
  )
}
