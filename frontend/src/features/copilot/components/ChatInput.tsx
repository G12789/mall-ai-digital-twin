import { useState, useRef, type KeyboardEvent } from 'react'
import { Button, Input } from 'antd'
import { SendOutlined } from '@ant-design/icons'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled: boolean
  placeholder?: string
}

const SUGGESTIONS = [
  '商场出租率怎么样？',
  '哪些铺位是空置的？',
  '未来3个月有哪些租约到期？',
  '餐饮业态的铺位分布情况',
]

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex gap-2 mb-2 flex-wrap">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-full transition-colors border-0 cursor-pointer"
            onClick={() => onSend(s)}
            disabled={disabled}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input.TextArea
          ref={inputRef as never}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || '输入问题，如：哪些铺位是空置的？'}
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          loading={disabled}
        />
      </div>
    </div>
  )
}
