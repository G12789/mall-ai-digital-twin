import { Collapse } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import type { SourceRef } from '../types'

interface SourceReferenceProps {
  sources: SourceRef[]
}

export default function SourceReference({ sources }: SourceReferenceProps) {
  return (
    <div className="mt-3 border-t border-gray-100 pt-2">
      <Collapse
        size="small"
        ghost
        items={[{
          key: 'sources',
          label: (
            <span className="text-xs text-gray-400">
              <FileTextOutlined className="mr-1" />
              参考了 {sources.length} 个文档片段
            </span>
          ),
          children: (
            <div className="space-y-2">
              {sources.map((src, i) => (
                <div key={i} className="bg-gray-50 rounded p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700">{src.title}</span>
                    <span className="text-gray-400">
                      相关度: {(src.similarity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-gray-500 line-clamp-3">{src.contentSnippet}</p>
                </div>
              ))}
            </div>
          ),
        }]}
      />
    </div>
  )
}
